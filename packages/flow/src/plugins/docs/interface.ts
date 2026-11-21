// The documentation of the interface plugins as data: delete, the far view, the toolbar, the zoom
// controls and the minimap. Their core halves say nothing about the graph; without their editor
// half that part of the interface is not there.

import { sampleEdge, sampleFlow, sampleNode } from "./sample";
import type { PluginDoc } from "./types";

const two = sampleFlow(
  [
    sampleNode("a", "step", 0, [], [{ id: "out" }]),
    sampleNode("b", "step", 320, [{ id: "in" }], []),
  ],
  [sampleEdge("e1", ["a", "out"], ["b", "in"])],
);

export const interfaceDocs: PluginDoc[] = [
  {
    id: "delete",
    family: "interface",
    name: "Delete",
    summary:
      "Delete and Backspace remove the selected nodes with the edges into them, and the selected edges, as one undo step. With nothing selected the key is left to the canvas.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/ui",
    json: two,
    usage: `// A tool is a command by id: the key and a button can name it.
flow.deleteSelection(flow.selectedEdges);`,
  },
  {
    id: "far",
    family: "interface",
    name: "Far view",
    summary:
      "Below a zoom (40 % by default) nodes are plain labelled boxes and edges plain lines, drawn by the canvas's far layer on the GPU instead of hundreds of rich cards, in the colours of their run state.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/ui",
    options: [
      {
        name: "farZoom",
        type: "number",
        description:
          "Prop of <FlowCanvas>: the zoom below which the far view applies. 0 always draws the bodies.",
        default: "0.4",
      },
    ],
    json: two,
    notes: ["Without it the editor always draws every node's body."],
    usage: `<FlowCanvas flow={flow} label="Flow" renderNode={renderNode} farZoom={0.3} />;`,
  },
  {
    id: "toolbar",
    family: "interface",
    name: "Toolbar",
    summary:
      "The buttons and choices the other plugins contribute (auto-layout from the layout plugin, the edge style from the edges plugin), drawn by <FlowToolbar>.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/ui",
    options: [
      {
        name: "onEdgeStyleChange",
        type: "(style: string) => void",
        description:
          "Prop of <FlowToolbar>: shows the edge style switch, listing the styles of the plugin list.",
      },
      {
        name: "FlowEditorPlugin.toolbar",
        type: "ToolbarItem[]",
        description:
          "A `button` names a tool (its label, icon and key come from it); a `choice` lists options and sets one.",
      },
    ],
    json: two,
    usage: `<FlowCanvas flow={flow} label="Flow" renderNode={renderNode}>
  <FlowToolbar flow={flow} edgeStyle={edgeStyle} onEdgeStyleChange={setEdgeStyle} />
</FlowCanvas>`,
  },
  {
    id: "zoom-controls",
    family: "interface",
    name: "Zoom controls",
    summary: "Zoom in and out, fit, undo and redo, over the surface.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/ui",
    options: [
      { name: "controls", type: "boolean", description: "Prop of <FlowCanvas>.", default: "true" },
    ],
    json: two,
    usage: `<FlowCanvas flow={flow} label="Flow" renderNode={renderNode} controls={false} />;`,
  },
  {
    id: "minimap",
    family: "interface",
    name: "Minimap",
    summary: "A small map of the whole flow, coloured by run state.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/ui",
    options: [
      { name: "minimap", type: "boolean", description: "Prop of <FlowCanvas>.", default: "true" },
    ],
    json: two,
    usage: `<FlowCanvas flow={flow} label="Flow" renderNode={renderNode} minimap={false} />;`,
  },
];
