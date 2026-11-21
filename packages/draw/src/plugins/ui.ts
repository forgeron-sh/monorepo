// The interface plugins, core half: they own no kind and no rule, so their core half only names
// them. The editor half of each draws a slot of the editor: the tool dock, the properties panel,
// the minimap, the basic actions. Without one, that part of the interface is simply not there.

import { definePlugin } from "../core/plugin";

export const toolbar = definePlugin({
  id: "toolbar",
  name: "Tool dock",
  description: "The floating dock of tools, built from the tools the other plugins bring.",
});

export const inspector = definePlugin({
  id: "inspector",
  name: "Properties panel",
  description:
    "The panel of the selection (or of what the active tool will draw): the panels and the actions the other plugins bring.",
});

export const minimap = definePlugin({
  id: "minimap",
  name: "Minimap",
  description: "An overview of the board with the viewport, to jump around it.",
});

export const arrange = definePlugin({
  id: "arrange",
  name: "Arrange",
  description: "Duplicate, delete, bring to front and send to back, on the selection.",
});
