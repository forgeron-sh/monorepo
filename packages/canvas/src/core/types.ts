// The model of a canvas: plain data, no React and no DOM. Every coordinate is in world units unless
// its name says `screen`. One world unit is one CSS pixel at zoom 1.

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

/** A rectangle: its top-left corner and its size, never negative once normalised. */
export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where the camera looks: `x` and `y` are the screen position of the world origin, `zoom` the
 * screen pixels per world unit. `screen = world * zoom + (x, y)`.
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/** One thing on the surface. Its kind is the consumer's: a flow node, a sticky, a table. */
export interface Item<D = unknown> {
  id: string;
  kind: string;
  bounds: Bounds;
  /** Stacking order: higher is drawn above and hit first. */
  z: number;
  /** A locked item can be selected, never moved, resized, nudged or deleted. */
  locked?: boolean;
  data: D;
}

/** What may change on an item: everything but its id. */
export type ItemChange<D = unknown> = Partial<Omit<Item<D>, "id">>;

/** The eight resize handles, by compass point. */
export type Handle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export const HANDLES: ReadonlyArray<Handle> = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

/** The modifier keys of a gesture. `mod` is Command on a Mac, Control elsewhere. */
export interface Modifiers {
  shift: boolean;
  alt: boolean;
  mod: boolean;
}

/** A pointer as a tool sees it: in both spaces, with its button and modifiers. */
export interface CanvasPointer extends Modifiers {
  world: Point;
  screen: Point;
  /** 0 main, 1 middle, 2 secondary. */
  button: number;
  pointerId: number;
}

/** One end of a connection: an item and, when it was started from one, a handle inside it. */
export interface ConnectionEnd {
  itemId: string;
  /** The `data-canvas-handle` of the element the gesture started on or ends over (a port). */
  handle?: string;
}

/** The "connect" gesture while it runs: drawn by an overlay, ended by `onConnect`. */
export interface Connection {
  from: ConnectionEnd;
  /** Where the pointer is, in world units. */
  point: Point;
  /** What it is over, when that is a valid target. */
  over: ConnectionEnd | null;
}
