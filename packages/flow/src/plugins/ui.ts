// The interface plugins, core halves. They say nothing about the graph: each is the name and the
// place of a part of the interface (the node frame, the edge layer, the toolbar, the minimap), so
// that a list of plugins is the whole description of an editor, drawn or not. Their editor halves
// are in `./editor/ui.tsx`; without a half, a part is not there.

import { definePlugin } from "../core/plugin";

export const nodes = definePlugin({
  id: "nodes",
  name: "Nodes",
  description:
    "Draws every node as a box with its ports on the sides and the body your `renderNode` gives; the fallback for a kind no other plugin draws.",
});

export const edges = definePlugin({
  id: "edges",
  name: "Edges",
  description:
    "Draws the edges under the nodes, takes a click to select one, shows the run on it, and draws the wire of a connection being made.",
});

export const edgeArrows = definePlugin({
  id: "edge-arrows",
  name: "Arrowheads",
  description: "An arrowhead at the input end of every edge.",
  requires: ["edges"],
});

export const edgeInsert = definePlugin({
  id: "edge-insert",
  name: "Insert button",
  description:
    "A + halfway along a hovered or selected edge: `onInsert` opens whatever picks a step to put there.",
  requires: ["edges"],
});

export const edgeReconnect = definePlugin({
  id: "edge-reconnect",
  name: "Reconnect",
  description:
    "A handle at the input end of a selected edge: drag it to another input to reconnect, off any node to delete the edge.",
  requires: ["edges"],
});

export const deleteKeys = definePlugin({
  id: "delete",
  name: "Delete",
  description:
    "Delete and Backspace remove the selected nodes, with the edges into them, and the selected edges.",
});

export const far = definePlugin({
  id: "far",
  name: "Far view",
  description:
    "Below a zoom (40 % by default) nodes are plain labelled boxes and edges plain lines, drawn by the canvas's far layer instead of hundreds of rich cards.",
});

export const toolbar = definePlugin({
  id: "toolbar",
  name: "Toolbar",
  description:
    "The buttons and choices the other plugins offer (auto-layout, the edge style), drawn by <FlowToolbar>.",
});

export const zoomControls = definePlugin({
  id: "zoom-controls",
  name: "Zoom controls",
  description: "Zoom in and out, fit, undo and redo, over the surface (`controls`, on by default).",
});

export const minimap = definePlugin({
  id: "minimap",
  name: "Minimap",
  description: "A small map of the whole flow, coloured by run state (`minimap`, on by default).",
});
