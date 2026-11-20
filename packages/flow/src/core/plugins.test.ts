import { createCanvasStore } from "@forgeron/canvas";
import { describe, expect, it } from "vitest";
import { clipboard } from "../plugins/clipboard";
import { connectionPlugins, portTypes } from "../plugins/connect";
import { bezier, orthogonal } from "../plugins/edges";
import { groups } from "../plugins/groups";
import { fullCorePlugins, minimalCorePlugins, typedCorePlugins } from "../plugins/index";
import { layeredLayout } from "../plugins/layout";
import { run } from "../plugins/run";
import { nodes } from "../plugins/ui";
import { createFlowController, type FlowStore } from "./controller";
import { DEFAULT_REGISTRY } from "./defaults";
import { generateFlowGraph } from "./generate";
import { checkConnection, connect, insertOnEdge } from "./graph";
import { flowKinds, graphToItems, itemsToGraph, type FlowItemData } from "./items";
import { emptyGraph, type FlowGraph, type FlowNode } from "./model";
import {
  createRegistry,
  definePlugin,
  PluginError,
  registryOf,
  type FlowCorePlugin,
} from "./plugin";
import { FlowFormatError, parseFlow, serializeFlow } from "./serialize";
import { applyLayout, layoutGraph } from "../plugins/layout";
import { planRun } from "../plugins/run";

type Data = { title?: string; deep?: unknown };

const node = (
  id: string,
  inputs: Array<{ id: string; type?: string; multiple?: boolean }> = [{ id: "in" }],
  outputs: Array<{ id: string; type?: string; multiple?: boolean }> = [{ id: "out" }],
  type = "step",
  x = 0,
): FlowNode<Data> => ({
  id,
  type,
  position: { x, y: 0 },
  size: { w: 240, h: 80 },
  inputs,
  outputs,
  data: { title: id },
});

const graphOf = (list: FlowNode<Data>[], edges: Array<[string, string]> = []): FlowGraph<Data> => ({
  ...emptyGraph<Data>(),
  nodes: list,
  edges: edges.map(([a, b], i) => ({
    id: `e${i}`,
    from: { node: a, port: "out" },
    to: { node: b, port: "in" },
  })),
});

const ref = (node: string, port: string) => ({ node, port });

const storeOf = (g: FlowGraph<Data>): FlowStore<Data> =>
  createCanvasStore<FlowItemData<Data>>({ items: graphToItems(g), kinds: flowKinds<Data>() });

/** The first 16 hex digits of the SHA-256 of a value's JSON (or of a string). */
const hash = async (v: unknown) => {
  const bytes = new TextEncoder().encode(typeof v === "string" ? v : JSON.stringify(v));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
};

describe("the plugin host", () => {
  const p = (id: string, extra: Partial<FlowCorePlugin> = {}) =>
    definePlugin({ id, name: id, description: id, ...extra });

  it("orders plugins by dependency", () => {
    const r = createRegistry([p("c", { requires: ["b"] }), p("b", { requires: ["a"] }), p("a")]);
    expect(r.plugins.map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(r.has("b")).toBe(true);
    expect(r.has("z")).toBe(false);
  });

  it("refuses a duplicate id, a missing dependency and a cycle", () => {
    expect(() => createRegistry([p("a"), p("a")])).toThrow(PluginError);
    expect(() => createRegistry([p("a", { requires: ["nope"] })])).toThrow(/requires "nope"/);
    expect(() =>
      createRegistry([p("a", { requires: ["b"] }), p("b", { requires: ["a"] })]),
    ).toThrow(/cycle: a -> b -> a|cycle: b -> a -> b/);
  });

  it("refuses two plugins that own the same thing", () => {
    const kind = { label: "Task" };
    expect(() =>
      createRegistry([
        p("a", { nodeKinds: { task: kind } }),
        p("b", { nodeKinds: { task: kind } }),
      ]),
    ).toThrow(/Node kind "task".*owned by "a"/);
    const type = { label: "Invoice" };
    expect(() =>
      createRegistry([
        p("a", { portTypes: { invoice: type } }),
        p("b", { portTypes: { invoice: type } }),
      ]),
    ).toThrow(/Port type "invoice"/);
    expect(() => createRegistry([bezier, bezier])).toThrow(/Duplicate plugin id/);
    expect(() =>
      createRegistry([
        p("a", { edgeStyles: { bezier: bezier.edgeStyles.bezier } }),
        p("b", { edgeStyles: { bezier: bezier.edgeStyles.bezier } }),
      ]),
    ).toThrow(/Edge style "bezier"/);
    expect(() => createRegistry([groups, p("g2", { groups: groups.groups })])).toThrow(/groups/);
    expect(() => createRegistry([clipboard, p("c2", { clipboard: clipboard.clipboard })])).toThrow(
      /clipboard/,
    );
    expect(() =>
      createRegistry([
        layeredLayout,
        p("other", { layouts: { layered: layeredLayout.layouts.layered } }),
      ]),
    ).toThrow(/Layout engine "layered"/);
  });

  it("caches the registry of a list, and takes a registry as is", () => {
    const list = [bezier];
    expect(registryOf(list)).toBe(registryOf(list));
    const r = createRegistry(list);
    expect(registryOf(r)).toBe(r);
  });

  it("builds a node of a registered kind from its spec", () => {
    const r = createRegistry([
      p("k", {
        nodeKinds: {
          task: {
            label: "Task",
            size: { w: 200, h: 60 },
            inputs: [{ id: "in", type: "job" }],
            data: () => ({ title: "New" }),
          },
        },
      }),
    ]);
    const n = r.createNode<Data>("task", { position: { x: 5, y: 6 } });
    expect(n).toMatchObject({
      type: "task",
      position: { x: 5, y: 6 },
      size: { w: 200, h: 60 },
      inputs: [{ id: "in", type: "job" }],
      outputs: [],
      data: { title: "New" },
    });
    expect(() => r.createNode("nope")).toThrow(PluginError);
  });

  it("lists what the presets contain", () => {
    expect(minimalCorePlugins.map((x) => x.id)).toEqual(["nodes", "edges", "bezier", "delete"]);
    expect(typedCorePlugins.map((x) => x.id)).toEqual([
      "nodes",
      "edges",
      "bezier",
      "delete",
      "edge-arrows",
      "self-loop",
      "port-types",
      "no-duplicates",
      "fan-out",
      "single-input",
      "no-cycles",
    ]);
    const full = createRegistry(fullCorePlugins);
    expect(full.rules.map((r) => r.id)).toEqual([
      "same-node",
      "type",
      "duplicate",
      "fan-out",
      "occupied",
      "cycle",
    ]);
    expect(full.edgeStyles.map((s) => s.id)).toEqual(["bezier", "orthogonal"]);
    expect(full.layout()).toBeDefined();
    expect(full.planner()).toBeDefined();
    expect(full.groups).toBeDefined();
    expect(full.clipboard).toBeDefined();
    // Every preset resolves on its own: no plugin needs one the list lacks.
    for (const preset of [minimalCorePlugins, typedCorePlugins, fullCorePlugins]) {
      expect(() => createRegistry(preset)).not.toThrow();
    }
    expect(DEFAULT_REGISTRY.plugins.map((x) => x.id)).toEqual(full.plugins.map((x) => x.id));
  });
});

describe("the minimal core alone", () => {
  const minimal = createRegistry([nodes]);

  it("connects any output to any input that exists, whatever their types", () => {
    const g = graphOf([
      node("a", [], [{ id: "out", type: "invoice" }]),
      node("b", [{ id: "in", type: "boolean" }]),
    ]);
    expect(checkConnection(g, ref("a", "out"), ref("b", "in"), { plugins: minimal })).toBeNull();
    // With the rules of the full preset the same edge is refused.
    expect(checkConnection(g, ref("a", "out"), ref("b", "in"))).toBe("type");
    // The core still refuses what is not a connection at all.
    expect(checkConnection(g, ref("a", "out"), ref("zz", "in"), { plugins: minimal })).toBe(
      "missing-node",
    );
    expect(checkConnection(g, ref("a", "out"), ref("b", "x"), { plugins: minimal })).toBe(
      "missing-port",
    );
  });

  it("takes an occupied input, a duplicate and a cycle: nobody asked", () => {
    const g = graphOf([node("a"), node("b")], [["a", "b"]]);
    const options = { plugins: minimal };
    expect(connect(g, ref("a", "out"), ref("b", "in"), options).ok).toBe(true);
    expect(connect(g, ref("b", "out"), ref("a", "in"), options).ok).toBe(true);
  });

  it("degrades what it has no plugin for: no layout, no groups, no clipboard, no run", () => {
    const g = graphOf([node("a"), node("b", undefined, undefined, "step", 300)], [["a", "b"]]);
    g.groups = [{ id: "g", label: "G", nodes: ["a"] }];
    const flow = createFlowController(storeOf(g), { plugins: minimal });
    flow.store.select(["a"]);
    const before = flow.graph();
    expect(flow.autoLayout()).toEqual({
      positions: new Map(),
      layers: [],
      crossings: 0,
      reversed: [],
    });
    expect(flow.copySelection()).toBeNull();
    expect(flow.duplicateSelection()).toEqual([]);
    expect(flow.paste("{}")).toEqual([]);
    flow.groupSelection("x");
    flow.ungroup("g");
    expect(flow.graph()).toEqual(before);
    // The groups are data of the document: kept, written back.
    expect(flow.graph().groups).toEqual([{ id: "g", label: "G", nodes: ["a"] }]);
    expect(minimal.planner()).toBeUndefined();
    // Nothing of the history was written by those no-ops.
    expect(flow.store.getState().canUndo).toBe(false);
  });

  it("keeps a typed edge, a group and a layout hint of a graph it does not know", () => {
    const json = JSON.stringify({
      version: 1,
      nodes: [
        {
          id: "a",
          type: "from-the-future",
          position: { x: 1, y: 2 },
          size: { w: 100, h: 40 },
          inputs: [],
          outputs: [{ id: "o", type: "quantum" }],
          data: { anything: [1, { two: 3 }] },
        },
        {
          id: "b",
          type: "other",
          position: { x: 300, y: 2 },
          size: { w: 100, h: 40 },
          inputs: [{ id: "i", type: "quantum", multiple: true }],
          outputs: [],
          data: null,
        },
      ],
      edges: [{ id: "e", from: { node: "a", port: "o" }, to: { node: "b", port: "i" } }],
      groups: [{ id: "g", label: "Frame", nodes: ["a", "b"] }],
    });
    const flow = createFlowController(storeOf(emptyGraph<Data>()), { plugins: minimal });
    flow.load(json);
    expect(flow.toJSON()).toBe(JSON.stringify(JSON.parse(json)));
  });
});

describe("graceful degradation of the document", () => {
  const unknown = graphOf(
    [
      {
        ...node("u", [], [{ id: "out", type: "never-heard-of" }], "mystery"),
        data: { deep: { a: [1] } },
      },
      node("v", [{ id: "in", type: "never-heard-of" }]),
    ],
    [["u", "v"]],
  );

  it("round-trips a kind and a port type no plugin knows, untouched", () => {
    const text = serializeFlow(unknown);
    expect(parseFlow(text)).toEqual(unknown);
    expect(serializeFlow(parseFlow(text))).toBe(text);
    // Through the canvas items too (what the editor holds).
    expect(itemsToGraph(graphToItems(unknown))).toEqual(unknown);
    // And through a controller with a plugin list that knows none of it.
    const flow = createFlowController(storeOf(emptyGraph<Data>()), { plugins: [] });
    flow.load(text);
    expect(flow.toJSON()).toBe(text);
  });

  it("still connects ports of a type the plugins do not declare, by equal names", () => {
    expect(
      checkConnection(unknown, ref("u", "out"), ref("v", "in"), { plugins: typedCorePlugins }),
    ).toBe("duplicate");
    const other = graphOf([unknown.nodes[0]!, node("w", [{ id: "in", type: "never-heard-of" }])]);
    expect(checkConnection(other, ref("u", "out"), ref("w", "in"))).toBeNull();
  });

  it("migrates an old node type when JSON is read, and only then", () => {
    const old = definePlugin({
      id: "legacy",
      name: "Legacy",
      description: "Reads `action` as `step`.",
      migrate: { action: (n) => ({ ...n, type: "step" }) },
    });
    const text = serializeFlow(graphOf([node("a", [], [{ id: "out" }], "action")]));
    expect(parseFlow(text).nodes[0]!.type).toBe("action");
    expect(parseFlow(text, [old]).nodes[0]!.type).toBe("step");
    const flow = createFlowController(storeOf(emptyGraph<Data>()), { plugins: [old] });
    flow.load(text);
    expect(flow.graph().nodes[0]!.type).toBe("step");
  });

  it("still refuses a document that is not a flow", () => {
    expect(() => parseFlow('{"version":2,"nodes":[]}')).toThrow(FlowFormatError);
    expect(() => parseFlow("nope")).toThrow(FlowFormatError);
  });
});

describe("a third-party plugin written against the contract", () => {
  // A node kind with its own port type and its own rule: an invoice may only be paid once, and
  // only a payment takes an invoice.
  interface Money {
    amount?: number;
  }
  const money = definePlugin({
    id: "money",
    name: "Money",
    description: "Invoices and payments.",
    requires: ["port-types"],
    nodeKinds: {
      invoice: {
        label: "Invoice",
        size: { w: 200, h: 80 },
        outputs: [{ id: "bill", type: "invoice" }],
        data: () => ({ amount: 100 }),
      },
      payment: {
        label: "Payment",
        size: { w: 200, h: 80 },
        inputs: [{ id: "due", type: "invoice" }],
        outputs: [{ id: "receipt", type: "receipt" }],
      },
    },
    portTypes: { invoice: { label: "Invoice", color: "--accent" }, receipt: { label: "Receipt" } },
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
  });
  const plugins = [...connectionPlugins, money];

  const make = () => {
    const store = createCanvasStore<FlowItemData<Money>>({
      items: [],
      kinds: flowKinds<Money>(),
    });
    return { store, flow: createFlowController<Money>(store, { plugins }) };
  };

  it("adds its kinds, connects them, refuses with its reason, lays out and undoes as one step", () => {
    const { store, flow } = make();
    const inv = flow.addKind("invoice", { position: { x: 0, y: 0 } });
    const pay = flow.addKind("payment", { position: { x: 0, y: 200 } });
    const pay2 = flow.addKind("payment", { position: { x: 0, y: 400 } });
    expect(inv.data).toEqual({ amount: 100 });
    expect(flow.graph().nodes.map((n) => n.type)).toEqual(["invoice", "payment", "payment"]);

    const ok = flow.connect(ref(inv.id, "bill"), ref(pay.id, "due"));
    expect(ok.ok).toBe(true);
    // The second payment of the same invoice: the plugin's rule says no, and why.
    const refused = flow.connect(ref(inv.id, "bill"), ref(pay2.id, "due"));
    expect(refused).toEqual({ ok: false, error: "already-paid" });
    expect(flow.registry().explain("already-paid")).toBe("An invoice is paid once.");
    expect(flow.registry().explain("type")).toBe("These two ports carry different types of data.");
    // Its port type is the type rule's business: a receipt is not an invoice.
    const wrong = flow.connect(ref(pay.id, "receipt"), ref(pay2.id, "due"));
    expect(wrong).toEqual({ ok: false, error: "type" });
    expect(flow.registry().portType("invoice")).toMatchObject({ color: "--accent" });
    expect(
      flow.refusal({ itemId: inv.id, handle: "out:bill" }, { itemId: pay2.id, handle: "in:due" }),
    ).toEqual({
      reason: "already-paid",
      message: "An invoice is paid once.",
    });
    // Dropped on the node, the reason is the first input's.
    expect(flow.refusal({ itemId: inv.id, handle: "out:bill" }, { itemId: pay2.id })?.reason).toBe(
      "already-paid",
    );

    // Layout is not in this list: nothing moves. Add the plugin and it does, in one step.
    expect(flow.autoLayout().layers).toEqual([]);
    flow.setPlugins([...plugins, layeredLayout]);
    const before = flow.graph().nodes.map((n) => n.position);
    flow.autoLayout();
    const after = flow.graph().nodes.map((n) => n.position);
    expect(after).not.toEqual(before);
    expect(after[1]!.x).toBeGreaterThan(after[0]!.x);
    store.undo();
    expect(flow.graph().nodes.map((n) => n.position)).toEqual(before);
    // The undo took the layout, not the edge made before it.
    expect(flow.graph().edges).toHaveLength(1);
  });

  it("inserts a node on an edge only where the rules match its ports", () => {
    const { flow } = make();
    const inv = flow.addKind("invoice");
    const pay = flow.addKind("payment");
    flow.connect(ref(inv.id, "bill"), ref(pay.id, "due"));
    const edge = flow.graph().edges[0]!;
    // A payment has no output of type invoice: nothing to put between the two.
    const r = flow.insertOnEdge(edge.id, registryNode(flow.registry().createNode("payment")));
    expect(r).toEqual({ ok: false, error: "type" });
    expect(flow.graph().edges).toHaveLength(1);

    const gate = definePlugin({
      id: "gate",
      name: "Gate",
      description: "A pass-through for invoices.",
      requires: ["money"],
      nodeKinds: {
        gate: {
          label: "Gate",
          inputs: [{ id: "in", type: "invoice" }],
          outputs: [{ id: "out", type: "invoice" }],
        },
      },
    });
    flow.setPlugins([...plugins, gate]);
    const ok = flow.insertOnEdge(edge.id, registryNode(flow.registry().createNode("gate")));
    expect(ok.ok).toBe(true);
    expect(flow.graph().edges).toHaveLength(2);
  });

  function registryNode(n: { type: string } & Omit<FlowNode<Money>, "id" | "type">) {
    return n as never;
  }

  it("takes the rule's own options from `ConnectOptions`", () => {
    const g = graphOf([node("a"), node("b")], [["a", "b"]]);
    const back = (cycles: "forbid" | "allow") =>
      checkConnection(g, ref("b", "out"), ref("a", "in"), {
        cycles,
        plugins: [portTypes, ...connectionPlugins.filter((x) => x.id !== "port-types")],
      });
    expect(back("forbid")).toBe("cycle");
    expect(back("allow")).toBeNull();
    expect(checkConnection(g, ref("a", "out"), ref("b", "in"), { compatible: () => true })).toBe(
      "duplicate",
    );
  });
});

describe("what the full preset still does", () => {
  it("refuses with the codes it always gave", () => {
    const g = graphOf(
      [
        node("t", [], [{ id: "out" }]),
        node("a"),
        node("b", [{ id: "in", type: "boolean" }]),
        node("m", [{ id: "in", multiple: true }]),
        node(
          "x",
          [{ id: "in" }],
          [
            { id: "out", type: "items" },
            { id: "solo", multiple: false },
          ],
        ),
      ],
      [["t", "a"]],
    );
    expect(checkConnection(g, ref("a", "out"), ref("a", "in"))).toBe("same-node");
    expect(checkConnection(g, ref("x", "out"), ref("b", "in"))).toBe("type");
    expect(checkConnection(g, ref("t", "out"), ref("a", "in"))).toBe("duplicate");
    expect(checkConnection(g, ref("x", "out"), ref("a", "in"))).toBe("occupied");
    expect(checkConnection(g, ref("a", "out"), ref("t", "in"))).toBe("missing-port");
    const loop = graphOf([node("p"), node("q")], [["p", "q"]]);
    expect(checkConnection(loop, ref("q", "out"), ref("p", "in"))).toBe("cycle");
    expect(checkConnection(loop, ref("q", "out"), ref("p", "in"), { cycles: "allow" })).toBeNull();
    const fan = graphOf(
      [node("s", [], [{ id: "out", multiple: false }]), node("d1"), node("d2")],
      [["s", "d1"]],
    );
    expect(checkConnection(fan, ref("s", "out"), ref("d2", "in"))).toBe("fan-out");
    expect(insertOnEdge(loop, "e0", node("n")).ok).toBe(true);
  });

  it("lets a declared port type accept another", () => {
    const g = graphOf([
      node("a", [], [{ id: "out", type: "int" }]),
      node("b", [{ id: "in", type: "number" }]),
    ]);
    expect(checkConnection(g, ref("a", "out"), ref("b", "in"))).toBe("type");
    const numbers = definePlugin({
      id: "numbers",
      name: "Numbers",
      description: "An int is a number.",
      requires: ["port-types"],
      portTypes: { number: { label: "Number", accepts: ["int"] } },
    });
    expect(
      checkConnection(g, ref("a", "out"), ref("b", "in"), { plugins: [portTypes, numbers] }),
    ).toBeNull();
  });
});

describe("layout, run and clipboard are what they were", () => {
  // Recorded from the code before layout, run planning and the clipboard became plugins.
  it("lays a generated flow out exactly as before (golden)", async () => {
    const g40 = generateFlowGraph({ nodes: 40, edges: 56, seed: 3 });
    const r40 = layoutGraph(g40);
    expect(await hash([...r40.positions].map(([id, p]) => [id, p.x, p.y]))).toBe(
      "aaff67c382fc7b82",
    );
    expect([r40.layers.length, r40.crossings, r40.reversed.length]).toEqual([8, 36, 0]);
    expect(serializeFlow(applyLayout(g40, r40)).length).toBeGreaterThan(1000);
    expect(await hash(serializeFlow(applyLayout(g40, r40)))).toBe("198c65f94338203c");

    const g500 = generateFlowGraph({ nodes: 500, edges: 700, seed: 3 });
    const r500 = layoutGraph(g500);
    expect(await hash([...r500.positions].map(([id, p]) => [id, p.x, p.y]))).toBe(
      "aa74341022d73253",
    );
    expect([r500.layers.length, r500.crossings, r500.reversed.length]).toEqual([49, 1183, 0]);

    // With groups: each laid out as a block.
    const grouped = generateFlowGraph({ nodes: 40, edges: 56, seed: 3 });
    grouped.groups = [
      { id: "g1", label: "A", nodes: ["n3", "n5", "n6", "n9"] },
      { id: "g2", label: "B", nodes: ["n12", "n13", "n20"] },
    ];
    const rg = layoutGraph(grouped);
    expect(await hash([...rg.positions].map(([id, p]) => [id, p.x, p.y]))).toBe("c4a14c5bbe3965b5");
    expect([rg.layers.length, rg.crossings]).toEqual([10, 39]);
  });

  it("lays out a small branching flow at known places", () => {
    const g = graphOf(
      [
        node("a", [], [{ id: "out" }]),
        node("b", [{ id: "in" }], [{ id: "true" }, { id: "false" }]),
        node("c"),
        node("d"),
        node("e", [{ id: "in" }], []),
      ],
      [],
    );
    g.edges = [
      { id: "e1", from: ref("a", "out"), to: ref("b", "in") },
      { id: "e2", from: ref("b", "true"), to: ref("c", "in") },
      { id: "e3", from: ref("b", "false"), to: ref("d", "in") },
      { id: "e4", from: ref("c", "out"), to: ref("e", "in") },
      { id: "e5", from: ref("a", "out"), to: ref("e", "in") },
    ];
    expect(JSON.stringify([...layoutGraph(g).positions])).toBe(
      '[["a",{"x":0,"y":120}],["b",{"x":320,"y":80}],["c",{"x":640,"y":0}],["d",{"x":640,"y":120}],["e",{"x":960,"y":100}]]',
    );
    // The registry's engine is the same function.
    expect(createRegistry(fullCorePlugins).layout()!.layout(g)).toEqual(layoutGraph(g));
  });

  it("plans a run exactly as before (golden), through the planner of the registry", async () => {
    const g = generateFlowGraph({ nodes: 40, edges: 56, seed: 3 });
    const frames = planRun(g);
    expect(frames).toHaveLength(17);
    expect(await hash(frames)).toBe("3bb071eff3ee53c7");
    expect(createRegistry([run]).planner()!.plan(g)).toEqual(frames);
    const big = generateFlowGraph({ nodes: 500, edges: 700, seed: 3 });
    expect(planRun(big)).toHaveLength(99);
    expect(await hash(planRun(big))).toBe("55c31d5db4c9e401");
  });

  it("keeps the JSON of a laid-out generated flow byte for byte", async () => {
    const g500 = generateFlowGraph({ nodes: 500, edges: 700, seed: 3 });
    expect(await hash(serializeFlow(applyLayout(g500, layoutGraph(g500))))).toBe(
      "be9bce20b2dce36e",
    );
  });

  it("copies and pastes the flow JSON format, with the keys it had", () => {
    const store = storeOf(
      graphOf([node("a"), node("b", undefined, undefined, "step", 300)], [["a", "b"]]),
    );
    const flow = createFlowController(store);
    store.select(["a", "b"]);
    const json = flow.copySelection()!;
    expect(Object.keys(JSON.parse(json))).toEqual(["version", "nodes", "edges", "groups"]);
    expect(parseFlow(json).edges).toHaveLength(1);
    const created = flow.paste(json, { x: 0, y: 500 });
    expect(created).toHaveLength(2);
    expect(flow.graph().edges).toHaveLength(2);
    expect(flow.paste("not flow json")).toEqual([]);
    // One paste, one undo step.
    store.undo();
    expect(flow.graph().nodes).toHaveLength(2);
  });
});

describe("edge styles", () => {
  it("are plugins with a path each; the registry picks by id", () => {
    const r = createRegistry([bezier, orthogonal]);
    const a = { x: 0, y: 0 };
    const b = { x: 200, y: 100 };
    expect(r.edgeStyle("bezier")!.path(a, b).d).toMatch(/^M0 0C/);
    expect(r.edgeStyle("orthogonal")!.path(a, b).d).toBe("M0 0H97V100H194");
    expect(r.edgeStyle("nope")).toBeUndefined();
  });
});
