// Export: a frame or a selection as a standalone SVG document, from the same paint as the editor,
// for the default plugins or the list you give. See `svg-export.ts` for how; the PNG is drawn from
// this SVG by the React layer, which has a canvas to draw it on.

import { registryOf } from "./defaults";
import type { Plugins } from "./plugin";
import {
  exportedItemsOf,
  exportSvgWith,
  type ExportOptions,
  type ExportResult,
} from "./svg-export";
import type { DrawItem } from "./types";

export type { ExportOptions, ExportResult } from "./svg-export";
export { exportName, exportSvgOf } from "./svg-export";

/** The items an export of `ids` holds, bottom first: the plugins add theirs (a frame's items). */
export function exportedItems(
  items: ReadonlyArray<DrawItem>,
  ids: Iterable<string>,
  plugins?: Plugins,
): DrawItem[] {
  return exportedItemsOf(registryOf(plugins), items, ids);
}

/** A frame or a selection as an SVG document; null when there is nothing to export. */
export function exportSvg(
  all: ReadonlyArray<DrawItem>,
  options: ExportOptions,
  plugins?: Plugins,
): ExportResult | null {
  return exportSvgWith(registryOf(plugins), all, options);
}
