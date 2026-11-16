/**
 * A minimal reader of OpenType-CFF files, enough to describe Forge Sans from its own files: the
 * table directory, `head`, `hhea`, `maxp`, `OS/2`, `name`, `cmap` (formats 4 and 12), `hmtx` and the
 * CFF charset and charstrings. Forge Sans is drawn with straight lines only, so the charstring
 * interpreter knows the move and line operators and refuses anything else (curves, hints, subroutines)
 * rather than guessing.
 */

export type Point = readonly [x: number, y: number];
/** A closed outline: the last point joins the first. */
export type Contour = readonly Point[];

export interface FontGlyph {
  readonly id: number;
  /** PostScript name from the CFF charset (`u0041`, `.notdef`). */
  readonly name: string;
  /** Advance width, in font units. */
  readonly advance: number;
  readonly contours: readonly Contour[];
}

export interface FontFile {
  readonly family: string;
  readonly style: string;
  /** `name` record 5, as written (`Version 0.1`). */
  readonly version: string;
  readonly unitsPerEm: number;
  readonly ascender: number;
  readonly descender: number;
  readonly lineGap: number;
  readonly xHeight: number;
  readonly capHeight: number;
  readonly weightClass: number;
  /** Table tags, in file order. */
  readonly tables: readonly string[];
  readonly glyphs: readonly FontGlyph[];
  /** Unicode code point → glyph id. */
  readonly cmap: ReadonlyMap<number, number>;
}

class Reader {
  readonly view: DataView;
  constructor(readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  u8 = (at: number) => this.view.getUint8(at);
  u16 = (at: number) => this.view.getUint16(at);
  i16 = (at: number) => this.view.getInt16(at);
  u32 = (at: number) => this.view.getUint32(at);
  tag = (at: number) =>
    String.fromCharCode(this.u8(at), this.u8(at + 1), this.u8(at + 2), this.u8(at + 3));
  /** Big-endian unsigned integer of `size` bytes (CFF offsets are 1 to 4 bytes). */
  uint(at: number, size: number): number {
    let v = 0;
    for (let i = 0; i < size; i++) v = v * 256 + this.u8(at + i);
    return v;
  }
}

interface TableRecord {
  readonly offset: number;
  readonly length: number;
}

function tableDirectory(r: Reader): { tags: string[]; records: Map<string, TableRecord> } {
  const version = r.u32(0);
  if (version !== 0x4f54544f && version !== 0x00010000) throw new Error("Not an OpenType file");
  const count = r.u16(4);
  const tags: string[] = [];
  const records = new Map<string, TableRecord>();
  for (let i = 0; i < count; i++) {
    const at = 12 + i * 16;
    const tag = r.tag(at);
    tags.push(tag);
    records.set(tag, { offset: r.u32(at + 8), length: r.u32(at + 12) });
  }
  return { tags, records };
}

function need(records: Map<string, TableRecord>, tag: string): TableRecord {
  const t = records.get(tag);
  if (!t) throw new Error(`Missing table ${tag}`);
  return t;
}

function readNames(r: Reader, at: number): Map<number, string> {
  const count = r.u16(at + 2);
  const strings = at + r.u16(at + 4);
  const out = new Map<number, string>();
  const mac = new Map<number, string>();
  for (let i = 0; i < count; i++) {
    const rec = at + 6 + i * 12;
    const platform = r.u16(rec);
    const nameId = r.u16(rec + 6);
    const length = r.u16(rec + 8);
    const start = strings + r.u16(rec + 10);
    if (platform === 3) {
      let s = "";
      for (let j = 0; j < length; j += 2) s += String.fromCharCode(r.u16(start + j));
      out.set(nameId, s.trim());
    } else if (platform === 1) {
      let s = "";
      for (let j = 0; j < length; j++) s += String.fromCharCode(r.u8(start + j));
      mac.set(nameId, s.trim());
    }
  }
  for (const [id, s] of mac) if (!out.has(id)) out.set(id, s);
  return out;
}

function readCmap(r: Reader, at: number): Map<number, number> {
  const count = r.u16(at + 2);
  let best = -1;
  let bestFormat = 0;
  for (let i = 0; i < count; i++) {
    const rec = at + 4 + i * 8;
    const platform = r.u16(rec);
    const encoding = r.u16(rec + 2);
    const sub = at + r.u32(rec + 4);
    const format = r.u16(sub);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode) continue;
    if (format === 12 || (format === 4 && bestFormat !== 12)) {
      best = sub;
      bestFormat = format;
    }
  }
  if (best < 0) throw new Error("No Unicode cmap subtable");
  const map = new Map<number, number>();
  if (bestFormat === 4) {
    const segs = r.u16(best + 6) / 2;
    const ends = best + 14;
    const starts = ends + segs * 2 + 2;
    const deltas = starts + segs * 2;
    const ranges = deltas + segs * 2;
    for (let s = 0; s < segs; s++) {
      const end = r.u16(ends + s * 2);
      const start = r.u16(starts + s * 2);
      const delta = r.i16(deltas + s * 2);
      const rangeAt = ranges + s * 2;
      const range = r.u16(rangeAt);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let gid: number;
        if (range === 0) gid = (c + delta) & 0xffff;
        else {
          const g = r.u16(rangeAt + range + (c - start) * 2);
          gid = g === 0 ? 0 : (g + delta) & 0xffff;
        }
        if (gid !== 0) map.set(c, gid);
      }
    }
  } else {
    const groups = r.u32(best + 12);
    for (let g = 0; g < groups; g++) {
      const rec = best + 16 + g * 12;
      const start = r.u32(rec);
      const end = r.u32(rec + 4);
      const first = r.u32(rec + 8);
      for (let c = start; c <= end; c++) map.set(c, first + c - start);
    }
  }
  return map;
}

/** A CFF INDEX: the byte ranges of its items, and where the next structure starts. */
function cffIndex(r: Reader, at: number): { items: [number, number][]; end: number } {
  const count = r.u16(at);
  if (count === 0) return { items: [], end: at + 2 };
  const size = r.u8(at + 2);
  const base = at + 3 + (count + 1) * size - 1;
  const items: [number, number][] = [];
  let prev = r.uint(at + 3, size);
  for (let i = 1; i <= count; i++) {
    const next = r.uint(at + 3 + i * size, size);
    items.push([base + prev, base + next]);
    prev = next;
  }
  return { items, end: base + prev };
}

/** The operators of a CFF DICT, each with its operands. Escaped operators are `1200 + b1`. */
function cffDict(r: Reader, start: number, end: number): Map<number, number[]> {
  const out = new Map<number, number[]>();
  let operands: number[] = [];
  let p = start;
  while (p < end) {
    const b0 = r.u8(p);
    if (b0 <= 21) {
      const op = b0 === 12 ? 1200 + r.u8(p + 1) : b0;
      p += b0 === 12 ? 2 : 1;
      out.set(op, operands);
      operands = [];
    } else if (b0 === 28) {
      operands.push(r.i16(p + 1));
      p += 3;
    } else if (b0 === 29) {
      operands.push(r.view.getInt32(p + 1));
      p += 5;
    } else if (b0 === 30) {
      // Real number: nibbles until 0xf. Not needed for the offsets we read; skipped, kept as 0.
      p++;
      while (p < end) {
        const b = r.u8(p++);
        if ((b & 0x0f) === 0x0f || b >> 4 === 0x0f) break;
      }
      operands.push(0);
    } else if (b0 >= 32 && b0 <= 246) {
      operands.push(b0 - 139);
      p++;
    } else if (b0 >= 247 && b0 <= 250) {
      operands.push((b0 - 247) * 256 + r.u8(p + 1) + 108);
      p += 2;
    } else if (b0 >= 251 && b0 <= 254) {
      operands.push(-(b0 - 251) * 256 - r.u8(p + 1) - 108);
      p += 2;
    } else throw new Error(`Bad CFF DICT byte ${b0}`);
  }
  return out;
}

/** Number of standard strings in CFF: custom string ids start here. */
const STANDARD_STRINGS = 391;

function glyphNames(
  r: Reader,
  cff: number,
  offset: number,
  glyphs: number,
  strings: string[],
): string[] {
  const names = [".notdef"];
  if (offset <= 2) throw new Error("Predefined CFF charsets are not supported");
  const at = cff + offset;
  const format = r.u8(at);
  const sids: number[] = [];
  let p = at + 1;
  while (sids.length < glyphs - 1) {
    if (format === 0) {
      sids.push(r.u16(p));
      p += 2;
    } else if (format === 1 || format === 2) {
      const first = r.u16(p);
      const left = format === 1 ? r.u8(p + 2) : r.u16(p + 2);
      p += format === 1 ? 3 : 4;
      for (let i = 0; i <= left; i++) sids.push(first + i);
    } else throw new Error(`Bad CFF charset format ${format}`);
  }
  for (const sid of sids.slice(0, glyphs - 1))
    names.push(
      sid >= STANDARD_STRINGS ? (strings[sid - STANDARD_STRINGS] ?? `sid${sid}`) : `sid${sid}`,
    );
  return names;
}

/**
 * Runs a Type 2 charstring made of moves and lines only. Returns its outlines and the width
 * when the charstring carries one (relative to `nominalWidthX`).
 */
export function runCharstring(
  bytes: Uint8Array,
  nominalWidth = 0,
): { contours: Point[][]; width: number | null } {
  const contours: Point[][] = [];
  let current: Point[] | null = null;
  let stack: number[] = [];
  let width: number | null = null;
  let first = true;
  let x = 0;
  let y = 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const takeWidth = (expected: number) => {
    if (first && stack.length > expected) width = nominalWidth + (stack.shift() ?? 0);
    first = false;
  };
  const moveTo = (dx: number, dy: number) => {
    x += dx;
    y += dy;
    current = [[x, y]];
    contours.push(current);
  };
  const lineTo = (dx: number, dy: number) => {
    x += dx;
    y += dy;
    if (!current) throw new Error("Line before a move");
    current.push([x, y]);
  };
  let p = 0;
  while (p < bytes.length) {
    const b0 = bytes[p] ?? 0;
    if (b0 >= 32 || b0 === 28) {
      if (b0 === 28) {
        stack.push(view.getInt16(p + 1));
        p += 3;
      } else if (b0 <= 246) {
        stack.push(b0 - 139);
        p++;
      } else if (b0 <= 250) {
        stack.push((b0 - 247) * 256 + (bytes[p + 1] ?? 0) + 108);
        p += 2;
      } else if (b0 <= 254) {
        stack.push(-(b0 - 251) * 256 - (bytes[p + 1] ?? 0) - 108);
        p += 2;
      } else {
        stack.push(view.getInt32(p + 1) / 65536);
        p += 5;
      }
      continue;
    }
    p++;
    switch (b0) {
      case 21: // rmoveto
        takeWidth(2);
        moveTo(stack[0] ?? 0, stack[1] ?? 0);
        break;
      case 22: // hmoveto
        takeWidth(1);
        moveTo(stack[0] ?? 0, 0);
        break;
      case 4: // vmoveto
        takeWidth(1);
        moveTo(0, stack[0] ?? 0);
        break;
      case 5: // rlineto
        for (let i = 0; i + 1 < stack.length; i += 2) lineTo(stack[i] ?? 0, stack[i + 1] ?? 0);
        break;
      case 6: // hlineto: alternate horizontal and vertical
      case 7: // vlineto: alternate vertical and horizontal
        for (let i = 0; i < stack.length; i++) {
          const horizontal = (i % 2 === 0) === (b0 === 6);
          lineTo(horizontal ? (stack[i] ?? 0) : 0, horizontal ? 0 : (stack[i] ?? 0));
        }
        break;
      case 14: // endchar
        takeWidth(0);
        return { contours, width };
      default:
        throw new Error(`Unsupported charstring operator ${b0}`);
    }
    stack = [];
  }
  return { contours, width };
}

/** Drops the closing point when a contour returns to its start explicitly. */
function closed(points: Point[]): Contour {
  const a = points[0];
  const b = points[points.length - 1];
  if (points.length > 1 && a && b && a[0] === b[0] && a[1] === b[1]) return points.slice(0, -1);
  return points;
}

export function parseFont(bytes: Uint8Array): FontFile {
  const r = new Reader(bytes);
  const { tags, records } = tableDirectory(r);
  const head = need(records, "head").offset;
  const hhea = need(records, "hhea").offset;
  const maxp = need(records, "maxp").offset;
  const os2 = need(records, "OS/2").offset;
  const hmtx = need(records, "hmtx").offset;
  const cffAt = need(records, "CFF ").offset;

  const numGlyphs = r.u16(maxp + 4);
  const metrics = r.u16(hhea + 34);
  const advances: number[] = [];
  for (let g = 0; g < numGlyphs; g++) advances.push(r.u16(hmtx + Math.min(g, metrics - 1) * 4));

  const names = readNames(r, need(records, "name").offset);
  const os2Version = r.u16(os2);

  // CFF: header, Name INDEX, Top DICT INDEX, String INDEX.
  const nameIndex = cffIndex(r, cffAt + r.u8(cffAt + 2));
  const topIndex = cffIndex(r, nameIndex.end);
  const stringIndex = cffIndex(r, topIndex.end);
  const strings = stringIndex.items.map(([a, b]) => String.fromCharCode(...bytes.subarray(a, b)));
  const top = topIndex.items[0];
  if (!top) throw new Error("Empty CFF Top DICT");
  const dict = cffDict(r, top[0], top[1]);
  const charStringsAt = dict.get(17)?.[0];
  if (charStringsAt === undefined) throw new Error("No CharStrings in CFF");
  const priv = dict.get(18);
  let nominalWidth = 0;
  if (priv && priv.length === 2) {
    const [size = 0, offset = 0] = priv;
    nominalWidth = cffDict(r, cffAt + offset, cffAt + offset + size).get(21)?.[0] ?? 0;
  }
  const charStrings = cffIndex(r, cffAt + charStringsAt).items;
  const glyphNameList = glyphNames(r, cffAt, dict.get(15)?.[0] ?? 0, numGlyphs, strings);

  const glyphs: FontGlyph[] = charStrings.map(([a, b], id) => {
    const { contours } = runCharstring(bytes.subarray(a, b), nominalWidth);
    return {
      id,
      name: glyphNameList[id] ?? `glyph${id}`,
      advance: advances[id] ?? 0,
      contours: contours.map(closed),
    };
  });

  return {
    family: names.get(16) ?? names.get(1) ?? "",
    style: names.get(17) ?? names.get(2) ?? "",
    version: names.get(5) ?? "",
    unitsPerEm: r.u16(head + 18),
    ascender: r.i16(hhea + 4),
    descender: r.i16(hhea + 6),
    lineGap: r.i16(hhea + 8),
    xHeight: os2Version >= 2 ? r.i16(os2 + 86) : 0,
    capHeight: os2Version >= 2 ? r.i16(os2 + 88) : 0,
    weightClass: r.u16(os2 + 4),
    tables: tags,
    glyphs,
    cmap: readCmap(r, need(records, "cmap").offset),
  };
}

/** `Version 0.1` → `0.1`. */
export function versionNumber(version: string): string {
  return /(\d+(?:\.\d+)*)/.exec(version)?.[1] ?? version;
}
