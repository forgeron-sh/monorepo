// @vitest-environment jsdom
import { act, createElement as h, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyGraph, type FlowGraph, type FlowNode } from "../core/model";
import { FlowCanvas, useFlow, type FlowApi } from "./index";

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

const node = (id: string, x: number, inputs = ["in"], outputs = ["out"]): FlowNode<Data> => ({
  id,
  type: "step",
  position: { x, y: 0 },
  size: { w: 240, h: 80 },
  inputs: inputs.map((p) => ({ id: p })),
  outputs: outputs.map((p) => ({ id: p })),
  data: { title: id },
});

const start: FlowGraph<Data> = {
  ...emptyGraph<Data>(),
  nodes: [node("t", 0, []), node("a", 300), node("b", 600)],
  edges: [{ id: "e1", from: { node: "t", port: "out" }, to: { node: "a", port: "in" } }],
};

async function mount(): Promise<{ surface: HTMLElement; flow: () => FlowApi<Data> }> {
  let api: FlowApi<Data> | undefined;
  function Editor() {
    const flow = useFlow<Data>({ graph: start, grid: { snap: false } });
    useEffect(() => {
      api = flow;
    });
    return h(FlowCanvas<Data>, {
      flow,
      label: "Test flow",
      renderNode: (n: FlowNode<Data>) => h("span", { className: "body" }, n.data.title),
      nodeLabel: (n: FlowNode<Data>) => `Step ${n.data.title}`,
    });
  }
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  await act(async () => r.render(h(Editor)));
  return { surface: host.querySelector<HTMLElement>(".fg-canvas")!, flow: () => api! };
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

describe("<FlowCanvas>", () => {
  it("renders nodes with their ports, and edges under them", async () => {
    const { surface } = await mount();
    const options = [...surface.querySelectorAll("[role=option]")];
    expect(options.map((o) => o.getAttribute("aria-label"))).toEqual([
      "Step t",
      "Step a",
      "Step b",
    ]);
    expect(surface.querySelectorAll("[data-canvas-handle]")).toHaveLength(5);
    const edge = surface.querySelector('[data-edge="e1"] .fg-flow-edge-line')!;
    // From t's output (240, 40) to a's input (300, 40), stopping at the arrowhead.
    expect(edge.getAttribute("d")).toBe("M240 40C280 40 254 40 294 40");
  });

  it("connects by dragging from an output port onto a node", async () => {
    const { surface, flow } = await mount();
    const port = surface.querySelector('[data-canvas-item="a"] [data-canvas-handle="out:out"]')!;
    await fire(port, "pointerdown", { clientX: 540, clientY: 40 });
    await fire(surface, "pointermove", { clientX: 700, clientY: 40 });
    expect(flow().store.getState().connection?.over).toEqual({ itemId: "b" });
    await fire(surface, "pointerup", { clientX: 700, clientY: 40 });
    expect(flow().current.edges.map((e) => `${e.from.node}>${e.to.node}`)).toEqual(["t>a", "a>b"]);
    expect(surface.querySelectorAll(".fg-flow-edge")).toHaveLength(2);
  });

  it("refuses a connection the rules forbid", async () => {
    const { surface, flow } = await mount();
    // t → a exists: a second one into the same input is refused.
    const port = surface.querySelector('[data-canvas-item="t"] [data-canvas-handle="out:out"]')!;
    await fire(port, "pointerdown", { clientX: 240, clientY: 40 });
    await fire(surface, "pointermove", { clientX: 400, clientY: 40 });
    expect(flow().store.getState().connection?.over).toBeNull();
    await fire(surface, "pointerup", { clientX: 400, clientY: 40 });
    expect(flow().current.edges).toHaveLength(1);
  });

  it("deletes a node with the edges into it, and undo brings both back", async () => {
    const { surface, flow } = await mount();
    await act(async () => flow().store.select(["a"]));
    await key(surface, "Delete");
    expect(flow().current.nodes.map((n) => n.id)).toEqual(["t", "b"]);
    expect(surface.querySelectorAll(".fg-flow-edge")).toHaveLength(0);
    await key(surface, "z", MOD);
    expect(flow().current.edges).toHaveLength(1);
    expect(surface.querySelectorAll(".fg-flow-edge")).toHaveLength(1);
  });

  it("selects an edge with a click and deletes it with Backspace", async () => {
    const { surface, flow } = await mount();
    await fire(surface.querySelector('[data-edge="e1"]')!, "pointerdown");
    expect([...flow().selectedEdges]).toEqual(["e1"]);
    expect(surface.querySelector('[data-edge="e1"]')!.hasAttribute("data-selected")).toBe(true);
    await key(surface, "Backspace");
    expect(flow().current.edges).toHaveLength(0);
    expect(flow().current.nodes).toHaveLength(3);
  });

  it("duplicates the selection with its inner edges", async () => {
    const { surface, flow } = await mount();
    await act(async () => flow().store.select(["t", "a"]));
    await key(surface, "d", MOD);
    expect(flow().current.nodes).toHaveLength(5);
    expect(flow().current.edges).toHaveLength(2);
    expect([...flow().store.getState().selection]).toEqual(["step-1", "step-2"]);
  });

  it("copies and pastes the selection as flow JSON", async () => {
    const { surface, flow } = await mount();
    await act(async () => flow().store.select(["t", "a"]));
    await key(surface, "c", MOD);
    await key(surface, "v", MOD);
    await act(async () => new Promise((r) => setTimeout(r, 5)));
    expect(flow().current.nodes).toHaveLength(5);
    expect(flow().current.edges).toHaveLength(2);
  });
});
