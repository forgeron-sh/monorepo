// The documentation of the plugins that give the graph its behaviour, as data: nodes, layout,
// groups, run state, the clipboard. One entry per plugin, for a catalog (the site, the gallery) to
// list the same way as every other. No React, no canvas.

import { sampleEdge, sampleFlow, sampleNode } from "./sample";
import type { PluginDoc } from "./types";

const FULL = `import { FlowCanvas, useFlow } from "@forgeron/flow/react";
import { fullEditorPlugins } from "@forgeron/flow/plugins/editor";
import { fullCorePlugins } from "@forgeron/flow/plugins";

// Module scope: a new list rebuilds the editor. \`useFlow\` and \`<FlowCanvas>\` take the same list.
const plugins = [...fullEditorPlugins /* , yourPlugin */];`;

export const graphDocs: PluginDoc[] = [
  {
    id: "nodes",
    family: "nodes",
    name: "Nodes",
    summary:
      "Draws every node as a box with its ports on the sides and the body your renderNode gives. Without it a kind no other plugin draws is kept in the graph and shown as a dashed box with its name.",
    core: "@forgeron/flow/plugins/ui",
    editor: "@forgeron/flow/plugins/editor/nodes",
    options: [
      {
        name: "renderNode",
        type: "(node: FlowNode<D>, state: { selected: boolean; status: RunStatus }) => ReactNode",
        description: "Prop of <FlowCanvas>: the body of a node, inside its box.",
      },
      {
        name: "nodeLabel",
        type: "(node: FlowNode<D>) => string",
        description:
          "Prop of <FlowCanvas>: names a node for assistive technology and the far view.",
        default: "`<type> <id>`",
      },
      {
        name: "FlowCorePlugin.nodeKinds",
        type: "Record<string, NodeKindSpec>",
        description:
          "What a plugin brings to give a kind its label, size, ports and data; `flow.addKind(type, init)` builds a node from it. A kind is drawn by a `nodeRenderers` entry of the editor half.",
      },
    ],
    json: sampleFlow(
      [
        sampleNode("n1", "trigger", 0, [], [{ id: "out" }], { title: "Order confirmed" }),
        sampleNode("n2", "from-the-future", 320, [{ id: "in" }], [{ id: "out" }], { any: "thing" }),
      ],
      [sampleEdge("e1", ["n1", "out"], ["n2", "in"])],
    ),
    notes: [
      "A node is `{ id, type, position, size, inputs, outputs, data }`; `type` is a string no plugin has to know.",
      "A node whose kind no plugin draws is kept as it is, drawn as a labelled dashed box with its ports, and written back untouched.",
      'A plugin that draws one kind (`nodeRenderers: { invoice }`) and `nodes` (`"*"`) together: the kind\'s own wins.',
    ],
    usage: `${FULL}

<FlowCanvas
  flow={flow}
  label="Automation editor"
  plugins={plugins}
  renderNode={(node, { selected, status }) => <StepCard {...node.data} selected={selected} status={status} />}
/>;`,
  },
  {
    id: "layered",
    family: "layout",
    name: "Layered auto-layout",
    summary:
      "Lays the graph out left to right in layers (Sugiyama): cycles broken, layers by longest path, crossings reduced by barycentre sweeps, edges straightened, groups placed as blocks, snapped to the grid. The same graph always gives the same drawing.",
    core: "@forgeron/flow/plugins/layout",
    editor: "@forgeron/flow/plugins/editor/layout",
    options: [
      {
        name: "layerGap, nodeGap, edgeGap",
        type: "number",
        description:
          "Distances between layers, between two nodes of a layer, and around a long edge's lane.",
        default: "80, 40, 20",
      },
      {
        name: "grid",
        type: "number",
        description: "Positions land on this grid; 0 for none.",
        default: "20",
      },
      {
        name: "sweeps, passes",
        type: "number",
        description: "Crossing-reduction sweeps and straightening passes.",
        default: "12, 8",
      },
      {
        name: "useFlow({ layout })",
        type: "LayoutOptions",
        description: "The options `flow.autoLayout()` and the Shift+L key give the engine.",
      },
    ],
    json: sampleFlow(
      [
        sampleNode("a", "step", 0, [], [{ id: "out" }]),
        sampleNode("b", "step", 0, [{ id: "in" }], [{ id: "true" }, { id: "false" }]),
        sampleNode("c", "step", 0, [{ id: "in" }], []),
        sampleNode("d", "step", 0, [{ id: "in" }], []),
      ],
      [
        sampleEdge("e1", ["a", "out"], ["b", "in"]),
        sampleEdge("e2", ["b", "true"], ["c", "in"]),
        sampleEdge("e3", ["b", "false"], ["d", "in"]),
      ],
    ),
    notes: [
      "The algorithm is in the core half and is a pure function: `layoutGraph(graph, options)` runs in a Worker or on a server (500 nodes and 700 edges in about 2.5 ms).",
      "The engine only moves nodes; edges and groups are data and stay as they are. Without the plugin, `flow.autoLayout()` does nothing and no button is drawn.",
      "Auto-layout is one undo step, then the view fits the result (`animateViewport`).",
    ],
    usage: `import { layoutGraph, applyLayout, parseFlow } from "@forgeron/flow";

// On a server or in a Worker: no React, no canvas React layer.
const graph = parseFlow(json);
const laidOut = applyLayout(graph, layoutGraph(graph, { layerGap: 60 }));

// In the editor: Shift+L, the toolbar button, or
flow.autoLayout();`,
  },
  {
    id: "groups",
    family: "groups",
    name: "Groups",
    summary:
      "Labelled frames around nodes. A group is a list of node ids in the document; its frame is computed from the nodes, so moving a node moves the frame. The label selects the group's nodes.",
    core: "@forgeron/flow/plugins/groups",
    editor: "@forgeron/flow/plugins/editor/groups",
    options: [
      {
        name: "flow.groupSelection(label) / flow.ungroup(id)",
        type: "(label: string) / (groupId: string)",
        description:
          "Group the selected nodes (taking them out of any other group), or dissolve a group.",
      },
    ],
    json: sampleFlow(
      [
        sampleNode("a", "step", 0, [], [{ id: "out" }]),
        sampleNode("b", "step", 320, [{ id: "in" }], []),
      ],
      [sampleEdge("e1", ["a", "out"], ["b", "in"])],
      [{ id: "group-1", label: "Intake", nodes: ["a", "b"] }],
    ),
    notes: [
      "A node is in one group at most; a group left with no node goes.",
      "The groups of a document are kept, and written back, whatever the plugins: without this one they are not drawn.",
      "The layout plugin places each group as a block so frames never overlap.",
    ],
    usage: `import { groups } from "@forgeron/flow/plugins/groups";
import { groups as groupsEditor } from "@forgeron/flow/plugins/editor/groups";

// Core half alone: the frame of a group, anywhere.
const frame = groups.groups.bounds(indexGraph(graph), group.nodes);

// Both halves, with the nodes and edges plugins:
const plugins = [nodes, edges, bezier, groupsEditor];`,
  },
  {
    id: "run",
    family: "run",
    name: "Run state",
    summary:
      "Plans the frames of a run, wave by wave, and shows them: node outlines by state, edge colours, items marching along running edges (still under reduced motion), the minimap coloured by state.",
    core: "@forgeron/flow/plugins/run",
    editor: "@forgeron/flow/plugins/editor/run",
    options: [
      {
        name: "run",
        type: "RunState",
        description:
          "Prop of <FlowCanvas>: `{ nodes, edges }` of `idle | running | success | error | handled | skipped`. Ignored without this plugin.",
      },
      {
        name: "decide",
        type: "(node: FlowNode) => NodeOutcome",
        description:
          "Argument of `planRun(graph, decide)`: what one node did, through which outputs; an `error` that names `ports` carries on and is `handled`.",
      },
    ],
    json: sampleFlow(
      [
        sampleNode("t", "trigger", 0, [], [{ id: "out" }]),
        sampleNode("c", "if", 320, [{ id: "in" }], [{ id: "true" }, { id: "false" }]),
        sampleNode("y", "action", 640, [{ id: "in" }], []),
      ],
      [sampleEdge("e1", ["t", "out"], ["c", "in"]), sampleEdge("e2", ["c", "true"], ["y", "in"])],
    ),
    notes: [
      "Run state is not part of the document: it is a value you hold and pass to the canvas (`run`).",
      "`planRun` is pure and framework-free: plan a run on a server, send the frames to the editor.",
      "An output that did not fire leaves skipped edges, and what only they reach is skipped.",
    ],
    usage: `import { planRun, IDLE_RUN } from "@forgeron/flow";

const frames = planRun(flow.current, (node) =>
  node.type === "if" ? { status: "success", ports: ["true"] } : { status: "success" },
);
let i = 0;
const timer = setInterval(() => setRun(frames[i++] ?? IDLE_RUN), 400);

<FlowCanvas flow={flow} label="Flow" run={run} renderNode={renderNode} />;`,
  },
  {
    id: "clipboard",
    family: "clipboard",
    name: "Clipboard",
    summary:
      "Duplicate, copy, cut and paste: the selected nodes, the edges between them and the groups wholly inside, as flow JSON on the system clipboard; so a copy pastes into another flow, another tab or a text field.",
    core: "@forgeron/flow/plugins/clipboard",
    editor: "@forgeron/flow/plugins/editor/clipboard",
    options: [
      {
        name: "keys",
        type: "mod+d, mod+c, mod+x, mod+v",
        description:
          "Duplicate, copy, cut, paste. Without the plugin the canvas's own duplicate copies nodes unconnected.",
      },
      {
        name: "flow.copySelection() / flow.paste(json?, at?)",
        type: "() => string | null / (json?, at?) => string[]",
        description: "The same from code; paste returns the new ids and selects them.",
      },
    ],
    json: sampleFlow(
      [
        sampleNode("step-1", "step", 20, [], [{ id: "out" }]),
        sampleNode("step-2", "step", 320, [{ id: "in" }], []),
      ],
      [sampleEdge("edge-1", ["step-1", "out"], ["step-2", "in"])],
    ),
    notes: [
      "Pasting asks the clipboard first; when it holds nothing of ours, the last copy is pasted.",
      "A paste is one undo step, under new ids, a grid cell further each time (or at the point you give).",
    ],
    usage: `import { clipboard } from "@forgeron/flow/plugins/editor/clipboard";

const plugins = [...minimalEditorPlugins, clipboard];

// The same format from code:
const json = flow.copySelection();
flow.paste(json, { x: 400, y: 200 });`,
  },
];
