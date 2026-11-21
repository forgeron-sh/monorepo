// The documentation of the edge plugins as data: the styles and what an edge is made of.

import { sampleEdge, sampleFlow, sampleNode } from "./sample";
import type { PluginDoc } from "./types";

const two = sampleFlow(
  [
    sampleNode("a", "step", 0, [], [{ id: "out" }]),
    sampleNode("b", "step", 320, [{ id: "in" }], []),
  ],
  [sampleEdge("e1", ["a", "out"], ["b", "in"])],
);

export const edgeDocs: PluginDoc[] = [
  {
    id: "edges",
    family: "edges",
    name: "Edges",
    summary:
      "Draws the edges under the nodes, takes a click to select one (shift to add), shows the run on it and draws the wire of a connection being made, with the reason when a rule refuses it.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/edges",
    options: [
      {
        name: "edgeStyle",
        type: "string",
        description:
          "Prop of <FlowCanvas>: the id of an edge style a plugin brings. An unknown id falls back to the first style, or a straight line.",
        default: '"bezier"',
      },
    ],
    json: two,
    notes: [
      "An edge is `{ id, from: { node, port }, to: { node, port } }`, always from an output to an input.",
      "Only the edges whose box meets the visible window are in the DOM; back from the far level they return a few dozen a frame.",
      "Parts drawn inside an edge (arrowhead, insert button, reconnect handle) are contributed by other plugins (`edgeParts`).",
    ],
    usage: `import { nodes, edges, bezier } from "@forgeron/flow/plugins/editor";

// Nodes and edges, nothing else:
<FlowCanvas flow={flow} label="Flow" plugins={[nodes, edges, bezier]} renderNode={renderNode} />;`,
  },
  {
    id: "bezier",
    family: "edges",
    name: "Curved edges",
    summary:
      "Edges as curves that leave an output and enter an input horizontally; a bend as wide as half the distance.",
    core: "@forgeron/flow/plugins/edges",
    editor: "@forgeron/flow/plugins/editor/edge-styles",
    json: two,
    notes: ["An edge style is a pure function from two port points to a path: `bezierPath(a, b)`."],
    usage: `import { bezierPath } from "@forgeron/flow";

const { d, mid, arrow } = bezierPath({ x: 240, y: 40 }, { x: 300, y: 40 });`,
  },
  {
    id: "orthogonal",
    family: "edges",
    name: "Stepped edges",
    summary:
      "Edges as horizontal and vertical runs with square corners; an edge that goes backwards loops under its two nodes instead of through them.",
    core: "@forgeron/flow/plugins/edges",
    editor: "@forgeron/flow/plugins/editor/edge-styles",
    options: [
      {
        name: "FlowCorePlugin.edgeStyles",
        type: "Record<string, { label: string; path(a, b, around?) => EdgeGeometry }>",
        description:
          "How your own style is brought: the toolbar's edge switch lists every style of the plugin list.",
      },
    ],
    json: two,
    usage: `import { definePlugin, straightPath } from "@forgeron/flow";

// Your own style, in two lines of geometry: a straight diagonal with a pixel arrow.
const diagonal = definePlugin({
  id: "diagonal",
  name: "Diagonal edges",
  description: "Straight lines.",
  edgeStyles: { diagonal: { label: "Lines", path: (a, b) => straightPath(a, b) } },
});`,
  },
  {
    id: "edge-arrows",
    family: "edges",
    name: "Arrowheads",
    summary:
      "An arrowhead at the input end of every edge, six units long, in the colour of the edge.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/edge-parts",
    requires: ["edges"],
    json: two,
    notes: ["The line stops at the base of the arrowhead; the arrowhead reaches the port."],
    usage: `import { edgeArrowsPlugin } from "@forgeron/flow/plugins/editor/edge-parts";

const plugins = [...minimalEditorPlugins, edgeArrowsPlugin];`,
  },
  {
    id: "edge-insert",
    family: "edges",
    name: "Insert button",
    summary:
      "A + halfway along a hovered or selected edge. The editor does not know what to insert: onInsert opens your picker, and flow.insertOnEdge puts the node there.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/edge-parts",
    requires: ["edges"],
    options: [
      {
        name: "onInsert",
        type: "(edge: FlowEdge, point: Point) => void",
        description: "Prop of <FlowCanvas>. Without it the button is not drawn.",
      },
    ],
    json: two,
    usage: `<FlowCanvas
  flow={flow}
  label="Flow"
  renderNode={renderNode}
  onInsert={(edge) => openPicker((kind) => flow.insertOnEdge(edge.id, flow.registry().createNode(kind)))}
/>;`,
  },
  {
    id: "edge-reconnect",
    family: "edges",
    name: "Reconnect",
    summary:
      "A handle at the input end of a selected edge: drag it to another input to reconnect (the rules ask again), or off any node to delete the edge. One undo step.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/edge-parts",
    requires: ["edges"],
    json: two,
    usage: `import { edgeReconnectPlugin } from "@forgeron/flow/plugins/editor/edge-parts";

const plugins = [...typedEditorPlugins, edgeReconnectPlugin];`,
  },
];
