// The content of the flow page: what it covers, the code to start from and the API tables.

interface ApiRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ApiTable {
  title: string;
  rows: ReadonlyArray<ApiRow>;
}

export const covers: ReadonlyArray<string> = [
  "A graph document: nodes with typed ports, edges from an output to an input, groups; JSON with a version field.",
  "Connection rules: matching types (or any), one edge per input unless it merges, no duplicate, no loop unless allowed.",
  "Connect by dragging from a port; drop on a node to take its first free input, on the surface to add a step there.",
  "Edges as curves or steps, with arrowheads; hover or select one for its “+” (insert a step) and its end (drag to reconnect, off to delete).",
  "Auto-layout, layered left to right (Sugiyama): cycles broken, crossings reduced, edges straightened, on the grid. 500 nodes in about 2 ms.",
  "Run state per node and edge (idle, running, success, error, skipped); items march along running edges, still under reduced motion.",
  "Delete, duplicate, copy, cut and paste carry the edges between the nodes; every edit is one undo step of the canvas history.",
  'The node body is yours (a render prop): here a StepCard with layout="node", the StepPicker to add and the StepInspector to edit.',
];

export const snippets: ReadonlyArray<{ title: string; lang: "tsx"; code: string }> = [
  {
    title: "A flow with steps as nodes",
    lang: "tsx",
    code: `import "@forgeron/canvas/styles.css";
import "@forgeron/flow/styles.css";
import { FlowCanvas, FlowToolbar, useFlow } from "@forgeron/flow/react";
import { StepCard } from "@forgeron/ui";

export function Automation({ graph }) {
  const flow = useFlow({ graph });
  return (
    <FlowCanvas
      flow={flow}
      label="Automation editor"
      renderNode={(node, { selected, status }) => (
        <StepCard layout="node" {...node.data} selected={selected} status={status} />
      )}
      onConnectEnd={(from, point) => openPicker(from, point)}
      onInsert={(edge, point) => openPicker(edge, point)}
    >
      <FlowToolbar flow={flow} />
    </FlowCanvas>
  );
}`,
  },
  {
    title: "The graph without a view",
    lang: "tsx",
    code: `import { applyLayout, connect, layoutGraph, planRun, serializeFlow } from "@forgeron/flow";

const r = connect(graph, { node: "if", port: "true" }, { node: "notify", port: "in" });
if (!r.ok) console.log(r.error); // "type", "occupied", "cycle"…
const laid = applyLayout(r.graph, layoutGraph(r.graph));
const frames = planRun(laid, (node) => ({ status: "success" }));
save(serializeFlow(laid));`,
  },
];

export const keys: ReadonlyArray<{ label: string; combo: string }> = [
  { label: "Delete the selection (nodes and edges)", combo: "backspace" },
  { label: "Duplicate with inner edges", combo: "mod+d" },
  { label: "Copy as flow JSON", combo: "mod+c" },
  { label: "Paste", combo: "mod+v" },
  { label: "Auto-layout", combo: "shift+l" },
  { label: "Undo", combo: "mod+z" },
  { label: "Select every node", combo: "mod+a" },
  { label: "Zoom to fit", combo: "1" },
];

export const tables: ReadonlyArray<ApiTable> = [
  {
    title: "<FlowCanvas>",
    rows: [
      {
        name: "flow",
        type: "FlowApi<D>",
        description: "From useFlow: the canvas store, the graph and its edits.",
      },
      {
        name: "renderNode",
        type: "(node, { selected, status }) => ReactNode",
        description: "The body of a node inside its box; ports are drawn around it.",
      },
      { name: "label", type: "string", description: "Names the surface for assistive technology." },
      {
        name: "nodeLabel",
        type: "(node) => string",
        default: "type id",
        description: "Names a node for assistive technology; the run state is added.",
      },
      { name: "run", type: "RunState", description: "The state of each node and edge to show." },
      {
        name: "edgeStyle",
        type: '"bezier" | "orthogonal"',
        default: '"bezier"',
        description: "Curves, or horizontal and vertical runs.",
      },
      {
        name: "onConnectEnd",
        type: "(from, point) => void",
        description: "A connection dropped on nothing.",
      },
      {
        name: "onInsert",
        type: "(edge, point) => void",
        description: "The “+” of an edge: shows it when given.",
      },
      {
        name: "onNodeActivate",
        type: "(node) => void",
        description: "Double click or Enter on a node.",
      },
      {
        name: "controls / minimap",
        type: "boolean",
        default: "true",
        description: "The zoom controls with undo, the minimap coloured by run state.",
      },
    ],
  },
  {
    title: "useFlow and the controller",
    rows: [
      {
        name: "useFlow(options)",
        type: "{ graph, connect, layout, grid, readOnly }",
        description: "Creates the store once; later options are ignored.",
      },
      {
        name: "current",
        type: "FlowGraph<D>",
        description: "The graph now, read back from the canvas items.",
      },
      {
        name: "connect / connectEnds",
        type: "→ ConnectResult",
        description: "Adds an edge when the rules allow it, or says why not.",
      },
      {
        name: "addNode / insertOnEdge",
        type: "(node, from?) / (edgeId, node)",
        description: "Adds a step, connected after a port or in the middle of an edge.",
      },
      {
        name: "deleteSelection / duplicateSelection",
        type: "(edgeIds?) / ()",
        description: "Nodes with their edges, as one undo step.",
      },
      {
        name: "copySelection / paste",
        type: "() → json / (json?, at?)",
        description: "Flow JSON of the selected nodes and the edges between them.",
      },
      {
        name: "autoLayout",
        type: "(options?) → LayoutResult",
        description: "Lays the flow out as one undo step.",
      },
      {
        name: "load / toJSON",
        type: "(graph | json) / (space?)",
        description: "Replaces the document; writes it.",
      },
    ],
  },
  {
    title: "Pure functions (@forgeron/flow)",
    rows: [
      {
        name: "checkConnection",
        type: "(graph, from, to, options?) → ConnectError | null",
        description:
          "missing-node, missing-port, same-node, type, duplicate, occupied, fan-out, cycle.",
      },
      {
        name: "layoutGraph",
        type: "(graph, options?) → LayoutResult",
        description: "Positions, layers, crossings left, edges reversed to break cycles.",
      },
      {
        name: "planRun",
        type: "(graph, decide) → RunState[]",
        description: "The frames of a run, wave by wave; untaken branches skipped.",
      },
      {
        name: "parseFlow / serializeFlow",
        type: "(json) / (graph)",
        description: "Version 1, checked; FlowFormatError otherwise.",
      },
      {
        name: "insertOnEdge, extractSubgraph, pasteSubgraph",
        type: "graph → graph",
        description: "Edits that leave their input untouched.",
      },
    ],
  },
];
