// What a kind of item may say about itself: its own hit test, its resize rules, whether it moves.
// The consumer defines the kinds (flow: node, note; draw: rect, ellipse, sticky, frame…); the canvas
// asks them and falls back to the rectangle when a kind says nothing.

import type { Handle, Item, Point } from "./types";

export interface ResizeRule {
  /** The handles shown; all eight by default. A flow node may keep only `e` and `w`. */
  handles?: ReadonlyArray<Handle>;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  /** Always keeps the width to height ratio (an image); Shift does it for the others. */
  keepAspect?: boolean;
}

export interface KindDefinition<D = unknown> {
  /**
   * Whether a world point touches the item; the bounds by default. An ellipse, a line, an arrow.
   * The engine asks it only for points inside the bounds (it finds candidates in a spatial
   * index): a shape that reaches outside them, a thick stroke, makes its bounds cover it.
   */
  hitTest?: (item: Item<D>, point: Point) => boolean;
  /** `false`: no handles. The default allows all eight, down to one grid cell. */
  resize?: false | ResizeRule;
  /** `false`: the item stays where it is (a frame's background, a pinned table). */
  movable?: boolean;
  /** `false`: clicks go through it, box and lasso skip it (a guide, a background image). */
  selectable?: boolean;
  /** What a copy of the item is: by default the same data under a new id, offset. */
  duplicate?: (item: Item<D>, id: string) => Item<D>;
}

export type KindMap<D = unknown> = Readonly<Record<string, KindDefinition<D>>>;

export function kindOf<D>(kinds: KindMap<D>, item: Item<D>): KindDefinition<D> {
  return kinds[item.kind] ?? {};
}

export const isSelectable = <D>(kinds: KindMap<D>, item: Item<D>) =>
  kindOf(kinds, item).selectable !== false;

export const isMovable = <D>(kinds: KindMap<D>, item: Item<D>) =>
  !item.locked && kindOf(kinds, item).movable !== false;

export function resizeRule<D>(kinds: KindMap<D>, item: Item<D>): ResizeRule | null {
  if (item.locked) return null;
  const rule = kindOf(kinds, item).resize;
  return rule === false ? null : (rule ?? {});
}
