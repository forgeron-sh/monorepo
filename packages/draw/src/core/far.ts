// What each kind looks like from far (a zoom under `FAR_ZOOM`), as canvas far primitives: shapes,
// notes and texts as plain boxes with no pattern and no words, strokes as their line, arrows as
// lines with their heads, frames as their edge and name strip. The same look as the DOM's far
// view, drawn on the GPU by the canvas's far layer. The kind that owns the item says how
// (`KindSpec.far`).

import type { Bounds, FarPrimitive } from "@forgeron/canvas";
import { registryOf } from "./defaults";
import type { Plugins } from "./plugin";
import type { DrawItem } from "./types";

/** Under this zoom the editor draws the far view of each item. */
export const FAR_ZOOM = 0.35;

/** The far primitives of an item; `frame` is the bounds of the frame that clips it. */
export function farPrimitives(item: DrawItem, frame?: Bounds, plugins?: Plugins): FarPrimitive[] {
  return registryOf(plugins).kind(item.kind)?.far?.(item, frame) ?? [];
}
