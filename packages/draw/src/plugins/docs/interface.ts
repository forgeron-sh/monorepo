import type { PluginDoc } from "./types";

export const interfaceDocs: ReadonlyArray<PluginDoc> = [
  {
    id: "toolbar",
    family: "ui",
    name: "Tool dock",
    summary:
      "The floating dock of tools: select and hand, then every tool the other plugins bring.",
    core: "@forgeron/draw/plugins/ui",
    editor: "@forgeron/draw/plugins/editor/ui",
    notes: ["Without it the dock is not there; the keys of the tools still work."],
    usage: `const plugins = [rectangle, text, toolbar];`,
  },
  {
    id: "inspector",
    family: "ui",
    name: "Properties panel",
    summary:
      "The panel of the selection (or of what the active tool will draw): the panels and the menu items the other plugins bring.",
    core: "@forgeron/draw/plugins/ui",
    editor: "@forgeron/draw/plugins/editor/ui",
    notes: ["`<DrawEditor inspector={false}>` leaves it out of any list."],
    usage: `const plugins = [rectangle, sticky, inspector];`,
  },
  {
    id: "minimap",
    family: "ui",
    name: "Minimap",
    summary: "An overview of the board with the viewport, to jump around it.",
    core: "@forgeron/draw/plugins/ui",
    editor: "@forgeron/draw/plugins/editor/ui",
    notes: ["`<DrawEditor minimap={false}>` leaves it out of any list."],
    usage: `const plugins = [...sketchEditorPlugins, minimap];`,
  },
  {
    id: "arrange",
    family: "ui",
    name: "Arrange",
    summary: "Duplicate, delete, bring to front and send to back, on the selection.",
    core: "@forgeron/draw/plugins/ui",
    editor: "@forgeron/draw/plugins/editor/ui",
    notes: ["The canvas keys (Mod+D, Delete, Mod+], Mod+[) work without it."],
    usage: `const plugins = [rectangle, arrange, inspector];`,
  },
];
