// @vitest-environment jsdom
import { act, createElement as h, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { definePlugin } from "../../core/plugin";
import { emptyGraph, type FlowGraph, type FlowNode } from "../../core/model";
import { createEditorRegistry, defineEditorPlugin, type FlowPluginEntry } from "../../react/plugin";
import { FlowCanvas, FlowToolbar, useFlow, type FlowApi } from "../../react/index";
import { fullEditorPlugins, minimalEditorPlugins, typedEditorPlugins } from "./presets";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Data = { title: string };

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
beforeEach(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const node = (
  id: string,
  x: number,
  type = "step",
  inputs = [{ id: "in" }],
  outputs = [{ id: "out" }],
): FlowNode<Data> => ({
  id,
  type,
  position: { x, y: 0 },
  size: { w: 240, h: 80 },
  inputs,
  outputs,
  data: { title: id },
});

const graph = (nodes: FlowNode<Data>[], edges: Array<[string, string, string?, string?]> = []) => ({
  ...emptyGraph<Data>(),
  nodes,
  edges: edges.map(([a, b, op = "out", ip = "in"], i) => ({
    id: `e${i + 1}`,
    from: { node: a, port: op },
    to: { node: b, port: ip },
  })),
});

interface MountOptions {
  graph: FlowGraph<Data>;
  plugins?: ReadonlyArray<FlowPluginEntry<Data>>;
  preset?: "minimal" | "typed" | "full";
  /** The `useFlow` list. */
  flowPlugins?: ReadonlyArray<FlowPluginEntry<Data>>;
  children?: ReactNode;
}

async function mount(o: MountOptions) {
  let api: FlowApi<Data> | undefined;
  function Editor(p: { plugins?: MountOptions["plugins"] }) {
    const flow = useFlow<Data>({
      graph: o.graph,
      grid: { snap: false },
      ...(o.flowPlugins ? { plugins: o.flowPlugins } : {}),
    });
    useEffect(() => {
      api = flow;
    });
    return h(
      FlowCanvas<Data>,
      {
        flow,
        label: "Test flow",
        renderNode: (n: FlowNode<Data>) => h("span", { className: "body" }, n.data.title),
        nodeLabel: (n: FlowNode<Data>) => `Node ${n.id}`,
        ...(p.plugins ? { plugins: p.plugins } : {}),
        ...(o.preset ? { preset: o.preset } : {}),
      },
      h(FlowToolbar<Data>, { flow, edgeStyle: "bezier", onEdgeStyleChange: () => {} }),
      o.children,
    );
  }
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  await act(async () => r.render(h(Editor, { plugins: o.plugins })));
  const rerender = (plugins: MountOptions["plugins"]) =>
    act(async () => r.render(h(Editor, { plugins })));
  return {
    surface: host.querySelector<HTMLElement>(".fg-canvas")!,
    flow: () => api!,
    rerender,
    root: host,
  };
}

const fire = async (el: Element, type: string, init: Record<string, unknown> = {}) =>
  act(async () => {
    const Ctor = (globalThis as { PointerEvent?: typeof MouseEvent }).PointerEvent ?? MouseEvent;
    el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0, ...init }));
  });
const mac = /Mac|iPhone|iPad/.test(navigator.platform || "");
const MOD = { metaKey: mac, ctrlKey: !mac };
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });

const three = graph([node("t", 0), node("a", 300), node("b", 600)], [["t", "a"]]);

describe("the presets", () => {
  it("lists the same plugins on both sides", () => {
    for (const list of [minimalEditorPlugins, typedEditorPlugins, fullEditorPlugins]) {
      const registry = createEditorRegistry(list);
      expect(registry.core.plugins.map((p) => p.id)).toEqual(
        registry.plugins.map((p) => p.core.id),
      );
    }
  });

  it("full: toolbar, minimap, zoom controls, arrowheads, the whole behaviour", async () => {
    const { surface, root } = await mount({ graph: three });
    expect(root.querySelector('[role="toolbar"][aria-label="Flow"]')).not.toBeNull();
    expect(root.querySelector('button[aria-label="Auto-layout"]')).not.toBeNull();
    expect(root.querySelector(".fg-flow-edge-arrow")).not.toBeNull();
    expect(surface.querySelectorAll("[data-canvas-handle]")).toHaveLength(6);
  });

  it("minimal: nodes and edges, delete, nothing else", async () => {
    const { surface, flow, root } = await mount({ graph: three, plugins: minimalEditorPlugins });
    expect(surface.querySelectorAll("[role=option]")).toHaveLength(3);
    expect(surface.querySelectorAll(".fg-flow-edge")).toHaveLength(1);
    // No arrowhead, no toolbar (the plugin that draws it is not there), no zoom controls.
    expect(root.querySelector(".fg-flow-edge-arrow")).toBeNull();
    expect(root.querySelector('[role="toolbar"][aria-label="Flow"]')).toBeNull();
    expect(root.querySelector(".fg-canvas-zoom, [aria-label='Zoom in']")).toBeNull();
    // No types, no clipboard, no layout: the flow's duplicate is not there (the canvas's own
    // copies the nodes unconnected), and laying out does nothing.
    await act(async () => flow().store.select(["t", "a"]));
    expect(flow().duplicateSelection()).toEqual([]);
    expect(flow().copySelection()).toBeNull();
    await key(surface, "d", MOD);
    expect(flow().current.edges).toHaveLength(1);
    const before = flow().current.nodes.map((n) => n.position);
    await key(surface, "L", { shiftKey: true });
    expect(flow().current.nodes.map((n) => n.position)).toEqual(before);
    // Delete is there.
    await act(async () => flow().store.select(["a"]));
    await key(surface, "Delete");
    const ids = flow().current.nodes.map((n) => n.id);
    expect(ids).not.toContain("a");
    expect(ids).toContain("t");
  });

  it("minimal: a wire connects whatever the types", async () => {
    const g = graph([
      node("a", 0, "step", [], [{ id: "out", type: "invoice" } as never]),
      node("b", 300, "step", [{ id: "in", type: "boolean" } as never], []),
    ]);
    const { surface, flow } = await mount({ graph: g, plugins: minimalEditorPlugins });
    const port = surface.querySelector('[data-canvas-item="a"] [data-canvas-handle="out:out"]')!;
    await fire(port, "pointerdown", { clientX: 240, clientY: 40 });
    await fire(surface, "pointermove", { clientX: 400, clientY: 40 });
    await fire(surface, "pointerup", { clientX: 400, clientY: 40 });
    expect(flow().current.edges).toHaveLength(1);
  });

  it("typed: arrowheads and the rules, no layout and no clipboard", async () => {
    const { surface, flow, root } = await mount({ graph: three, preset: "typed" });
    expect(root.querySelector(".fg-flow-edge-arrow")).not.toBeNull();
    await act(async () => flow().store.select(["t", "a"]));
    await key(surface, "d", MOD);
    expect(flow().current.edges).toHaveLength(1);
    // t → a exists: a second one into the same input is refused by the typed preset's rule.
    expect(flow().canConnectEnds({ itemId: "t", handle: "out:out" }, { itemId: "a" })).toBe(false);
  });
});

describe("a node kind no plugin draws", () => {
  const onlyKinds = defineEditorPlugin({
    core: definePlugin({
      id: "kinds",
      name: "Kinds",
      description: "Knows one kind.",
      nodeKinds: { known: { label: "Known" } },
    }),
    nodeRenderers: { known: (n) => h("span", { className: "known" }, n.id) },
  });

  it("is kept in the graph, drawn as a labelled dashed box with its ports", async () => {
    const g = graph([
      node("k", 0, "known"),
      node("m", 300, "mystery", [{ id: "in" }, { id: "extra" }], [{ id: "out" }]),
    ]);
    const { surface, flow } = await mount({ graph: g, plugins: [onlyKinds] });
    expect(surface.querySelector(".known")!.textContent).toBe("k");
    const box = surface.querySelector(".fg-flow-node-unknown")!;
    expect(box.textContent).toContain("mystery");
    expect(box.getAttribute("data-unknown")).toBe("mystery");
    // Its ports are data, drawn and wired as any.
    expect(surface.querySelectorAll('[data-canvas-item="m"] [data-canvas-handle]')).toHaveLength(3);
    expect(flow().toJSON()).toBe(JSON.stringify({ ...g, version: 1 }));
    // It can be deleted, and the document stays valid.
    await act(async () => flow().store.select(["m"]));
    await key(surface, "Delete");
    expect(flow().current.nodes.map((n) => n.id)).toEqual(["k"]);
  });
});

describe("a third-party plugin in an editor", () => {
  const invoice = (n: FlowNode<Data>) => h("span", { className: "invoice" }, `Invoice ${n.id}`);
  const money = defineEditorPlugin({
    core: definePlugin({
      id: "money",
      name: "Money",
      description: "Invoices and payments.",
      requires: ["port-types"],
      nodeKinds: {
        invoice: { label: "Invoice", outputs: [{ id: "bill", type: "invoice" }] },
        payment: { label: "Payment", inputs: [{ id: "due", type: "invoice" }] },
      },
      portTypes: { invoice: { label: "Invoice", color: "--accent" } },
      connectionRules: [
        {
          id: "paid-once",
          check: ({ source, target, graph: g }) =>
            source.type === "invoice" &&
            target.type === "payment" &&
            g.edges.some((e) => e.from.node === source.id)
              ? "already-paid"
              : null,
          messages: { "already-paid": "An invoice is paid once." },
        },
      ],
    }),
    nodeRenderers: {
      invoice,
      payment: (n) => h("span", { className: "payment" }, `Payment ${n.id}`),
    },
  });
  const list = [...fullEditorPlugins, money];
  const g = graph(
    [
      node("i", 0, "invoice", [], [{ id: "bill", type: "invoice" } as never]),
      node("p1", 300, "payment", [{ id: "due", type: "invoice" } as never], []),
      node("p2", 600, "payment", [{ id: "due", type: "invoice" } as never], []),
    ],
    [["i", "p1", "bill", "due"]],
  );

  it("draws its kinds, colours its port type, and says why a drop is refused", async () => {
    const { surface, flow } = await mount({ graph: g, plugins: list });
    expect(surface.querySelector(".invoice")!.textContent).toBe("Invoice i");
    expect(surface.querySelectorAll(".payment")).toHaveLength(2);
    const dot = surface.querySelector('[data-canvas-item="i"] [data-canvas-handle="out:bill"]')!;
    expect(dot.getAttribute("data-colored")).toBe("");
    expect((dot as HTMLElement).style.getPropertyValue("--fg-flow-port-color")).toBe(
      "var(--accent)",
    );

    await fire(dot, "pointerdown", { clientX: 240, clientY: 40 });
    await fire(surface, "pointermove", { clientX: 700, clientY: 40 });
    expect(flow().store.getState().connection?.over).toBeNull();
    const label = surface.querySelector(".fg-flow-refusal")!;
    expect(label.getAttribute("data-reason")).toBe("already-paid");
    expect(label.textContent).toBe("An invoice is paid once.");
    await fire(surface, "pointerup", { clientX: 700, clientY: 40 });
    expect(surface.querySelector(".fg-flow-refusal")).toBeNull();
    expect(flow().current.edges).toHaveLength(1);
  });

  it("adds a node of its kind, connects it, lays out and undoes as one step", async () => {
    const { surface, flow } = await mount({ graph: g, plugins: list });
    const p3 = flow().addKind("payment", { position: { x: 900, y: 300 } });
    await act(async () => undefined);
    expect(surface.querySelector(`[data-canvas-item="${p3.id}"] .payment`)).not.toBeNull();
    // A second payment for the same invoice: refused, by the plugin's own rule.
    expect(flow().connect({ node: "i", port: "bill" }, { node: p3.id, port: "due" })).toEqual({
      ok: false,
      error: "already-paid",
    });
    const before = flow().current.nodes.map((n) => n.position);
    await key(surface, "L", { shiftKey: true });
    const after = flow().current.nodes.map((n) => n.position);
    expect(after).not.toEqual(before);
    await key(surface, "z", MOD);
    expect(flow().current.nodes.map((n) => n.position)).toEqual(before);
    expect(flow().current.nodes).toHaveLength(4);
  });

  it("is added per editor instance: a new list rebuilds the editor", async () => {
    const base = [...minimalEditorPlugins, ...typedEditorPlugins.slice(5), money];
    const { surface, rerender, flow } = await mount({ graph: g, plugins: base });
    // Without the `nodes` plugin only the plugin's own kinds are drawn; the rest is the dashed box.
    expect(surface.querySelectorAll(".payment")).toHaveLength(2);
    const second: ReadonlyArray<FlowPluginEntry<Data>> = [
      ...base,
      defineEditorPlugin({
        core: definePlugin({ id: "extra", name: "Extra", description: "Nothing" }),
        nodeRenderers: { invoice: () => h("span", { className: "other" }, "other") },
      }),
    ];
    // Two plugins drawing one kind are refused.
    await expect(rerender(second)).rejects.toThrow(/only one plugin draws a kind/);
    void flow;
  });

  it("refuses a bad list", () => {
    const dup = defineEditorPlugin({
      core: definePlugin({ id: "dup", name: "Dup", description: "d" }),
      nodeRenderers: { invoice: () => null },
    });
    expect(() => createEditorRegistry([...typedEditorPlugins, money, dup])).toThrow(
      /only one plugin draws a kind/,
    );
    expect(() =>
      createEditorRegistry([
        defineEditorPlugin({
          core: definePlugin({ id: "keys", name: "Keys", description: "k" }),
          shortcuts: [{ keys: "mod+q", tool: "nope" }],
        }),
      ]),
    ).toThrow(/tool "nope"/);
    expect(() => createEditorRegistry([money, money])).toThrow(/Duplicate plugin id/);
    // A core half alone is a fine entry: it brings rules and kinds, no drawing.
    const withCore = createEditorRegistry([...typedEditorPlugins, money.core]);
    expect(withCore.nodeRenderer("invoice")).toBe(withCore.nodeRenderer("anything"));
    expect(withCore.core.kind("invoice")).toBeDefined();
  });
});
