import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FONT_LICENCE, licenceFile } from "../config/licence";
import oflText from "../config/ofl-1.1.txt?raw";
import { groupCodepoints, type CharGroup } from "./charmap";
import { toHex } from "./files";
import { parseFont, versionNumber, type FontFile } from "./otf";
import { gridUnit, rasterize } from "./raster";
import { pixelStep } from "./sizes";
import { dosDateTime, zipStore } from "./zip";

/**
 * Everything the site says about the font, read at build time from the files in `public/fonts`.
 * Only build-time code imports this module (it reads the disk); pages pass what the browser needs
 * as JSON.
 */

const FAMILY = "Forgeron Sans";
const WEIGHTS = [
  { style: "Regular", weight: 400 },
  { style: "Medium", weight: 500 },
  { style: "Bold", weight: 700 },
] as const;
type Style = (typeof WEIGHTS)[number]["style"];

const fontFileName = (style: Style) => `ForgeronSans-${style}.otf`;
const LICENCE_FILE = "OFL.txt";

interface WeightData {
  readonly style: Style;
  readonly weight: number;
  readonly file: string;
  /** Grid unit of the outlines, in font units. */
  readonly unit: number;
  /** Smallest pixel-perfect font size, in CSS px. */
  readonly step: number;
  /** Family and style as written in the file's `name` table. */
  readonly internalName: string;
  /** Per code point: its rows from the ascender to the descender, one character per grid unit. */
  readonly bitmaps: Record<number, string[]>;
  /** Per code point: advance width in font units. */
  readonly advances: Record<number, number>;
  /** Per code point: PostScript glyph name. */
  readonly names: Record<number, string>;
}

interface FileInfo {
  readonly name: string;
  readonly href: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface Specimen {
  readonly family: string;
  readonly version: string;
  readonly unitsPerEm: number;
  readonly ascender: number;
  readonly descender: number;
  readonly capHeight: number;
  readonly xHeight: number;
  readonly tables: readonly string[];
  readonly glyphCount: number;
  readonly codepoints: readonly number[];
  readonly groups: readonly { group: CharGroup; cps: readonly number[] }[];
  readonly weights: readonly WeightData[];
  readonly files: readonly FileInfo[];
  readonly licenceFile: FileInfo;
  readonly archive: FileInfo;
}

const sha256 = (bytes: Uint8Array) => toHex(createHash("sha256").update(bytes).digest());

function weightData(style: Style, weight: number, font: FontFile): WeightData {
  const unit = gridUnit(font);
  const bitmaps: Record<number, string[]> = {};
  const advances: Record<number, number> = {};
  const names: Record<number, string> = {};
  for (const [cp, gid] of font.cmap) {
    const glyph = font.glyphs[gid];
    if (!glyph) continue;
    bitmaps[cp] = rasterize(glyph, unit, font.ascender, font.descender);
    advances[cp] = glyph.advance;
    names[cp] = glyph.name;
  }
  return {
    style,
    weight,
    file: fontFileName(style),
    unit,
    step: pixelStep(font.unitsPerEm, unit),
    internalName: `${font.family} ${font.style}`,
    bitmaps,
    advances,
    names,
  };
}

/** The archive's name: family and version from the Regular file. */
const archiveName = (version: string) => `ForgeronSans-${version}.zip`;

/** The licence file, from the single licence constant. */
export const licenceBytes = () => new TextEncoder().encode(licenceFile(FONT_LICENCE, oflText));

let cache: { dir: string; specimen: Specimen; archive: Uint8Array<ArrayBuffer> } | null = null;

/** Reads, parses and describes the three font files of `dir`. */
export function loadSpecimen(dir = join(process.cwd(), "public/fonts")): {
  specimen: Specimen;
  archive: Uint8Array<ArrayBuffer>;
} {
  if (cache?.dir === dir) return cache;
  const raw = WEIGHTS.map(({ style }) => {
    const bytes = new Uint8Array(readFileSync(join(dir, fontFileName(style))));
    return { style, bytes, font: parseFont(bytes) };
  });
  const regular = raw[0]!.font;
  const version = versionNumber(regular.version);
  const licence = licenceBytes();
  const archive = zipStore(
    [
      ...raw.map(({ style, bytes }) => ({
        name: `ForgeronSans-${version}/${fontFileName(style)}`,
        data: bytes,
      })),
      { name: `ForgeronSans-${version}/${LICENCE_FILE}`, data: licence },
    ],
    dosDateTime(2026, 11, 16),
  );
  const codepoints = [...regular.cmap.keys()].sort((a, b) => a - b);
  const specimen: Specimen = {
    family: FAMILY,
    version,
    unitsPerEm: regular.unitsPerEm,
    ascender: regular.ascender,
    descender: regular.descender,
    capHeight: regular.capHeight,
    xHeight: regular.xHeight,
    tables: regular.tables.map((t) => t.trim()),
    glyphCount: regular.glyphs.length,
    codepoints,
    groups: groupCodepoints(codepoints),
    weights: raw.map(({ style, font }, i) => weightData(style, WEIGHTS[i]!.weight, font)),
    files: raw.map(({ style, bytes }) => ({
      name: fontFileName(style),
      href: `/fonts/${fontFileName(style)}`,
      bytes: bytes.length,
      sha256: sha256(bytes),
    })),
    licenceFile: {
      name: LICENCE_FILE,
      href: `/${LICENCE_FILE}`,
      bytes: licence.length,
      sha256: sha256(licence),
    },
    archive: {
      name: archiveName(version),
      href: `/downloads/${archiveName(version)}`,
      bytes: archive.length,
      sha256: sha256(archive),
    },
  };
  cache = { dir, specimen, archive };
  return cache;
}
