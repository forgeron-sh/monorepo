// The model of a whiteboard: plain data, no React and no DOM. Every item is a canvas item
// (`{ id, kind, bounds, z, locked?, data }`) whose `data` says what it is. Coordinates are world
// units; points inside an item (a pen stroke, an arrow) are local to its bounds' top-left corner.

import type { Item } from "@forgeron/canvas";

/**
 * A colour: the id of a token of the palette (`ink`, `accent`…), which follows the theme, or any
 * `#rrggbb` code.
 */
export type DrawColor = string;

/** None, a solid colour, or a dither pattern (the 4 × 4 maps of ui's `FillPicker`). */
export type DrawFill =
  | { type: "none" }
  | { type: "solid"; color: DrawColor; opacity?: number }
  | { type: "pattern"; pattern: string; color: DrawColor; opacity?: number };

export type DrawDash = "solid" | "dashed" | "dotted";

export interface DrawStroke {
  /** Null: no line. */
  color: DrawColor | null;
  /** World units. */
  width: number;
  dash: DrawDash;
}

/** Fields every kind may carry. */
interface Common {
  /** Items of one group are selected together. */
  group?: string;
  /** The frame the item belongs to: it moves with it and is clipped by it. */
  frame?: string;
}

export type ShapeKind = "rectangle" | "ellipse" | "diamond";

export interface ShapeData extends Common {
  type: "shape";
  fill: DrawFill;
  stroke: DrawStroke;
  /** A label in the middle, optional. */
  text?: string;
}

/** The colours of a sticky note, from the tokens. */
export type StickyColor = "amber" | "green" | "rose" | "ember" | "grey";

export interface StickyData extends Common {
  type: "sticky";
  color: StickyColor;
  text: string;
}

export type TextAlign = "left" | "center" | "right";

export interface TextData extends Common {
  type: "text";
  text: string;
  /** World units. */
  size: number;
  color: DrawColor;
  align: TextAlign;
}

/** One end of an arrow: a local point, bound to an item when `bind` is its id. */
export interface ArrowEnd {
  x: number;
  y: number;
  bind?: string;
}

export type ArrowHead = "none" | "end" | "both";
export type ArrowRoute = "straight" | "elbow";

export interface ArrowData extends Common {
  type: "arrow";
  start: ArrowEnd;
  end: ArrowEnd;
  head: ArrowHead;
  route: ArrowRoute;
  stroke: DrawStroke;
}

export interface PenData extends Common {
  type: "pen";
  /** Vertices in pen pixels, flat `[x0, y0, x1, y1…]`, simplified, on whole pixels. */
  points: number[];
  /** The stroke's pixel box when drawn: it scales to the item's bounds. */
  cols: number;
  rows: number;
  color: DrawColor;
  /** Pixels per line: 1 to 4. */
  weight: number;
}

export interface FrameData {
  type: "frame";
  name: string;
  /** Frames do not nest: no `frame` of their own. */
  group?: string;
}

export interface ImageData extends Common {
  type: "image";
  /** An object URL or a data URL; never uploaded. */
  src: string;
  /** The file's name, for assistive technology. */
  name: string;
}

export type DrawData =
  | ShapeData
  | StickyData
  | TextData
  | ArrowData
  | PenData
  | FrameData
  | ImageData;

export type DrawKind = ShapeKind | "sticky" | "text" | "arrow" | "pen" | "frame" | "image";

export const DRAW_KINDS: ReadonlyArray<DrawKind> = [
  "rectangle",
  "ellipse",
  "diamond",
  "sticky",
  "text",
  "arrow",
  "pen",
  "frame",
  "image",
];

export type DrawItem<D extends DrawData = DrawData> = Item<D>;

export const isShape = (item: DrawItem): item is DrawItem<ShapeData> => item.data.type === "shape";
export const isArrow = (item: DrawItem): item is DrawItem<ArrowData> => item.data.type === "arrow";
export const isFrame = (item: DrawItem): item is DrawItem<FrameData> => item.data.type === "frame";
export const isPen = (item: DrawItem): item is DrawItem<PenData> => item.data.type === "pen";
