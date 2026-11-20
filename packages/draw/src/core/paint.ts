// How an item is drawn, as a small tree of SVG nodes in world units: the editor renders it with
// React, the export writes it as markup. The kind that owns the item says how (`KindSpec.paint`);
// an item no plugin of the list knows paints nothing. The vocabulary (nodes, options, markup) is
// in `svg.ts`.

import { registryOf } from "./defaults";
import type { Plugins } from "./plugin";
import type { PaintOptions, SvgNode } from "./svg";
import type { DrawItem } from "./types";

export { dashArray, exportPaint, pagePaint, toMarkup } from "./svg";
export type { PaintOptions, SvgNode } from "./svg";

/** The nodes that draw an item, in world units; none for a kind the plugins do not know. */
export function paintItem(item: DrawItem, options: PaintOptions, plugins?: Plugins): SvgNode[] {
  return registryOf(plugins).kind(item.kind)?.paint(item, options) ?? [];
}
