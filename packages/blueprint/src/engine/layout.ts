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
    "rigArgs",
    "vars",
    "timelines",
    "tracks",
    "keys",
    "machines",
    "states",
    "plays",
    "sets",
    "transitions",
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
    "rig",
    "rigArgs",
    "rigArgCount",
  ],
  /**
   * A setting of a rig prim (`with`): a num or the first num of a vector, a flag, an ink choice,
   * or a name (`"plane": "yz"`), by `RIG_ARG` kind.
   */
  rigArg: ["name", "kind", "num", "flagKind", "flagA", "then", "else", "text"],
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
  /**
   * A var of the scene (P3): `slot` is its index in the root scope (-1 for `time` and `pointer`),
   * `every` and `count` an int var's cycle (NaN when it has none).
   */
  var: ["name", "type", "slot", "default", "every", "count"],
  /**
   * A timeline: its clock (`CLOCK` kind, and the root scope slot of a var clock), its length (NaN
   * when it has none) and loop, and its range of tracks.
   */
  timeline: ["name", "clock", "clockSlot", "length", "loop", "tracks", "trackCount"],
  /**
   * A track, every kind in one shape (`TRACK` kinds). `target` is an instance index (-1: the
   * scene's root), `channel` a `CHANNEL` code and `param` the index of a param in the target's
   * scope. Paths are runs of the point section; keys a run of the key section; a conveyor's
   * `use` is a definition and its params a run of the arg section (in the root scope).
   */
  track: [
    "kind",
    "target",
    "channel",
    "param",
    "keys",
    "keyCount",
    "path",
    "pathCount",
    "rate",
    "phase",
    "period",
    "on",
    "at",
    "seed",
    "duration",
    "delay",
    "ease",
    "use",
    "count",
    "speed",
    "wave",
    "amp",
    "base",
    "clip",
    "toSlot",
    "toThen",
    "toElse",
    "args",
    "argCount",
  ],
  /** A key of a key or visible track: its time, its value (three words for a vector), its ease. */
  key: ["t", "v0", "v1", "v2", "ease"],
  machine: ["name", "initial", "states", "stateCount", "transitions", "transitionCount"],
  /** A state: the timelines it plays and the vars it sets (runs of the play and set sections). */
  state: ["name", "plays", "playCount", "sets", "setCount", "shot"],
  play: ["timeline"],
  set: ["slot", "value"],
  /** `from` and `to` are state indices of the machine (`from` -1: any state); `WHEN` kinds. */
  transition: ["from", "to", "when", "slot", "lo", "hi", "value", "after", "event", "dissolve"],
  /**
   * The inputs block of a handle, written by the host before each `frame` call: the clock, the
   * pointer in raster pixels, the byte length of a packed block list in the handle's block buffer
   * (the script layer, 0 for none), queued events (string indices). The root scope's host values
   * follow, one word each (NaN: not set by the host).
   */
  inputs: [
    "time",
    "dt",
    "pointerX",
    "pointerY",
    "pointerIn",
    "blocks",
    "eventCount",
    "event0",
    "event1",
    "event2",
    "event3",
    "event4",
    "event5",
    "event6",
    "event7",
  ],
  /**
   * The outputs block, written by `frame`: its flags (`FRAME_FLAGS`), the hovered tag (string
   * index + 1, 0 for none), the frame count. The root scope's values follow, then the current
   * state of each machine.
   */
  outputs: ["flags", "hover", "frames"],
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
  rigArg: { num: 0, vec: 1, flag: 2, ink: 3, name: 4 },
  rig: { wheel: 0, arm: 1, fan: 2, piston: 3, pendulum: 4, smoke: 5, sparks: 6 },
  varType: { time: 0, progress: 1, int: 2, pointer: 3 },
  clock: { time: 0, var: 1 },
  loopMode: { none: -1, loop: 0, pingPong: 1, once: 2 },
  track: {
    key: 0,
    visible: 1,
    spin: 2,
    path: 3,
    conveyor: 4,
    blink: 5,
    spring: 6,
    wave: 7,
  },
  channel: { at: 0, turn: 1, scale: 2, param: 3, visible: 4 },
  ease: { linear: 0, step: 1, smooth: 2, glide: 3, in: 4, out: 5, inOut: 6 },
  wave: { sin: 0, cos: 1 },
  when: { range: 0, equals: 1, after: 2, event: 3 },
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

/** Bits of the `flags` word of the outputs block (and of `frame`'s return value). */
export const FRAME_FLAGS = {
  /** The raster was drawn this frame (a frame whose inputs did not change is not). */
  drawn: 1,
  /** A root scope value changed (`on("active")`). */
  vars: 2,
  /** A machine changed state. */
  state: 4,
  /** The hovered tag changed. */
  hover: 8,
  /** An error: `error_ptr`, `error_len`. */
  error: 16,
} as const;

/** Events a frame takes at most (more are dropped). */
export const MAX_EVENTS = 8;

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
