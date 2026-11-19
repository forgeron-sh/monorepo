// The interface plugins. They own no node and no mark: each is a place of the editor's interface
// (the placeholder, the slash menu, the selection toolbar, the block handle, the toolbar of a
// block) that the content plugins contribute to. Their core halves only name them; the editor
// halves draw them.

import { definePlugin } from "../core/plugin";

export const placeholder = definePlugin({
  id: "placeholder",
  name: "Placeholder",
  description: "A hint in the empty block under the cursor.",
});

export const slash = definePlugin({
  id: "slash",
  name: "Slash menu",
  description: "Type / to insert or turn a block into another: the entries come from the plugins.",
});

export const bubble = definePlugin({
  id: "bubble",
  name: "Selection toolbar",
  description: "A toolbar above the selection: the plugins add their buttons (marks, link).",
});

export const blockHandle = definePlugin({
  id: "blockHandle",
  name: "Block handle",
  description: "A + and a grip at the left of a block: add, drag, turn into, move, delete.",
});

export const blockToolbar = definePlugin({
  id: "blockToolbar",
  name: "Block toolbar",
  description: "A toolbar over the block the cursor is in (a table): the plugins add theirs.",
});
