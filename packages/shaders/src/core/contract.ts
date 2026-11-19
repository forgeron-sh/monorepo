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
  /**
   * Binds a texture made by the pipeline: `"image"`, the pixels of an image source; any other
   * key, the float table `table()` returns, made once (`R32F`, read with `texelFetch`).
   */
  texture(name: string, key: string, table?: () => FloatTable): void;
}

/** A table of floats for a pass (the blue noise mask): `width × height`, one value each. */
export interface FloatTable {
  width: number;
  height: number;
  data: Float32Array;
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
 * `cell`: one cell at a time, fused with its neighbours in one program; `neighbourhood`: reads
 * other cells of the previous stage (`prevAt(cell)` on the GPU, a new stage), so it starts a
 * stage; `present`: one output pixel at a time (the grid gap), in the last stage only; `layout`:
 * sets the cell size (pixelate), first only.
 */
export type PassKind = "cell" | "neighbourhood" | "present" | "layout";

/**
 * What both sides of a pass share: its type and its kind. A pass is written as three parts that a
 * page imports separately (docs/shaders/design.md, S2 notes): the GLSL (`GlslPass`), the CPU
 * (`CpuPass`) and the meta (`PassMeta`: description and params schema, for presets and the
 * editor). A live mount bundles one side only; `PassDef` is the three together (the registry).
 */
export interface PassHead {
  type: string;
  kind: PassKind;
  /** Reads the cell's coordinates (a threshold) or other cells: cannot follow a `present` pass. */
  usesCell?: boolean;
  /**
   * Reads the previous stage at other cells, so it starts a stage on the GPU: implied by
   * `neighbourhood`; set on a `present` pass that samples (CRT).
   */
  cut?: boolean;
}

export interface GlslPass<P = Record<string, unknown>> extends PassHead {
  /**
   * `id` prefixes the chunk's uniform names, unique in a program. Null for a CPU-only pass
   * (Floyd–Steinberg). A list cuts a stage between its chunks (a separable blur): each chunk
   * after the first starts a stage that reads the previous one.
   */
  glsl: ((p: P, id: string) => GlslChunk | readonly GlslChunk[]) | null;
}

export interface CpuPass<P = Record<string, unknown>> extends PassHead {
  /**
   * Rewrites `frame` in place, or returns the frame that replaces it: a `present` pass returns the
   * frame at output resolution (`perPixel`), where a cell is one device pixel.
   */
  cpu(frame: Frame, p: P, ctx: CpuContext): Frame | void;
}

export interface PassMeta extends PassHead {
  description: string;
  params: ParamsSchema;
}

export interface PassDef<P = Record<string, unknown>> extends PassMeta, GlslPass<P>, CpuPass<P> {}

export interface SourceHead {
  type: string;
}

export interface GlslSource<P = Record<string, unknown>> extends SourceHead {
  /** Null for a CPU-only source (the dither field's heat, the hearth). */
  glsl: ((p: P, id: string) => GlslChunk) | null;
}

export interface CpuSource<P = Record<string, unknown>> extends SourceHead {
  cpu(frame: Frame, p: P, ctx: CpuContext): void;
}

export interface SourceMeta extends SourceHead {
  description: string;
  params: ParamsSchema;
}

export interface SourceDef<P = Record<string, unknown>>
  extends SourceMeta, GlslSource<P>, CpuSource<P> {}

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
 * only the side it runs (`GlChain`, `CpuChain`). `bindChain` makes one from a preset and a table
 * of definitions; `chainOf` from JSON with every definition; `toPreset` writes it back as JSON.
 */
export interface Chain<S extends SourceHead = SourceHead, P extends PassHead = PassHead> {
  name?: string;
  source: Bound<S>;
  passes: Bound<P>[];
}

/** A chain that runs on the GPU (`createGlPipeline`). */
export type GlChain = Chain<GlslSource<never>, GlslPass<never>>;
/** A chain that runs on the CPU (`runCpu`). */
export type CpuChain = Chain<CpuSource<never>, CpuPass<never>>;

/**
 * The chain of a preset built in code (complete: no validation, no defaults) with one side's
 * definitions, keyed by type: a mount passes the few it needs. Throws on a missing type.
 */
export function bindChain<S extends SourceHead, P extends PassHead>(
  preset: Preset,
  sources: Readonly<Record<string, S>>,
  passes: Readonly<Record<string, P>>,
): Chain<S, P> {
  const pick = <D>(table: Readonly<Record<string, D>>, { type, ...params }: Step): Bound<D> => {
    const def = table[type];
    if (!def) throw new Error(`shaders: no definition for "${type}"`);
    return { def, params };
  };
  const chain: Chain<S, P> = {
    source: pick(sources, preset.source),
    passes: preset.passes.map((step) => pick(passes, step)),
  };
  if (preset.name) chain.name = preset.name;
  return chain;
}

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
