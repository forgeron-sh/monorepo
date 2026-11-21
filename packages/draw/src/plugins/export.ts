// The exports, core half: the board as an SVG document (what a build step or a Worker runs), and
// as board JSON for the clipboard. The PNG needs a canvas to draw on, so its run is in the editor
// half; its core half only names it and needs the SVG.

import { exportName, exportSvgOf } from "../core/svg-export";
import { serializeBoard } from "../core/format";
import { definePlugin, type ExportSpec } from "../core/plugin";

const svgExport: ExportSpec = {
  id: "svg",
  name: "SVG",
  mime: "image/svg+xml",
  extension: "svg",
  run(ctx) {
    const result = exportSvgOf(ctx);
    return result ? { data: result.svg, mime: "image/svg+xml", name: exportName(ctx) } : null;
  },
};

const jsonExport: ExportSpec = {
  id: "json",
  name: "Board JSON",
  mime: "application/json",
  extension: "json",
  to: "clipboard",
  prepare: false,
  run(ctx) {
    const wanted = new Set(ctx.ids);
    const items = ctx.items.filter((i) => wanted.has(i.id));
    return items.length
      ? { data: serializeBoard(items), mime: "application/json", name: exportName(ctx) }
      : null;
  },
};

export const svg = definePlugin({
  id: "svg",
  name: "SVG export",
  description: "A frame or a selection as a standalone SVG document, from the editor's own paint.",
  exports: [svgExport],
});

export const png = definePlugin({
  id: "png",
  name: "PNG export",
  description: "A frame or a selection as a PNG, drawn from the SVG on a canvas.",
  requires: ["svg"],
});

export const json = definePlugin({
  id: "json",
  name: "Board JSON on the clipboard",
  description:
    "Copy puts the selection's board JSON on the system clipboard too, and paste reads it back.",
  exports: [jsonExport],
});
