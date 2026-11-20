import type { PluginDoc } from "./types";

export const exportDocs: ReadonlyArray<PluginDoc> = [
  {
    id: "svg",
    family: "export",
    name: "SVG export",
    summary: "A frame or a selection as a standalone SVG document, from the editor's own paint.",
    core: "@forgeron/draw/plugins/export",
    editor: "@forgeron/draw/plugins/editor/export",
    notes: [
      "The core half runs without a DOM: a build step or a Worker can export a board. Text is written as SVG text, colours as hex codes (from the page's tokens when given).",
      "An item no plugin of the list knows is skipped.",
    ],
    usage: `import { exportSvg, parseBoard } from "@forgeron/draw";

const { items } = parseBoard(json);
const result = exportSvg(items, { ids: items.map((i) => i.id), background: "bg" });
// result.svg, result.bounds`,
  },
  {
    id: "png",
    family: "export",
    name: "PNG export",
    summary: "A frame or a selection as a PNG, drawn from the SVG on a canvas. Shift+Mod+E.",
    core: "@forgeron/draw/plugins/export",
    editor: "@forgeron/draw/plugins/editor/export",
    requires: ["svg"],
    notes: ["Needs a browser: the run is in the editor half."],
    usage: `import { svg, png } from "@forgeron/draw/plugins/editor/export";
const plugins = [rectangle, svg, png, inspector];`,
  },
  {
    id: "json",
    family: "export",
    name: "Board JSON on the clipboard",
    summary:
      "Copy puts the selection's board JSON on the system clipboard too, and paste reads it back.",
    core: "@forgeron/draw/plugins/export",
    editor: "@forgeron/draw/plugins/editor/export",
    json: `{ "format": "forgeron/draw", "version": 1, "items": [ ... ], "viewport": { "x": 0, "y": 0, "zoom": 1 } }`,
    notes: [
      "The format is version 1 whatever the plugins; reading a board needs the plugins of its kinds, or keeps what it does not know.",
    ],
    usage: `import { parseBoard, serializeBoard } from "@forgeron/draw";

const json = serializeBoard(store.getState().items, store.getState().viewport);
const { items } = parseBoard(json, undefined, { unknown: "keep" });`,
  },
];
