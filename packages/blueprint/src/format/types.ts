/**
 * The Blueprint file format, version 1: a library of Parts, Assemblies and Scenes in one JSON
 * file (`*.bp`). The normative description is `docs/blueprint/format.md`; the JSON schema
 * (`schema.ts`, published as `schema/blueprint.v1.json`) states the same shapes for editors.
 */

export type Vec3 = readonly [x: number, y: number, z: number];
/** Quarter turns about +z, counter-clockwise seen from above. */
export type Turn = 0 | 1 | 2 | 3;
export type Ink = "ink" | "dim" | "faint" | "accent" | "signal" | "alert";

/** A parameter reference: `"@lift"`. */
export type ParamRef = `@${string}`;
/** A number, a parameter (`"@lift"`), or `b + k·param`. */
export type Num = number | ParamRef | { p: string; k?: number; b?: number };
export type NumVec = readonly [Num, Num, Num];
/** A boolean or a parameter; `{ not: "@on" }` inverts. */
export type Flag = boolean | ParamRef | { not: ParamRef };
/** An ink, or a choice on a flag. */
export type InkRef = Ink | { if: Flag; then: Ink; else: Ink };

export const SCHEMA_URL = "https://blueprint.forgeron.sh/schema/v1.json";
export const FORMAT_VERSION = 1;

export interface BlueprintFile {
  $schema: typeof SCHEMA_URL;
  version: 1;
  /** Stable id of the file: "site/objects". */
  id: string;
  imports?: Import[];
  palette?: Palette;
  parts?: Record<string, Part>;
  assemblies?: Record<string, Assembly>;
  scenes?: Record<string, Scene>;
}

export interface Import {
  /** A path relative to this file, or a package path ("@forgeron/blueprint-library/office.bp"). */
  from: string;
  /** Names to take; all when absent. */
  use?: string[];
  /** Prefix of the imported names: `as: "office"` gives "office:server". */
  as: string;
}

export type PaletteSlot = "bg" | Ink;
/** Palette slots → colour references, as the filters' `palette` today. */
export type Palette = Partial<Record<PaletteSlot, string | { var: string; fallback: string }>>;

// ── Part ─────────────────────────────────────────────────────────────────────

export interface ParamSpec {
  type: "number" | "flag" | "int";
  default: number | boolean;
}

export type Facing = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

export interface Socket {
  at: NumVec;
  facing?: Facing;
}

export interface Part {
  title?: string;
  /** Inputs of the part, animatable by tracks: their defaults make the part's still picture. */
  params?: Record<string, ParamSpec>;
  prims: Prim[];
  /** Named anchor points, for snapping and for tracks that follow a point. */
  sockets?: Record<string, Socket>;
}

interface PrimBase {
  /** Painter mode only: lower layers first (kept from today's `layer`). */
  layer?: number;
  /** Scenery: drawn, never used to frame (today's `decor`). */
  decor?: boolean;
  visible?: Flag;
  /** Hover and legend tag: written into the id buffer. */
  tag?: string;
}

export type BoxLook = "plain" | "accent" | "signal" | "alert" | "ghost";
export type SideFace = "+x" | "+y" | "-x" | "-y";

export interface BoxPrim extends PrimBase {
  kind: "box";
  at: NumVec;
  size: NumVec;
  /** `corner` (default, today's `box`) or `base-centre` (today's `block`). */
  anchor?: "corner" | "base-centre";
  tone?: readonly [top: Num, left: Num, right: Num];
  /** Material of the box: today's flags, one at a time. */
  look?: BoxLook | { if: Flag; then: BoxLook; else: BoxLook };
  plate?: boolean;
  floors?: Num;
  /** Vents on a face of the part's own frame; "+x" is today's right face. */
  vents?: SideFace;
}

export interface LinePrim extends PrimBase {
  kind: "line";
  /** Two points, or more for a polyline. */
  points: readonly NumVec[];
  ink?: InkRef;
  dash?: number;
}

export interface DotPrim extends PrimBase {
  kind: "dot";
  at: NumVec;
  ink?: InkRef;
  size?: number;
}

export interface LabelPrim extends PrimBase {
  kind: "label";
  at: NumVec;
  text: string;
  to?: NumVec;
  active?: Flag;
  plain?: boolean;
  fixed?: boolean;
  ink?: InkRef;
}

export type RigName =
  | "wheel"
  | "arm"
  | "fan"
  | "piston"
  | "pendulum"
  | "smoke"
  | "sparks"
  | "burst"
  | "mushroom"
  | "pile"
  | "fence"
  | "ash";

/** A parametric generator built into the engine (the functions of today's `parts.ts`). */
export interface RigPrim extends PrimBase {
  kind: "rig";
  rig: RigName;
  /** The rig's own settings and channels. */
  with: Record<string, Num | NumVec | Flag | InkRef | string>;
}

/** Reserved for v1.1: a screen-aligned pixel bitmap from the file's sprite table. */
export interface SpritePrim extends PrimBase {
  kind: "sprite";
  at: NumVec;
  sprite: string;
}

export type Prim = BoxPrim | LinePrim | DotPrim | LabelPrim | RigPrim | SpritePrim;

// ── Assembly ─────────────────────────────────────────────────────────────────

export interface Assembly {
  title?: string;
  params?: Part["params"];
  instances: Instance[];
  /** Sockets of inner instances exposed as this assembly's own: "door": "body.front". */
  sockets?: Record<string, string>;
}

export interface Instance {
  /** Target of tracks, states and tags: unique inside its assembly; paths join with "/". */
  id?: string;
  /** A part or assembly name, local or imported ("office:server"). */
  use: string;
  at?: NumVec;
  turn?: Turn;
  /** Uniform scale (today's `s` argument of the objects). */
  scale?: number;
  /** Place by socket instead of `at`: my socket onto "otherInstance.socket". */
  snap?: { socket: string; to: string };
  /** Values for the used part's params: literals, or this assembly's params ("@on"). */
  params?: Record<string, Num | Flag>;
  /** Added to every prim's layer (painter mode). */
  layer?: number;
  tag?: string;
  visible?: Flag;
}

// ── Scene ────────────────────────────────────────────────────────────────────

export interface Scene {
  title: string;
  /** Read by assistive technology. */
  description?: string;
  root: Assembly;
  camera: Camera;
  /** "painter" reproduces today's order exactly; "zbuffer" uses a real depth buffer. */
  depth: "painter" | "zbuffer";
  palette?: Palette;
  /** The material-aware stage, run by the engine on the raster (today's filters). */
  filters?: {
    pixel?: number;
    dither?: 2 | 4 | 8 | "none";
    glow?: { radius: number; density: number };
  };
  /** Post passes on the presented image, by `@forgeron/shaders` preset id. */
  post?: string[];
  labels?: boolean;
  /** Inputs from the host and from the scene itself. */
  vars?: Record<string, Var>;
  timelines?: Record<string, Timeline>;
  machines?: Record<string, StateMachine>;
}

export interface Camera {
  view: Turn;
  fit: {
    fill?: number;
    unit?: "even" | "any";
    /** Frame on these world bounds instead of the non-decor prims. */
    box?: { min: Vec3; max: Vec3 };
    /** Time and var values at which the framing is computed. */
    at?: { t?: number; vars?: Record<string, number> };
  };
  /** Allowed zoom steps, as multiples of the fitted unit. */
  zooms?: number[];
  /** Named shots: where to look and how close. */
  shots?: Record<string, { at: Vec3; zoom: number; view?: Turn }>;
}

export type Var =
  | { type: "time" }
  | { type: "progress"; default?: number }
  | { type: "int"; default: number; cycle?: { every: number; count: number } }
  | { type: "pointer" };

// ── Timeline ─────────────────────────────────────────────────────────────────

export type Ease = "linear" | "step" | "smooth" | "glide" | "in" | "out" | "in-out";

export interface Timeline {
  /** Which var drives it: "t" (default), a progress var, or a state's local time. */
  clock?: string;
  /** Length in clock units; a loop wraps at it. */
  length?: number;
  loop?: "loop" | "ping-pong" | "once";
  tracks: Track[];
}

export type ParamChannel = `param:${string}`;

export type Track =
  | {
      kind: "key";
      target: string;
      channel: "at" | "turn" | "scale" | ParamChannel;
      keys: { t: number; v: number | Vec3 | boolean; ease?: Ease }[];
    }
  | { kind: "visible"; target: string; keys: { t: number; v: boolean }[] }
  | { kind: "spin"; target: string; channel: ParamChannel; rate: number; phase?: number }
  | { kind: "path"; target: string; path: Vec3[]; duration: number; ease?: Ease; delay?: number }
  | {
      kind: "conveyor";
      use: string;
      path: Vec3[];
      count: number;
      speed: number;
      /** Added to `clock·speed` before the copies are spaced: `(clock·speed + phase + k·L/count) mod L`. */
      phase?: number;
      params?: Instance["params"];
    }
  | {
      kind: "blink";
      target: string;
      channel: ParamChannel;
      rate: number;
      period: number;
      on: number;
      seed: number;
      /** First value of the on window (0 when absent): on while `at ≤ m < at + on`. */
      at?: number;
    }
  /** A wave: `base + f(clock·rate + phase)·amp`, `f` sin or cos, `clip` keeps f ≥ 0 (P3). */
  | {
      kind: "wave";
      target: string;
      channel: ParamChannel;
      wave: "sin" | "cos";
      rate: number;
      phase?: number;
      amp: number;
      base: number;
      clip?: boolean;
    }
  | {
      kind: "spring";
      target: string;
      channel: ParamChannel;
      to: { if: string; then: number; else: number };
      rate: number;
    }
  /**
   * A value computed each frame from a number or a root param, by operations applied left to
   * right, each one IEEE operation (format.md §6, "Playing"); an operand is a number or a root
   * param. Comparisons and logic give 1 or 0; `when` stops the track (it writes nothing) when
   * its operand is falsy.
   */
  | {
      kind: "calc";
      target: string;
      channel: ParamChannel;
      from: number | ParamRef;
      ops: CalcOp[];
    };

/** The operations of a `calc` track. */
export const CALC_OPS = [
  "add",
  "sub",
  "rsub",
  "mul",
  "div",
  "rdiv",
  "mod",
  "min",
  "max",
  "pow",
  "floor",
  "ceil",
  "round",
  "abs",
  "sqrt",
  "sin",
  "cos",
  "lt",
  "le",
  "gt",
  "ge",
  "eq",
  "and",
  "or",
  "not",
  "hash",
  "rhash",
  "ease",
  "when",
] as const;

/** One operation: its name, then its operand (none for the unary ones; an ease name for `ease`). */
export type CalcOp = readonly [op: (typeof CALC_OPS)[number], operand?: number | ParamRef | Ease];

// ── State machine ────────────────────────────────────────────────────────────

export type TransitionWhen =
  | { var: string; range: [number, number] }
  | { var: string; equals: number }
  | { after: number }
  | { event: string };

export interface StateMachine {
  initial: string;
  states: Record<
    string,
    {
      play?: string[];
      shot?: string;
      set?: Record<string, number>;
    }
  >;
  transitions: {
    from: string;
    to: string;
    when: TransitionWhen;
    dissolve?: number;
  }[];
}
