/**
 * The data a scene is made of. Everything here survives `JSON.stringify`: tuples, strings,
 * numbers, booleans. The only function is the animated scene (`SceneFn`), and it returns data.
 */

export type Vec3 = readonly [x: number, y: number, z: number];

/**
 * The colour family of a pixel. `signal` stays ember even when `accent` is mapped to ink; `alert`
 * is red.
 */
export type Ink = "ink" | "dim" | "faint" | "accent" | "signal" | "alert";

interface BlockBase {
  /** Lower layers are painted first, whatever their depth (a ground slab). */
  layer?: number;
  /** Scenery: drawn, never used to frame the scene (a floor grid, a skyline). */
  decor?: boolean;
}

export interface BoxBlock extends BlockBase {
  kind: "box";
  at: Vec3;
  size: Vec3;
  /** Density of the top, left and right faces, 0 to 1. */
  tone?: readonly [top: number, left: number, right: number];
  accent?: boolean;
  /** Always ember, even when the accent is mapped to ink: a delivery. */
  signal?: boolean;
  /** The alert family (red by default): fire, errors. */
  alert?: boolean;
  /** Outline only, dashed: a slot or a ghost. */
  ghost?: boolean;
  /** Inset outline, corner studs and a ring on the top face. */
  plate?: boolean;
  /** A line on the side faces every `floors` units (storeys). */
  floors?: number;
  /** Short vertical vents on the right face. */
  vents?: boolean;
}

export interface LineBlock extends BlockBase {
  kind: "line";
  a: Vec3;
  b: Vec3;
  ink?: Ink;
  /** Length of dashes and gaps, in pixels; 0 or absent draws a solid line. */
  dash?: number;
}

export interface DotBlock extends BlockBase {
  kind: "dot";
  at: Vec3;
  ink?: Ink;
  /** Side of the square, in pixels (2 by default). */
  size?: number;
}

/** A screen-aligned tag in the bitmap face, with an optional leader down to `to`. */
export interface LabelBlock extends BlockBase {
  kind: "label";
  at: Vec3;
  text: string;
  to?: Vec3;
  active?: boolean;
  /** Text only, no frame, fill or leader: a caption floating over the scene. */
  plain?: boolean;
  /** Colour family of a plain label's text (ink by default). */
  ink?: Ink;
}

export type Block = BoxBlock | LineBlock | DotBlock | LabelBlock;

export interface FitOptions {
  /** Share of the target the framed blocks may take, 0.82 by default. */
  fill?: number;
  /** `even` (default) keeps 2:1 edges regular; `any` allows any whole unit, for wide frames. */
  unit?: "even" | "any";
  /** Time at which an animated scene is framed, 0 by default: the framing never moves. */
  at?: number;
}

export interface Scene {
  blocks: readonly Block[];
  fit?: FitOptions;
}

export interface SceneFrame {
  /** Seconds since the animation started; 0 under reduced motion and in static outputs. */
  t: number;
  /** The highlighted index, -1 when none. */
  active: number;
}

export type SceneFn = (frame: SceneFrame) => Scene;

export type SceneSource = Scene | SceneFn;

/** Placement of the scene on the raster: the unit in pixels and the screen origin. */
export interface View {
  u: number;
  ox: number;
  oy: number;
}
