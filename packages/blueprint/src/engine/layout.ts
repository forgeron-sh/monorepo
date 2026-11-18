/**
 * The binary layouts shared by TypeScript and the Rust core (`crates/fg-blueprint`): SceneBin (a
 * resolved scene of a `.bp.json` library) and the packed block list of immediate mode. Defined
 * here once; `crates/fg-blueprint/src/layout.rs` is generated from this file by
 * `scripts/blueprint/gen-layout.ts`, and a test fails when the two disagree.
 *
 * Both are a run of little-endian float64 words (every number of a scene keeps its exact value)
 * followed by UTF-8 bytes (the strings). A record is a fixed number of words, in the order of its
 * field list; an index into another section is a word too, -1 when absent. Absent numbers are NaN.
 */

/** "FGBP" read as a little-endian u32: the first word of a SceneBin. */
export const SCENE_MAGIC = 0x50424746;
/** "FGBL": the first word of a packed block list. */
export const BLOCKS_MAGIC = 0x4c424746;
export const SCENE_VERSION = 1;

/** Field lists of the records, in word order. */
export const RECORDS = {
  /** SceneBin header: magic, version, the length of each section (in records), then the bytes. */
  header: [
    "magic",
    "version",
    "strings",
    "nums",
    "defs",
    "params",
    "prims",
    "points",
    "instances",
    "args",
    "sockets",
    "bytes",
  ],
  /** A string: its UTF-8 bytes in the byte section. */
  string: ["offset", "length"],
  /** A number of the format: a literal, a parameter, or `b + k·param` (`NUM` kinds). */
  num: ["kind", "a", "k", "b"],
  /** A part or an assembly. Index ranges point into the params, prims, instances and sockets. */
  def: [
    "kind",
    "name",
    "params",
    "paramCount",
    "prims",
    "primCount",
    "instances",
    "instanceCount",
    "sockets",
    "socketCount",
  ],
  param: ["name", "type", "default"],
  /**
   * A prim, every kind in one shape. Vectors are the index of their first of three nums; flags
   * are two words (`FLAG` kind, value or param), ink and look choices four (a flag, then, else).
   */
  prim: [
    "kind",
    "layer",
    "decor",
    "visibleKind",
    "visibleA",
    "tag",
    "at",
    "size",
    "anchor",
    "tone",
    "lookKind",
    "lookA",
    "lookThen",
    "lookElse",
    "plate",
    "floors",
    "vents",
    "points",
    "pointCount",
    "inkKind",
    "inkA",
    "inkThen",
    "inkElse",
    "dash",
    "dotSize",
    "text",
    "to",
    "activeKind",
    "activeA",
    "plain",
    "fixed",
  ],
  /** A point of a line prim: the index of its first num. */
  point: ["at"],
  /** `snapTo` is the index of the target instance inside the same assembly. */
  instance: [
    "def",
    "id",
    "at",
    "turn",
    "scale",
    "snapSocket",
    "snapTo",
    "snapToSocket",
    "layer",
    "tag",
    "visibleKind",
    "visibleA",
    "args",
    "argCount",
  ],
  /** A param value given by an instance: a num, or a flag (`ARG` kinds). */
  arg: ["param", "kind", "num", "flagKind", "flagA"],
  /** A part's socket is a point; an assembly's names "instance.socket" (instance index inside it). */
  socket: ["name", "kind", "at", "instance", "socket"],
  /** The scene, after the sections. Its root is an assembly whose params are `t`, the vars, then the root's own. */
  scene: [
    "name",
    "title",
    "root",
    "depth",
    "view",
    "fill",
    "unit",
    "labels",
    "pixel",
    "dither",
    "glowRadius",
    "glowDensity",
  ],
  /** Packed block list header: magic, block count, text bytes. */
  blocksHeader: ["magic", "count", "bytes"],
  /**
   * A block of today's model (`core/types.ts`), as immediate mode reads it. `b` is a box's size,
   * a line's second end, or a label's `to`. Absent fields take the renderer's defaults.
   */
  block: [
    "kind",
    "layer",
    "flags",
    "ax",
    "ay",
    "az",
    "bx",
    "by",
    "bz",
    "toneTop",
    "toneLeft",
    "toneRight",
    "floors",
    "ink",
    "dash",
    "size",
    "tag",
    "text",
    "textLength",
  ],
} as const;

/** Codes of the enumerated words. */
export const CODES = {
  num: { literal: 0, param: 1, linear: 2 },
  flag: { value: 0, param: 1, not: 2 },
  def: { part: 0, assembly: 1 },
  paramType: { number: 0, flag: 1, int: 2 },
  prim: { box: 0, line: 1, dot: 2, label: 3, rig: 4, sprite: 5 },
  anchor: { corner: 0, baseCentre: 1 },
  look: { absent: 0, plain: 1, accent: 2, signal: 3, alert: 4, ghost: 5 },
  vents: { none: -1, px: 0, py: 1, nx: 2, ny: 3 },
  arg: { num: 0, flag: 1 },
  socket: { point: 0, path: 1 },
  depth: { painter: 0, zbuffer: 1 },
  unit: { even: 0, any: 1 },
  block: { box: 0, line: 1, dot: 2, label: 3 },
  /** Ink codes are the palette slots of `core/frame.ts`; 0 means absent. */
  ink: { absent: 0, ink: 2, dim: 3, faint: 4, accent: 5, signal: 6, alert: 7 },
} as const;

/** Bits of a block's `flags` word. */
export const BLOCK_FLAGS = {
  decor: 1,
  accent: 2,
  signal: 4,
  alert: 8,
  ghost: 16,
  plate: 32,
  vents: 64,
  active: 128,
  plain: 256,
  fixed: 512,
  hasTo: 1024,
  hasTone: 2048,
} as const;

export type RecordName = keyof typeof RECORDS;

/** Word offsets of a record's fields, by name. */
export function offsets<R extends RecordName>(
  record: R,
): Record<(typeof RECORDS)[R][number], number> {
  return Object.fromEntries(RECORDS[record].map((field, i) => [field, i])) as Record<
    (typeof RECORDS)[R][number],
    number
  >;
}

/** Words per record. */
export const sizeOf = (record: RecordName): number => RECORDS[record].length;
