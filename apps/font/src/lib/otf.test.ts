import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFont, runCharstring, versionNumber } from "./otf";
import { embolden, gridUnit, rasterize, scanRuns, stretchColumns } from "./raster";

const dir = fileURLToPath(new URL("../../public/fonts/", import.meta.url));
const load = (style: string) =>
  parseFont(new Uint8Array(readFileSync(`${dir}ForgeronSans-${style}.otf`)));
const regular = load("Regular");
const medium = load("Medium");
const bold = load("Bold");

const glyphOf = (font: typeof regular, ch: string) => {
  const gid = font.cmap.get(ch.codePointAt(0) ?? 0);
  const glyph = gid === undefined ? undefined : font.glyphs[gid];
  if (!glyph) throw new Error(`no glyph for ${ch}`);
  return glyph;
};

describe("runCharstring", () => {
  it("reads the width, moves and lines of a Type 2 charstring", () => {
    // 600 0 700 rmoveto · 0 -700 rlineto · 100 0 rlineto · endchar
    const enc = (n: number) => (n >= -107 && n <= 107 ? [n + 139] : [28, (n >> 8) & 255, n & 255]);
    const bytes = new Uint8Array([
      ...enc(600),
      ...enc(0),
      ...enc(700),
      21,
      ...enc(0),
      ...enc(-700),
      5,
      ...enc(100),
      ...enc(0),
      5,
      14,
    ]);
    const { width, contours } = runCharstring(bytes);
    expect(width).toBe(600);
    expect(contours).toEqual([
      [
        [0, 700],
        [0, 0],
        [100, 0],
      ],
    ]);
  });

  it("refuses curves rather than guessing", () => {
    expect(() => runCharstring(new Uint8Array([139, 139, 21, 8]))).toThrow(/Unsupported/);
  });
});

describe("parseFont on the shipped files", () => {
  it("reads the metrics of the 5-pixel grid", () => {
    expect(regular.unitsPerEm).toBe(1000);
    expect([regular.ascender, regular.capHeight, regular.xHeight, regular.descender]).toEqual([
      900, 700, 500, -200,
    ]);
    expect(regular.tables.map((t) => t.trim())).toContain("CFF");
  });

  it("maps the same characters in the three weights", () => {
    expect(regular.cmap.size).toBeGreaterThan(90);
    expect([...medium.cmap.keys()]).toEqual([...regular.cmap.keys()]);
    expect([...bold.cmap.keys()]).toEqual([...regular.cmap.keys()]);
    expect(glyphOf(regular, "A").name).toBe("u0041");
  });

  it("keeps the internal name the files were generated with", () => {
    // The family was renamed Forgeron Sans; the files still carry their original name table.
    expect(regular.family).toBe("Forge Sans");
    expect(versionNumber(regular.version)).toBe("0.1");
  });
});

describe("the grid in the files", () => {
  it("draws Regular and Bold on whole pixels and Medium on half pixels", () => {
    expect(gridUnit(regular)).toBe(100);
    expect(gridUnit(bold)).toBe(100);
    expect(gridUnit(medium)).toBe(50);
  });

  it("rasterises A back to its pixels, with one column of spacing", () => {
    expect(rasterize(glyphOf(regular, "A"), 100, 900, -200)).toEqual([
      "......",
      "......",
      "#####.",
      "#...#.",
      "#...#.",
      "#####.",
      "#...#.",
      "#...#.",
      "#...#.",
      "......",
      "......",
    ]);
  });

  it("has Bold stems of two pixels and Medium stems of one and a half", () => {
    expect(scanRuns(glyphOf(regular, "H"), 150, 50)).toEqual([
      [0, 100],
      [400, 500],
    ]);
    expect(scanRuns(glyphOf(medium, "H"), 150, 50)).toEqual([
      [0, 150],
      [400, 550],
    ]);
    expect(scanRuns(glyphOf(bold, "H"), 150, 50)).toEqual([
      [0, 200],
      [400, 600],
    ]);
  });

  it("derives Bold from Regular with a one-pixel embolden and Medium with a half-pixel one", () => {
    for (const cp of regular.cmap.keys()) {
      const ch = String.fromCodePoint(cp);
      const reg = rasterize(glyphOf(regular, ch), 100, 900, -200).map((r) => r.slice(0, -1));
      const b = rasterize(glyphOf(bold, ch), 100, 900, -200);
      // The character leads each comparison, so a failure names the glyph.
      expect([ch, ...b]).toEqual([ch, ...embolden(reg).map((r) => `${r}.`)]);
      const m = rasterize(glyphOf(medium, ch), 50, 900, -200);
      const halves = embolden(stretchColumns(reg, 2)).flatMap((r) => [`${r}..`, `${r}..`]);
      expect([ch, ...m]).toEqual([ch, ...halves]);
    }
  });
});
