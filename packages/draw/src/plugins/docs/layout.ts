import type { PluginDoc } from "./types";

export const layoutDocs: ReadonlyArray<PluginDoc> = [
  {
    id: "frame",
    family: "layout",
    name: "Frame",
    summary:
      "A named area that carries its items, clips them and exports them: an item belongs to the frame holding its centre. Key F.",
    core: "@forgeron/draw/plugins/layout",
    editor: "@forgeron/draw/plugins/editor/layout",
    json: `{
  "id": "f1",
  "kind": "frame",
  "bounds": { "x": 0, "y": 0, "w": 920, "h": 520 },
  "z": 0,
  "data": { "type": "frame", "name": "Sprint plan" }
}`,
    notes: [
      "Membership is stored on the item (`data.frame`) and settled when a change ends; an item joining a frame is raised above it, a frame that moves takes its items, deleting it keeps them.",
      "Exporting a frame alone gives exactly its box, with its items clipped.",
    ],
    usage: `import { sketchEditorPlugins } from "@forgeron/draw/plugins/editor";
import { frame } from "@forgeron/draw/plugins/editor/layout";

// Frames are part of full; add them to a smaller list one by one.
const plugins = [...sketchEditorPlugins, frame];`,
  },
  {
    id: "groups",
    family: "layout",
    name: "Groups",
    summary:
      "Items of one group are selected together; a copy of a group is a new group of the copies. Keys Mod+G, Shift+Mod+G.",
    core: "@forgeron/draw/plugins/layout",
    editor: "@forgeron/draw/plugins/editor/layout",
    json: `{
  "id": "r1",
  "kind": "rectangle",
  "bounds": { "x": 0, "y": 0, "w": 160, "h": 100 },
  "z": 0,
  "data": {
    "type": "shape",
    "fill": { "type": "none" },
    "stroke": { "color": "ink", "width": 2, "dash": "solid" },
    "group": "group-1"
  }
}`,
    notes: ["Any kind may carry `data.group`; the rule selects by it, kinds need nothing."],
    usage: `import { groups, rectangle } from "@forgeron/draw/plugins/editor";
const plugins = [rectangle, groups];`,
  },
  {
    id: "lock",
    family: "layout",
    name: "Lock",
    summary: "Locks items so they cannot be moved, resized, deleted or erased. Shift+Mod+L.",
    core: "@forgeron/draw/plugins/layout",
    editor: "@forgeron/draw/plugins/editor/layout",
    json: `{
  "id": "t1",
  "kind": "text",
  "bounds": { "x": 220, "y": 220, "w": 320, "h": 80 },
  "z": 1,
  "locked": true,
  "data": { "type": "text", "text": "Ship the draw editor", "size": 28, "color": "accent", "align": "center" }
}`,
    notes: ["`locked` is the canvas item's own field; the plugin only toggles it."],
    usage: `import { lock } from "@forgeron/draw/plugins/editor/layout";
const plugins = [lock];`,
  },
  {
    id: "align",
    family: "layout",
    name: "Align and distribute",
    summary: "Lines a selection up on an edge or a centre and spaces it evenly.",
    core: "@forgeron/draw/plugins/layout",
    editor: "@forgeron/draw/plugins/editor/layout",
    notes: [
      "Align needs two items, distribute three. Locked items and arrows (which follow) do not move.",
    ],
    usage: `import { align, distribute } from "@forgeron/draw";

store.updateMany(align(store.selectedItems(), "left"), { label: "Align" });`,
  },
];
