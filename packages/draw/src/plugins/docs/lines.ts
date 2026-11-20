import type { PluginDoc } from "./types";

export const linesDocs: ReadonlyArray<PluginDoc> = [
  {
    id: "arrow",
    family: "lines",
    name: "Arrow",
    summary:
      "Lines and arrows, straight or elbow, bound to items: they follow when the items move, let go when an item is deleted and stay bound to copies. Key A.",
    core: "@forgeron/draw/plugins/lines",
    editor: "@forgeron/draw/plugins/editor/lines",
    json: `{
  "id": "a1",
  "kind": "arrow",
  "bounds": { "x": 170, "y": 40, "w": 80, "h": 40 },
  "z": 1,
  "data": {
    "type": "arrow",
    "start": { "x": 10, "y": 10, "bind": "r1" },
    "end": { "x": 70, "y": 30, "bind": "e1" },
    "head": "end",
    "route": "straight",
    "stroke": { "color": "ink", "width": 2, "dash": "solid" }
  }
}`,
    notes: [
      "The engine rules live in the plugin: without it, a board has no arrows and nothing follows. Boards that hold arrows still open: they are kept and drawn as unsupported items.",
      "Dragging an end (`data-canvas-handle`) onto an item binds it there; an arrow dragged on its own lets go of the items that stayed.",
    ],
    usage: `import { createDrawStore } from "@forgeron/draw";
import { arrow } from "@forgeron/draw/plugins/lines"; // the core half
import { rectangle } from "@forgeron/draw/plugins/shapes";

// An arrow binds to any kind that is not an arrow or a frame: the shapes are optional.
const store = createDrawStore({ plugins: [rectangle, arrow] });`,
  },
  {
    id: "pen",
    family: "lines",
    name: "Pixel pen",
    summary: "Freehand strokes on a 4 px grid, simplified and drawn as whole pixels. Key P.",
    core: "@forgeron/draw/plugins/lines",
    editor: "@forgeron/draw/plugins/editor/lines",
    json: `{
  "id": "p1",
  "kind": "pen",
  "bounds": { "x": 400, "y": 200, "w": 160, "h": 80 },
  "z": 2,
  "data": { "type": "pen", "points": [0, 0, 10, 15, 25, 5, 40, 20], "cols": 40, "rows": 20, "color": "accent", "weight": 1 }
}`,
    notes: [
      "Points go to pixels, Ramer-Douglas-Peucker drops what stays within a pixel of the line, Bresenham draws whole pixels between the vertices.",
      "Weights 1 to 4 pixels. A resize keeps the ratio and scales the pixels.",
    ],
    usage: `import { pen } from "@forgeron/draw/plugins/editor/lines";
const plugins = [pen];`,
  },
  {
    id: "eraser",
    family: "lines",
    name: "Eraser",
    summary: "Removes what the pointer crosses, in one undo step on release. Key E.",
    core: "@forgeron/draw/plugins/lines",
    editor: "@forgeron/draw/plugins/editor/lines",
    notes: ["Locked items are skipped. What will go is highlighted while the pointer moves."],
    usage: `import { eraser, pen } from "@forgeron/draw/plugins/editor/lines";
const plugins = [pen, eraser];`,
  },
];
