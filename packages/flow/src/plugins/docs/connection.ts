// The documentation of the connection rules as data: one plugin per rule, each with the reason it
// gives when it refuses.

import { sampleEdge, sampleFlow, sampleNode } from "./sample";
import type { PluginDoc } from "./types";

const RULES = `import { connect } from "@forgeron/flow";
import { definePlugin } from "@forgeron/flow";

// A rule of your own: return null to accept, or the reason (a code, with its sentence in \`messages\`).
const paidOnce = definePlugin({
  id: "paid-once",
  name: "Paid once",
  description: "An invoice has one payment.",
  connectionRules: [
    {
      id: "paid-once",
      check: ({ source, target, graph }) =>
        source.type === "invoice" && target.type === "payment" && graph.edges.some((e) => e.from.node === source.id)
          ? "already-paid"
          : null,
      messages: { "already-paid": "An invoice is paid once." },
    },
  ],
});`;

const typed = sampleFlow(
  [
    sampleNode("a", "step", 0, [], [{ id: "out", type: "invoice" }]),
    sampleNode("b", "step", 320, [{ id: "in", type: "invoice" }], []),
  ],
  [sampleEdge("e1", ["a", "out"], ["b", "in"])],
);

export const connectionDocs: PluginDoc[] = [
  {
    id: "self-loop",
    family: "connection",
    name: "No self loop",
    summary:
      "Refuses an edge from a node to itself (reason `same-node`), even where cycles are allowed.",
    core: "@forgeron/flow/plugins/connect",
    editor: "@forgeron/flow/plugins/editor/connect",
    json: typed,
    usage: `${RULES}

const result = connect(graph, { node: "a", port: "out" }, { node: "a", port: "in" }, { plugins: [selfLoop] });
// { ok: false, error: "same-node" }`,
  },
  {
    id: "port-types",
    family: "connection",
    name: "Port types",
    summary:
      "An output feeds an input of the same type, or of `any` (the type of a port that says none); a port type may declare others its inputs take. Refuses with `type`.",
    core: "@forgeron/flow/plugins/connect",
    editor: "@forgeron/flow/plugins/editor/connect",
    options: [
      {
        name: "ConnectOptions.compatible",
        type: "(from: string, to: string) => boolean",
        description: "Replaces the test of two types.",
      },
      {
        name: "FlowCorePlugin.portTypes",
        type: "Record<string, { label, description?, color?, accepts? }>",
        description:
          "Declares a type: its label, a colour token that tints its ports, and the types an input of it also takes. A type no plugin declares still connects to itself.",
      },
    ],
    json: typed,
    notes: [
      "Types are strings in the document and never checked when it is read: an edge between ports of a type nobody declares is kept.",
    ],
    usage: `${RULES}

const numbers = definePlugin({
  id: "numbers",
  name: "Numbers",
  description: "An int is a number.",
  requires: ["port-types"],
  portTypes: { number: { label: "Number", color: "--accent", accepts: ["int"] } },
});`,
  },
  {
    id: "no-duplicates",
    family: "connection",
    name: "No duplicate edge",
    summary: "Refuses a second edge between the same two ports (reason `duplicate`).",
    core: "@forgeron/flow/plugins/connect",
    editor: "@forgeron/flow/plugins/editor/connect",
    json: typed,
    usage: `${RULES}

import { checkConnection } from "@forgeron/flow";

// checkConnection tells why, without making the edge:
checkConnection(graph, from, to, { plugins }); // "duplicate" | null`,
  },
  {
    id: "fan-out",
    family: "connection",
    name: "Single fan-out",
    summary:
      "An output feeds any number of inputs unless it says `multiple: false`: then it feeds one (reason `fan-out`).",
    core: "@forgeron/flow/plugins/connect",
    editor: "@forgeron/flow/plugins/editor/connect",
    json: sampleFlow(
      [
        sampleNode("a", "step", 0, [], [{ id: "out", multiple: false }]),
        sampleNode("b", "step", 320, [{ id: "in" }], []),
      ],
      [sampleEdge("e1", ["a", "out"], ["b", "in"])],
    ),
    usage: RULES,
  },
  {
    id: "single-input",
    family: "connection",
    name: "Single input",
    summary:
      "An input takes one edge unless it says `multiple: true`, a merge (reason `occupied`).",
    core: "@forgeron/flow/plugins/connect",
    editor: "@forgeron/flow/plugins/editor/connect",
    json: sampleFlow(
      [
        sampleNode("a", "step", 0, [], [{ id: "out" }]),
        sampleNode("b", "step", 0, [], [{ id: "out" }]),
        sampleNode("m", "merge", 320, [{ id: "in", multiple: true }], []),
      ],
      [sampleEdge("e1", ["a", "out"], ["m", "in"]), sampleEdge("e2", ["b", "out"], ["m", "in"])],
    ),
    usage: RULES,
  },
  {
    id: "no-cycles",
    family: "connection",
    name: "No cycles",
    summary:
      "Refuses an edge that closes a loop (reason `cycle`), unless ConnectOptions.cycles is `allow`. Loops of a document are always readable and drawn.",
    core: "@forgeron/flow/plugins/connect",
    editor: "@forgeron/flow/plugins/editor/connect",
    options: [
      {
        name: "ConnectOptions.cycles",
        type: '"forbid" | "allow"',
        description: '`useFlow({ connect: { cycles: "allow" } })`.',
        default: '"forbid"',
      },
    ],
    json: sampleFlow(
      [
        sampleNode("a", "step", 0, [{ id: "in" }], [{ id: "out" }]),
        sampleNode("b", "step", 320, [{ id: "in" }], [{ id: "out" }]),
      ],
      [sampleEdge("e1", ["a", "out"], ["b", "in"])],
    ),
    usage: `${RULES}

const flow = useFlow({ graph, connect: { cycles: "allow" } });`,
  },
];
