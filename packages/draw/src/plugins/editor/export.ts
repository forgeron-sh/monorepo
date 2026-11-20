// The exports, editor half: the buttons of the properties panel (export PNG, export SVG, copy as
// JSON) and the PNG itself, drawn from the SVG on a canvas. ⇧⌘E exports the selection as PNG; with
// the `json` plugin, copy and cut also put the selection's board JSON on the system clipboard, and
// paste reads a board's JSON back from it.

import { ClipboardCopyIcon, Download01Icon, FileDownloadIcon } from "@forgeron/icons";
import { exportName, exportSvgOf } from "../../core/svg-export";
import type { ExportSpec } from "../../core/plugin";
import { svgToPng } from "../../react/export";
import { defineEditorPlugin, type MenuItem } from "../../react/plugin";
import { json as jsonCore, png as pngCore, svg as svgCore } from "../export";

const pngExport: ExportSpec = {
  id: "png",
  name: "PNG",
  mime: "image/png",
  extension: "png",
  async run(ctx) {
    const result = exportSvgOf(ctx);
    if (!result) return null;
    return { data: await svgToPng(result), mime: "image/png", name: exportName(ctx) };
  },
};

const item = (
  id: string,
  order: number,
  icon: MenuItem["icon"],
  label: string,
  exportId: string,
): MenuItem => ({
  id: `export-${id}`,
  section: "export",
  order,
  icon,
  label,
  run: (ctx, s) =>
    void ctx.runExport(
      exportId,
      s.selected.map((i) => i.id),
    ),
});

export const svg = defineEditorPlugin({
  core: svgCore,
  menu: [item("svg", 310, FileDownloadIcon, "Export SVG", "svg")],
});

export const png = defineEditorPlugin({
  core: pngCore,
  exports: [pngExport],
  menu: [item("png", 300, Download01Icon, "Export PNG", "png")],
  keys: [
    {
      combo: "mod+shift+e",
      run(ctx, e) {
        e.preventDefault();
        const ids = ctx.selected().map((i) => i.id);
        if (ids.length) void ctx.runExport("png", ids);
      },
    },
  ],
});

export const json = defineEditorPlugin({
  core: jsonCore,
  menu: [item("json", 320, ClipboardCopyIcon, "Copy as JSON", "json")],
  keys: [
    {
      // The canvas copies for its own paste; the system clipboard gets the board's JSON too.
      combo: ["mod+c", "mod+x"],
      run(ctx) {
        const ids = ctx.selected().map((i) => i.id);
        if (ids.length) void ctx.runExport("json", ids);
      },
    },
    {
      // JSON on the system clipboard (from another board, another tab) is pasted; else the canvas's own.
      combo: "mod+v",
      capture: true,
      run(ctx, e) {
        const read =
          typeof navigator !== "undefined"
            ? navigator.clipboard?.readText?.bind(navigator.clipboard)
            : undefined;
        if (!read) return;
        e.preventDefault();
        e.stopPropagation();
        read()
          .then((text) => {
            if (/^\s*\{/.test(text) && /"items"/.test(text)) ctx.store.paste(text);
            else ctx.store.paste();
          })
          .catch(() => ctx.store.paste());
      },
    },
  ],
});
