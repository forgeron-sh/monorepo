import type { ColorRef, RGB } from "./color";
import type { ParamsSchema } from "./params";

/**
 * The pass contract (docs/shaders/design.md §2): a pass is a params schema, a GLSL chunk and a
 * CPU function with the same result. A source has the same shape and fills the frame first.
 */

/** A CPU frame: `width × height` cells, four float64 channels per cell, row 0 at the top. */
export interface Frame {
  width: number;
  height: number;
  data: Float64Array;
}

export function createFrame(width: number, height: number): Frame {
  return { width, height, data: new Float64Array(Math.max(0, width * height * 4)) };
}

/** What every source and pass may read, on the CPU and (as uniforms) on the GPU. */
export interface Inputs {
  /** Seconds (`uTime`). */
  time: number;
  /** Pointer in 0..1, y up (`uMouse`). */
  mouse: readonly [number, number];
  /** Output size in device pixels (`uRes`). */
  res: readonly [number, number];
  /** Device pixels per cell (`uPx`). */
  px: number;
  /**
   * What a source reads at run time, by key: the pixels of an `image` source, the function of a
   * `tone` source, the grid of a `hearth`.
   */
  data?: Readonly<Record<string, unknown>>;
}

export interface CpuContext extends Inputs {
  /** A colour reference as RGB (tokens read from the page in a browser). */
  resolve(ref: ColorRef): RGB;
}

/** Sets a uniform of the program a chunk is compiled into. */
export interface UniformSetter {
  f1(name: string, v: number): void;
  f2(name: string, x: number, y: number): void;
  f4v(name: string, v: Float32Array): void;
  i1(name: string, v: number): void;
  /** Binds a texture made by the pipeline for this chunk (an image source). */
  texture(name: string, key: string): void;
}

export interface GlslChunk {
  /** Declarations: uniforms and functions. Equal strings are emitted once per program. */
  decl: readonly string[];
  /**
   * For a pass: statements mapping `vec4 c` at `vec2 cell` (and `vec2 frag`, the fragment in
   * device pixels, in the last stage). For a source: the body of `vec4 source(vec2 cell)`.
   */
  body: string;
  bind?(set: UniformSetter, ctx: CpuContext): void;
}

/**
 * `cell`: one cell at a time, fused with its neighbours in one program; `present`: one output
 * pixel at a time (the grid gap), in the last stage only; `layout`: sets the cell size (pixelate),
 * first only. S2 adds `neighbourhood` (reads other cells of the previous stage).
 */
export type PassKind = "cell" | "present" | "layout";

export interface PassDef<P = Record<string, unknown>> {
  type: string;
  kind: PassKind;
  /** Reads the cell's coordinates (a Bayer threshold): cannot follow a `present` pass. */
  usesCell?: boolean;
  description: string;
  params: ParamsSchema;
  /** `id` prefixes the chunk's uniform names, unique in a program. */
  glsl(p: P, id: string): GlslChunk;
  /** Rewrites `frame` in place. In a `present` pass, a cell is one device pixel. */
  cpu(frame: Frame, p: P, ctx: CpuContext): void;
}

export interface SourceDef<P = Record<string, unknown>> {
  type: string;
  description: string;
  params: ParamsSchema;
  /** Null for a CPU-only source (it has no GLSL in S1). */
  glsl: ((p: P, id: string) => GlslChunk) | null;
  cpu(frame: Frame, p: P, ctx: CpuContext): void;
}

/** One formatting for GLSL literals: `0.86`, `1.0`, `-0.5`. */
export function glslFloat(n: number): string {
  const s = String(n);
  return /[.e]/.test(s) ? s : `${s}.0`;
}

/** A pass or a source with its settings: a step of a chain, ready to run. */
export interface Bound<D> {
  def: D;
  params: Record<string, unknown>;
}

/**
 * A preset in memory: the definitions themselves rather than their names, so a mount bundles
 * only the passes it runs. `toPreset` writes it as JSON; `chainOf` reads JSON back.
 */
export interface Chain {
  name?: string;
  source: Bound<SourceDef<never>>;
  passes: Bound<PassDef<never>>[];
}

export const bindSource = <P>(def: SourceDef<P>, params: P): Bound<SourceDef<never>> => ({
  def: def as unknown as SourceDef<never>,
  params: params as Record<string, unknown>,
});

export const bindPass = <P>(def: PassDef<P>, params: P): Bound<PassDef<never>> => ({
  def: def as unknown as PassDef<never>,
  params: params as Record<string, unknown>,
});

/** Cell size in CSS pixels: the hoisted `pixelate`, 1 without one. */
export function chainCellSize(chain: Chain): number {
  const first = chain.passes[0];
  return first?.def.kind === "layout" ? Number(first.params.size ?? 1) : 1;
}

export const PRESET_SCHEMA_ID = "https://shaders.forgeron.sh/schema/preset.v1.json";

/** A step of a preset: its `type` and its settings. */
export interface Step {
  type: string;
  [key: string]: unknown;
}

/** An effect as JSON data (docs/shaders/design.md §3); `checkPreset` validates it. */
export interface Preset {
  $schema?: string;
  version: 1;
  /** A name for people and the editor (`field-ember`). */
  name?: string;
  source: Step;
  passes: Step[];
}

/** A chain as JSON data: a preset, `version: 1`. */
export function toPreset(chain: Chain): Preset {
  const preset: Preset = {
    $schema: PRESET_SCHEMA_ID,
    version: 1,
    source: { type: chain.source.def.type, ...chain.source.params },
    passes: chain.passes.map(({ def, params }) => ({ type: def.type, ...params })),
  };
  if (chain.name) preset.name = chain.name;
  return preset;
}
