import type { Point } from "@forgeron/canvas";
import {
  applyLayout,
  generateFlowGraph,
  IDLE_RUN,
  layoutGraph,
  planRun,
  serializeFlow,
  type EdgeStyle,
  type FlowEdge,
  type FlowGraph,
  type FlowNode,
  type FlowPort,
  type PortRef,
  type RunState,
} from "@forgeron/flow";
import { animateViewport } from "@forgeron/canvas/react";
import { FlowCanvas, FlowToolbar, useFlow, type FlowApi } from "@forgeron/flow/react";
import {
  Clock01Icon,
  Database01Icon,
  GitForkIcon,
  GitMergeIcon,
  GlobeIcon,
  HourglassIcon,
  Invoice01Icon,
  Mail01Icon,
  Message01Icon,
  Task01Icon,
  TrophyIcon,
  type IconDefinition,
} from "@forgeron/icons";
import {
  Button,
  JsonView,
  StepCard,
  StepInspector,
  StepPicker,
  variablesFromSample,
  type StepFieldSpec,
  type StepKind,
  type StepOption,
  type StepValues,
} from "@forgeron/ui";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

// The live flow of the gallery: an automation (a trigger, steps, an If and its branches) on the
// canvas. StepPicker adds a block (from the toolbar, a dropped connection or the "+" of an edge),
// StepInspector edits the one selected, Run plays a run's states. `?nodes=500` loads a generated
// flow of that size instead, for the performance measures.

interface StepData {
  /** The catalog entry: what the step is. */
  step: string;
  title: string;
  values: StepValues;
}

interface CatalogEntry {
  id: string;
  label: string;
  group: "trigger" | "apps" | "logic" | "data";
  icon: IconDefinition;
  kind: StepKind;
  app?: string;
  subtitle: string;
  description?: string;
  inputs: FlowPort[];
  outputs: FlowPort[];
  fields: StepFieldSpec[];
  defaults?: StepValues;
}

const IN: FlowPort[] = [{ id: "in", type: "items" }];
const OUT: FlowPort[] = [{ id: "out", type: "items" }];

const catalog: CatalogEntry[] = [
  {
    id: "deal-won",
    label: "Deal moved to Won",
    group: "trigger",
    icon: TrophyIcon,
    kind: "trigger",
    app: "CRM",
    subtitle: "CRM · deal.stage = won",
    description: "When a deal reaches Won",
    inputs: [],
    outputs: OUT,
    fields: [
      {
        key: "pipeline",
        label: "Pipeline",
        type: "select",
        options: [
          { value: "sales", label: "Sales" },
          { value: "renewals", label: "Renewals" },
        ],
      },
    ],
    defaults: { pipeline: "sales" },
  },
  {
    id: "schedule",
    label: "On a schedule",
    group: "trigger",
    icon: Clock01Icon,
    kind: "trigger",
    subtitle: "Schedule · cron",
    description: "Every day, week or month",
    inputs: [],
    outputs: OUT,
    fields: [{ key: "cron", label: "When", type: "schedule" }],
    defaults: { cron: "0 9 * * 1" },
  },
  {
    id: "fetch",
    label: "Fetch the customer",
    group: "data",
    icon: Database01Icon,
    kind: "action",
    app: "Data hub",
    subtitle: "Data hub · customers.get()",
    inputs: IN,
    outputs: OUT,
    fields: [{ key: "id", label: "Customer", type: "text", required: true, typeLabel: "string" }],
    defaults: { id: "{{ deal.customer_id }}" },
  },
  {
    id: "http",
    label: "Call an API",
    group: "data",
    icon: GlobeIcon,
    kind: "action",
    app: "HTTP",
    subtitle: "HTTP · fetch()",
    inputs: IN,
    outputs: OUT,
    fields: [{ key: "url", label: "URL", type: "text", required: true }],
  },
  {
    id: "if",
    label: "If",
    group: "logic",
    icon: GitForkIcon,
    kind: "logic",
    subtitle: "If · amount > 5000",
    description: "Splits items on a condition",
    inputs: IN,
    outputs: [
      { id: "true", label: "true", type: "items" },
      { id: "false", label: "false", type: "items" },
    ],
    fields: [{ key: "condition", label: "Condition", type: "text", typeLabel: "boolean" }],
    defaults: { condition: "{{ deal.amount }} > 5000" },
  },
  {
    id: "merge",
    label: "Merge",
    group: "logic",
    icon: GitMergeIcon,
    kind: "logic",
    subtitle: "Merge · wait for all",
    description: "Joins branches into one",
    inputs: [{ id: "in", type: "items", multiple: true }],
    outputs: OUT,
    fields: [],
  },
  {
    id: "wait",
    label: "Wait",
    group: "logic",
    icon: HourglassIcon,
    kind: "logic",
    subtitle: "Wait · 1 day",
    description: "Pauses, then resumes",
    inputs: IN,
    outputs: OUT,
    fields: [{ key: "for", label: "For", type: "text" }],
    defaults: { for: "1 day" },
  },
  {
    id: "chat",
    label: "Post a message",
    group: "apps",
    icon: Message01Icon,
    kind: "action",
    app: "Chat",
    subtitle: "Chat · postMessage()",
    inputs: IN,
    outputs: OUT,
    fields: [
      {
        key: "channel",
        label: "Channel",
        type: "select",
        required: true,
        options: [
          { value: "sales", label: "#sales" },
          { value: "ops", label: "#lyon-depot" },
        ],
      },
      { key: "text", label: "Message", type: "text", required: true, typeLabel: "string" },
    ],
    defaults: { channel: "sales", text: "Won {{ deal.name }}" },
  },
  {
    id: "task",
    label: "Create a task",
    group: "apps",
    icon: Task01Icon,
    kind: "action",
    app: "Tasks",
    subtitle: "Tasks · create()",
    inputs: IN,
    outputs: OUT,
    fields: [{ key: "title", label: "Title", type: "text", required: true }],
    defaults: { title: "Kick-off with {{ deal.name }}" },
  },
  {
    id: "invoice",
    label: "Draft an invoice",
    group: "apps",
    icon: Invoice01Icon,
    kind: "action",
    app: "Invoices",
    subtitle: "Invoices · draft()",
    inputs: IN,
    outputs: OUT,
    fields: [{ key: "amount", label: "Amount", type: "number" }],
    defaults: { amount: "{{ deal.amount }}" },
  },
  {
    id: "mail",
    label: "Send an email",
    group: "apps",
    icon: Mail01Icon,
    kind: "action",
    app: "Mail relay",
    subtitle: "Mail · send()",
    inputs: IN,
    outputs: OUT,
    fields: [
      { key: "to", label: "To", type: "text", required: true },
      { key: "subject", label: "Subject", type: "text" },
    ],
    defaults: { to: "{{ deal.contact.email }}", subject: "Thank you" },
  },
];
const byId = new Map(catalog.map((c) => [c.id, c] as const));
const entryOf = (node: FlowNode<StepData>) => byId.get(node.data.step) ?? byId.get("chat")!;

const options: StepOption[] = catalog.map((c) => ({
  id: c.id,
  label: c.label,
  group: c.group,
  icon: c.icon,
  ...(c.app ? { app: c.app } : {}),
  ...(c.description ? { description: c.description } : {}),
}));
const groups = [
  { id: "trigger", label: "Triggers" },
  { id: "apps", label: "Apps" },
  { id: "logic", label: "Logic" },
  { id: "data", label: "Data" },
];

const SIZE = { w: 240, h: 80 };
const LAYOUT = { layerGap: 60 };
/** The width of the step panel over the canvas, and its margin. */
const PANEL = 332;

function nodeFor(
  step: string,
  id?: string,
  title?: string,
): Omit<FlowNode<StepData>, "id"> & { id?: string } {
  const c = byId.get(step)!;
  return {
    ...(id ? { id } : {}),
    type: c.kind,
    position: { x: 0, y: 0 },
    size: SIZE,
    inputs: c.inputs,
    outputs: c.outputs,
    data: { step, title: title ?? c.label, values: c.defaults ?? {} },
  };
}

const edge = (id: string, from: string, to: string, port = "out"): FlowEdge => ({
  id,
  from: { node: from, port },
  to: { node: to, port: "in" },
});

function startGraph(): FlowGraph<StepData> {
  const nodes = [
    nodeFor("deal-won", "won"),
    nodeFor("fetch", "customer"),
    nodeFor("if", "big", "Over 5,000?"),
    nodeFor("chat", "notify", "Tell #sales"),
    nodeFor("invoice", "invoice"),
    nodeFor("mail", "thanks", "Send a thank-you"),
  ] as FlowNode<StepData>[];
  const graph: FlowGraph<StepData> = {
    version: 1,
    nodes,
    edges: [
      edge("e1", "won", "customer"),
      edge("e2", "customer", "big"),
      edge("e3", "big", "notify", "true"),
      edge("e5", "big", "invoice", "true"),
      edge("e6", "big", "thanks", "false"),
    ],
    groups: [{ id: "g1", label: "Big deals", nodes: ["notify", "invoice"] }],
  };
  return applyLayout(graph, layoutGraph(graph, LAYOUT));
}

/** A generated flow of `count` nodes and 1.4 times as many edges, laid out. */
function stressGraph(count: number): FlowGraph<StepData> {
  const g = generateFlowGraph({ nodes: count, edges: Math.round(count * 1.4), seed: 3 });
  const steps = ["chat", "task", "invoice", "mail", "fetch", "http", "wait"];
  const graph: FlowGraph<StepData> = {
    ...g,
    nodes: g.nodes.map((n, i) => ({
      ...n,
      data: {
        step: n.type === "trigger" ? "deal-won" : n.type === "if" ? "if" : steps[i % steps.length]!,
        title: n.data.title,
        values: {},
      },
    })),
  };
  return applyLayout(graph, layoutGraph(graph, LAYOUT));
}

const sample = {
  deal: {
    name: "Transalp",
    amount: 9600,
    customer_id: "c_102",
    contact: { email: "ops@transalp.example" },
  },
};
const variables = [variablesFromSample("deal", "Deal moved to Won", sample.deal, TrophyIcon)];

type Picking =
  | { mode: "add"; from?: PortRef; at?: Point }
  | { mode: "insert"; edge: FlowEdge; at: Point };

function useFitOnce<D>(store: FlowApi<D>["store"]) {
  useEffect(() => {
    const fit = () => store.fitView({ padding: 48, maxZoom: 1 });
    if (store.getState().size.w) {
      fit();
      return;
    }
    const stop = store.subscribe(() => {
      if (store.getState().size.w) {
        stop();
        fit();
      }
    });
    return stop;
  }, [store]);
}

export default function FlowDemo() {
  const [initial] = useState(startGraph);
  const flow = useFlow<StepData>({ graph: initial, layout: LAYOUT });
  const { store } = flow;
  useFitOnce(store);
  const { load, autoLayout } = flow;
  const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>("bezier");
  const [run, setRun] = useState<RunState>(IDLE_RUN);
  const [running, setRunning] = useState(false);
  const [picking, setPicking] = useState<Picking | null>(null);
  const [showJson, setShowJson] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `?nodes=500`: a generated flow of that size, for the performance measures.
  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("nodes"));
    if (!n) return;
    const t = performance.now();
    const g = stressGraph(n);
    const ms = performance.now() - t;
    load(g);
    store.fitView({ padding: 24 });
    (window as unknown as { __flow: unknown }).__flow = {
      store,
      autoLayout,
      generateAndLayoutMs: ms,
    };
  }, [store, load, autoLayout]);

  // The panel covers the right of the canvas on a wide screen: a step selected under it moves left.
  const keepClearOfPanel = useCallback(
    (id: string) => {
      const item = store.get(id);
      const { viewport: v, size } = store.getState();
      if (!item || size.w < 720) return;
      const right = (item.bounds.x + item.bounds.w) * v.zoom + v.x;
      const limit = size.w - PANEL - 24;
      if (right > limit) animateViewport(store, { ...v, x: Math.round(v.x - (right - limit)) });
    },
    [store],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [...store.getState().selection]);
  useEffect(() => {
    let last = store.getState().selection;
    return store.subscribe(() => {
      const next = store.getState().selection;
      if (next === last) return;
      last = next;
      setSelectedIds([...next]);
      if (next.size) setPicking(null);
      if (next.size === 1) keepClearOfPanel([...next][0]!);
    });
  }, [store, keepClearOfPanel]);
  const selected =
    selectedIds.length === 1 ? flow.current.nodes.find((n) => n.id === selectedIds[0]) : undefined;

  const stopRun = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setRunning(false);
  };
  // Stops a run that is playing when the demo goes away.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const play = () => {
    stopRun();
    const frames = planRun(flow.current, (node) => {
      if (node.data.step !== "if") return { status: "success" };
      return { status: "success", ports: [sample.deal.amount > 5000 ? "true" : "false"] };
    });
    setRunning(true);
    let i = 0;
    const next = () => {
      setRun(frames[i]!);
      i++;
      if (i < frames.length) timer.current = setTimeout(next, 520);
      else setRunning(false);
    };
    next();
  };
  const reset = () => {
    stopRun();
    setRun(IDLE_RUN);
  };

  const pick = (step: string) => {
    if (!picking) return;
    const base = nodeFor(step);
    if (picking.mode === "insert") {
      const r = flow.insertOnEdge(picking.edge.id, {
        ...base,
        position: { x: picking.at.x - SIZE.w / 2, y: picking.at.y - SIZE.h / 2 },
      });
      if (r.ok) flow.autoLayout();
    } else {
      const s = store.getState();
      const source = picking.from
        ? flow.current.nodes.find((n) => n.id === picking.from!.node)
        : undefined;
      const at =
        picking.at ??
        (source
          ? { x: source.position.x + source.size.w + 80, y: source.position.y }
          : {
              x: (s.size.w / 2 - s.viewport.x) / s.viewport.zoom - SIZE.w / 2,
              y: (s.size.h / 2 - s.viewport.y) / s.viewport.zoom - SIZE.h / 2,
            });
      const grid = store.grid.size;
      flow.addNode(
        {
          ...base,
          position: { x: Math.round(at.x / grid) * grid, y: Math.round(at.y / grid) * grid },
        },
        picking.from,
      );
    }
    setPicking(null);
  };

  const onConnectEnd = useCallback(
    (from: { node: string; port: string; side: "in" | "out" }, point: Point) => {
      if (from.side !== "out") return;
      setPicking({
        mode: "add",
        from: { node: from.node, port: from.port },
        at: { x: point.x, y: point.y - SIZE.h / 2 },
      });
    },
    [],
  );
  const onInsert = useCallback(
    (e: FlowEdge, at: Point) => setPicking({ mode: "insert", edge: e, at }),
    [],
  );

  const renderNode = useCallback(
    (
      node: FlowNode<StepData>,
      { selected: on, status }: { selected: boolean; status: RunState["nodes"][string] },
    ) => {
      const c = entryOf(node);
      return (
        <StepCard
          layout="node"
          title={node.data.title}
          subtitle={c.subtitle}
          icon={c.icon}
          kind={c.kind}
          status={status}
          selected={on}
          {...(status === "success" ? { meta: c.id === "if" ? "1 item · true" : "1 item" } : {})}
        />
      );
    },
    [],
  );

  // The name on a node seen from far, and for assistive technology (the card says its kind).
  const nodeLabel = useCallback((n: FlowNode<StepData>) => n.data.title, []);

  const titleOf = (id: string) => flow.current.nodes.find((n) => n.id === id)?.data.title ?? id;
  const pickerContext = !picking
    ? null
    : picking.mode === "insert"
      ? `Between “${titleOf(picking.edge.from.node)}” and “${titleOf(picking.edge.to.node)}”`
      : picking.from
        ? `After “${titleOf(picking.from.node)}”`
        : "Anywhere on the canvas";

  let side: ReactNode = null;
  if (picking) {
    side = (
      <StepPicker
        key={pickerContext}
        title="Add a step"
        context={pickerContext}
        groups={groups}
        options={
          picking.mode === "add" && picking.from
            ? options.filter((o) => o.group !== "trigger")
            : options
        }
        categories
        autoFocus
        onPick={pick}
        footer={
          <>
            <span style={{ flex: 1 }}>Esc or Cancel closes this.</span>
            <Button size="sm" onClick={() => setPicking(null)}>
              Cancel
            </Button>
          </>
        }
      />
    );
  } else if (selected) {
    const c = entryOf(selected);
    side = (
      <StepInspector
        key={selected.id}
        icon={c.icon}
        kind={c.kind}
        title={selected.data.title}
        subtitle={c.subtitle}
        onTitleChange={(title) =>
          flow.updateNode(selected.id, { data: { ...selected.data, title } }, "Rename")
        }
        fields={c.fields}
        values={selected.data.values}
        onValuesChange={(values) =>
          flow.updateNode(selected.id, { data: { ...selected.data, values } })
        }
        variables={variables}
        sample={sample}
        onClose={() => store.clearSelection()}
        onDuplicate={() => flow.duplicateSelection()}
        onDelete={() => flow.deleteSelection()}
      />
    );
  }

  const counts = useMemo(() => {
    const c = { success: 0, skipped: 0, error: 0, running: 0 };
    for (const s of Object.values(run.nodes)) if (s in c) c[s as keyof typeof c]++;
    return c;
  }, [run]);

  return (
    <div className="fd">
      <div className="fd-bar" role="toolbar" aria-label="Automation">
        <Button
          size="sm"
          onClick={() =>
            setPicking({
              mode: "add",
              ...(selected && selected.outputs.length
                ? { from: { node: selected.id, port: selected.outputs[0]!.id } }
                : {}),
            })
          }
        >
          Add a step
        </Button>
        <Button size="sm" variant="primary" marker onClick={play} disabled={running}>
          {running ? "Running" : "Run"}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset} disabled={run === IDLE_RUN}>
          Reset run
        </Button>
        <span className="fd-status t-mono dim" aria-live="polite">
          {run === IDLE_RUN
            ? `${flow.current.nodes.length} steps · ${flow.current.edges.length} edges`
            : `${counts.success} done · ${counts.running} running · ${counts.skipped} not reached`}
        </span>
      </div>
      <div className="fd-stage">
        <FlowCanvas
          flow={flow}
          label="Automation editor"
          renderNode={renderNode}
          nodeLabel={nodeLabel}
          run={run}
          edgeStyle={edgeStyle}
          onConnectEnd={onConnectEnd}
          onInsert={onInsert}
          onNodeActivate={(n) => store.select([n.id])}
          className="fd-canvas"
        >
          <FlowToolbar flow={flow} edgeStyle={edgeStyle} onEdgeStyleChange={setEdgeStyle} />
        </FlowCanvas>
        {side ? (
          <div
            className="fd-side"
            role="region"
            aria-label="Step panel"
            onKeyDown={(e) => {
              if (e.key === "Escape" && picking) setPicking(null);
            }}
          >
            {side}
          </div>
        ) : null}
      </div>
      <details
        className="fd-json"
        onToggle={(e) => setShowJson((e.target as HTMLDetailsElement).open)}
      >
        <summary className="t-mono">The flow as JSON</summary>
        {showJson ? (
          <JsonView value={JSON.parse(serializeFlow(flow.current))} maxHeight={360} copyable />
        ) : null}
      </details>
    </div>
  );
}
