import { definePlugin, emptyGraph, type FlowGraph, type FlowNode } from "@forgeron/flow";
import {
  FlowCanvas,
  useFlow,
  defineEditorPlugin,
  type FlowPluginEntry,
} from "@forgeron/flow/react";
import {
  bezier,
  deleteKeys,
  edges,
  fullEditorPlugins,
  minimalEditorPlugins,
  typedEditorPlugins,
} from "@forgeron/flow/plugins/editor";
import { Segmented, Switch } from "@forgeron/ui";
import { useMemo, useState } from "react";

// "Features come from plugins": the same graph in three editors made of different plugin lists, and
// a tiny third-party kind (an invoice and a payment, with their own port type and a rule that
// refuses a second payment) that any of them can take. A node whose kind the list does not draw
// stays in the graph as a dashed box.

interface Data {
  title: string;
}

const money = defineEditorPlugin({
  core: definePlugin({
    id: "money",
    name: "Money",
    description: "Invoices and payments, with a type of port of their own.",
    nodeKinds: {
      invoice: {
        label: "Invoice",
        size: { w: 200, h: 64 },
        outputs: [{ id: "bill", type: "invoice" }],
        data: () => ({ title: "Invoice" }),
      },
      payment: {
        label: "Payment",
        size: { w: 200, h: 64 },
        inputs: [{ id: "due", type: "invoice" }],
        data: () => ({ title: "Payment" }),
      },
    },
    portTypes: { invoice: { label: "Invoice", color: "--accent" } },
    connectionRules: [
      {
        id: "paid-once",
        check: ({ source, target, graph }) =>
          source.type === "invoice" &&
          target.type === "payment" &&
          graph.edges.some((e) => e.from.node === source.id)
            ? "already-paid"
            : null,
        messages: { "already-paid": "An invoice is paid once." },
      },
    ],
  }),
  nodeRenderers: {
    invoice: (n: FlowNode<Data>) => <div className="fp-node fp-invoice">{n.data.title}</div>,
    payment: (n: FlowNode<Data>) => <div className="fp-node">{n.data.title}</div>,
  },
});

type Preset = "bare" | "minimal" | "typed" | "full";
const BASE: Record<Preset, ReadonlyArray<FlowPluginEntry<Data>>> = {
  // No `nodes` plugin: a kind nobody draws stays in the graph as a dashed box.
  bare: [edges, bezier, deleteKeys],
  minimal: minimalEditorPlugins,
  typed: typedEditorPlugins,
  full: fullEditorPlugins,
};
// Lists live at module scope: a new list rebuilds the editor, an equal one does not.
const LISTS: Record<`${Preset}:${"money" | "plain"}`, ReadonlyArray<FlowPluginEntry<Data>>> = {
  "bare:plain": BASE.bare,
  "bare:money": [...BASE.bare, money],
  "minimal:plain": BASE.minimal,
  "minimal:money": [...BASE.minimal, money],
  "typed:plain": BASE.typed,
  "typed:money": [...BASE.typed, money],
  "full:plain": BASE.full,
  "full:money": [...BASE.full, money],
};

const box = (
  id: string,
  type: string,
  x: number,
  y: number,
  inputs: FlowNode<Data>["inputs"],
  outputs: FlowNode<Data>["outputs"],
  title: string,
): FlowNode<Data> => ({
  id,
  type,
  position: { x, y },
  size: { w: 200, h: 64 },
  inputs,
  outputs,
  data: { title },
});

const START: FlowGraph<Data> = {
  ...emptyGraph<Data>(),
  nodes: [
    box("inv", "invoice", 0, 0, [], [{ id: "bill", type: "invoice" }], "Invoice 42"),
    box("pay-1", "payment", 320, 0, [{ id: "due", type: "invoice" }], [], "Payment"),
    box("pay-2", "payment", 320, 120, [{ id: "due", type: "invoice" }], [], "Second payment"),
    box("old", "legacy-step", 0, 120, [{ id: "in" }], [{ id: "out" }], "kept as it is"),
  ],
  edges: [{ id: "e1", from: { node: "inv", port: "bill" }, to: { node: "pay-1", port: "due" } }],
};

const renderNode = (n: FlowNode<Data>) => <div className="fp-node">{n.data.title}</div>;

export default function FlowPlugins() {
  const [preset, setPreset] = useState<Preset>("full");
  const [withMoney, setWithMoney] = useState(true);
  const plugins = LISTS[`${preset}:${withMoney ? "money" : "plain"}`];
  const flow = useFlow<Data>({ graph: START, grid: { snap: false } });
  const ids = useMemo(
    () => [
      "core: graph · controller · host",
      ...plugins.map((p) => ("core" in p ? p.core.id : p.id)),
    ],
    [plugins],
  );
  return (
    <div className="fd">
      <div className="fd-bar">
        <Segmented
          label="Preset"
          value={preset}
          onChange={(v) => setPreset(v as Preset)}
          options={[
            { value: "bare", label: "Bare" },
            { value: "minimal", label: "Minimal" },
            { value: "typed", label: "Typed" },
            { value: "full", label: "Full" },
          ]}
        />
        <Switch
          label="Money plugin"
          checked={withMoney}
          onChange={(e) => setWithMoney(e.target.checked)}
        />
        <span className="fd-status t-mono dim" aria-live="polite">
          {flow.current.nodes.length} nodes · {flow.current.edges.length} edges
        </span>
      </div>
      <div className="fp-list t-mono dim" aria-label="Plugins in this editor">
        {ids.map((id) => (
          <span key={id}>{id}</span>
        ))}
      </div>
      <div className="fd-stage fp-stage">
        <FlowCanvas<Data>
          flow={flow}
          label="Plugin editor"
          renderNode={renderNode}
          nodeLabel={(n) => `${n.data.title} (${n.type})`}
          plugins={plugins}
          className="fd-canvas"
        />
      </div>
    </div>
  );
}
