import type { PluginDoc } from "./types";

const shapeJson = (kind: string, id: string, extra = "") =>
  `{
  "id": "${id}",
  "kind": "${kind}",
  "bounds": { "x": 0, "y": 0, "w": 160, "h": 100 },
  "z": 0,
  "data": {
    "type": "shape",
    "fill": { "type": "pattern", "pattern": "dots-25", "color": "muted" },
    "stroke": { "color": "ink", "width": 2, "dash": "solid" }${extra}
  }
}`;

const usage = (name: string, key: string) => `import { createDrawStore } from "@forgeron/draw";
import { ${name} } from "@forgeron/draw/plugins/shapes";
import { ${name} as ${name}Editor } from "@forgeron/draw/plugins/editor/shapes";
import { DrawEditor } from "@forgeron/draw/react";

const store = createDrawStore({ plugins: [${name}] });
const plugins = [${name}Editor]; // module scope: a new list rebuilds the editor
<DrawEditor store={store} plugins={plugins} />; // ${key} draws one`;

const notes = [
  "Fill: none, a solid token or colour, or a dither pattern; stroke: colour, width, solid, dashed or dotted.",
  "A click places the shape at a default size, a drag sizes it (Shift: square, Alt: off the grid).",
  "Double-click writes a label in the middle. The three shapes share one `shape` data type and one fill and stroke panel.",
];

export const shapesDocs: ReadonlyArray<PluginDoc> = [
  {
    id: "rectangle",
    family: "shapes",
    name: "Rectangle",
    summary: "A rectangle with a fill, a stroke and a label. Key R.",
    core: "@forgeron/draw/plugins/shapes",
    editor: "@forgeron/draw/plugins/editor/shapes",
    json: shapeJson("rectangle", "r1", `,\n    "text": "Model"`),
    notes,
    usage: usage("rectangle", "R"),
  },
  {
    id: "ellipse",
    family: "shapes",
    name: "Ellipse",
    summary: "An ellipse with a fill, a stroke and a label; clicks reach its curve. Key O.",
    core: "@forgeron/draw/plugins/shapes",
    editor: "@forgeron/draw/plugins/editor/shapes",
    json: shapeJson("ellipse", "e1"),
    notes,
    usage: usage("ellipse", "O"),
  },
  {
    id: "diamond",
    family: "shapes",
    name: "Diamond",
    summary: "A diamond with a fill, a stroke and a label; clicks reach its lozenge. Key D.",
    core: "@forgeron/draw/plugins/shapes",
    editor: "@forgeron/draw/plugins/editor/shapes",
    json: shapeJson("diamond", "d1"),
    notes,
    usage: usage("diamond", "D"),
  },
];
