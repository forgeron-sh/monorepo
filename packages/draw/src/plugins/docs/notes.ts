import type { PluginDoc } from "./types";

export const notesDocs: ReadonlyArray<PluginDoc> = [
  {
    id: "sticky",
    family: "notes",
    name: "Sticky note",
    summary: "A note in a token colour that grows with its text, typed in place. Key S.",
    core: "@forgeron/draw/plugins/notes",
    editor: "@forgeron/draw/plugins/editor/notes",
    json: `{
  "id": "n1",
  "kind": "sticky",
  "bounds": { "x": 0, "y": 0, "w": 160, "h": 160 },
  "z": 0,
  "data": { "type": "sticky", "color": "amber", "text": "Arrows follow when you move a shape." }
}`,
    notes: [
      "Colours: amber, green, rose, ember, grey. At least 80 wide, as tall as its text needs.",
      "Double-click or Enter writes in it; Escape on an empty new note removes it.",
    ],
    usage: `import { sticky } from "@forgeron/draw/plugins/editor/notes";
import { DrawEditor } from "@forgeron/draw/react";

const plugins = [sticky];
<DrawEditor store={store} plugins={plugins} />;`,
  },
  {
    id: "text",
    family: "notes",
    name: "Text",
    summary:
      "Free text on the board: a size, a colour, an alignment. Key T, or double-click the board.",
    core: "@forgeron/draw/plugins/notes",
    editor: "@forgeron/draw/plugins/editor/notes",
    json: `{
  "id": "t1",
  "kind": "text",
  "bounds": { "x": 40, "y": 48, "w": 320, "h": 40 },
  "z": 0,
  "data": { "type": "text", "text": "Ship the draw editor", "size": 28, "color": "ink", "align": "left" }
}`,
    notes: [
      "Only its width is set by hand; its height follows the lines.",
      "An empty text is removed when typing ends, in the same undo step as its creation.",
    ],
    usage: `import { text } from "@forgeron/draw/plugins/editor/notes";
const plugins = [text];`,
  },
];
