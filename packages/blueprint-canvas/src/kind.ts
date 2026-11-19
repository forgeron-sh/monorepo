// A Blueprint scene as an item of @forgeron/canvas (docs/blueprint/engine.md §3, "On
// @forgeron/canvas"): the canvas keeps its engine, its renderer and its overlay; a scene is an item
// whose data names a file, a scene in it and one of the four views, and `<BlueprintLayer>` draws
// it. Plain data: no React, no DOM.

import type { Bounds, Item, KindDefinition } from "@forgeron/canvas";
import type { Turn } from "@forgeron/blueprint/format";

/** The `kind` of a Blueprint item. */
export const BLUEPRINT_KIND = "blueprint";

export type Depth = "painter" | "zbuffer";

/** What a Blueprint item holds: which scene of which file, seen from which quarter turn. */
export interface BlueprintItemData {
  /** The file's key, as the layer's `resolve` knows it ("erp-village.bp", a dropped file's name). */
  file: string;
  /** A scene of that file; with `preview`, a part or an assembly shown alone. */
  scene: string;
  /** The camera's quarter turn about +z: the four iso views. */
  view: Turn;
  /** Over the scene's own depth mode (the z-buffer review). */
  depth?: Depth;
  /** `scene` names a part or an assembly, framed alone (the viewer's library). */
  preview?: "part" | "assembly";
}

/**
 * The kind: a scene keeps the size it was framed at (its bounds are its fitted raster at zoom 1),
 * so it has no resize handles; it moves like any item.
 */
export const blueprintKind: KindDefinition<BlueprintItemData> = {
  resize: false,
  duplicate: (item, id) => ({
    ...item,
    id,
    bounds: { ...item.bounds, x: item.bounds.x + 24, y: item.bounds.y + 24 },
    data: { ...item.data },
  }),
};

/** A Blueprint item at `at` (world units), framed in `size` CSS pixels at zoom 1. */
export function blueprintItem(
  id: string,
  data: BlueprintItemData,
  at: { x: number; y: number },
  size: { w: number; h: number },
  z = 0,
): Item<BlueprintItemData> {
  const bounds: Bounds = { x: at.x, y: at.y, w: size.w, h: size.h };
  return { id, kind: BLUEPRINT_KIND, bounds, z, data };
}

export const isBlueprintItem = (item: Item<unknown>): item is Item<BlueprintItemData> =>
  item.kind === BLUEPRINT_KIND;

/** The next quarter turn: `1` counter-clockwise seen from above, `-1` the other way. */
export const turn = (view: Turn, by: 1 | -1): Turn => ((((view + by) % 4) + 4) % 4) as Turn;

/** The four views, in order, with the names the viewer's buttons show. */
export const VIEWS: ReadonlyArray<{ view: Turn; label: string }> = [
  { view: 0, label: "0°" },
  { view: 1, label: "90°" },
  { view: 2, label: "180°" },
  { view: 3, label: "270°" },
];
