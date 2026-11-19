// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCanvasStore, type CanvasStore } from "../core/store";
import type { Item } from "../core/types";
import { Canvas, Minimap, ZoomControls, type CanvasRenderer, type Scene } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
beforeEach(() => {
  // Reduced motion: the chrome jumps instead of gliding, so a test reads the result at once.
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q }));
  // jsdom draws nothing: the grid and the minimap skip their drawing.
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

const item = (id: string, x: number, y: number, z: number): Item<{ title: string }> => ({
  id,
  kind: "card",
  bounds: { x, y, w: 100, h: 60 },
  z,
  data: { title: id },
});

async function mount(store: CanvasStore<{ title: string }>, extra: Record<string, unknown> = {}) {
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  await act(async () =>
    r.render(
      h(
        Canvas<{ title: string }>,
        {
          store,
          label: "Test canvas",
          renderItem: (i: Item<{ title: string }>) => h("span", null, i.data.title),
          ...extra,
        },
        h(ZoomControls, { history: true }),
        h(Minimap),
      ),
    ),
  );
  return host.querySelector<HTMLElement>(".fg-canvas")!;
}

const fire = async (el: Element, type: string, init: Record<string, unknown> = {}) =>
  act(async () => {
    const Ctor = (globalThis as { PointerEvent?: typeof MouseEvent }).PointerEvent ?? MouseEvent;
    el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0, ...init }));
  });
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });

const make = () =>
  createCanvasStore({ items: [item("a", 0, 0, 0), item("b", 200, 0, 1)], grid: { snap: false } });

describe("<Canvas>", () => {
  it("renders the items as options of a listbox, named for assistive technology", async () => {
    const store = make();
    const surface = await mount(store);
    expect(surface.getAttribute("aria-label")).toBe("Test canvas");
    const options = surface.querySelectorAll("[role=option]");
    expect([...options].map((o) => o.textContent)).toEqual(["a", "b"]);
    expect(options[0]!.getAttribute("tabindex")).toBe("0");
    expect(options[1]!.getAttribute("tabindex")).toBe("-1");
  });

  it("selects on press, toggles with Shift, clears on the empty surface", async () => {
    const store = make();
    const surface = await mount(store);
    await fire(surface, "pointerdown", { clientX: 10, clientY: 10 });
    await fire(surface, "pointerup", { clientX: 10, clientY: 10 });
    expect([...store.getState().selection]).toEqual(["a"]);
    await fire(surface, "pointerdown", { clientX: 210, clientY: 10, shiftKey: true });
    await fire(surface, "pointerup", { clientX: 210, clientY: 10, shiftKey: true });
    expect([...store.getState().selection].sort()).toEqual(["a", "b"]);
    await fire(surface, "pointerdown", { clientX: 500, clientY: 500 });
    await fire(surface, "pointerup", { clientX: 500, clientY: 500 });
    expect(store.getState().selection.size).toBe(0);
    expect(surface.querySelector("[aria-live]")!.textContent).toBe("Selection cleared");
  });

  it("drags the selection as one undo step", async () => {
    const store = make();
    const surface = await mount(store);
    await fire(surface, "pointerdown", { clientX: 10, clientY: 10 });
    await fire(surface, "pointermove", { clientX: 30, clientY: 15 });
    await fire(surface, "pointermove", { clientX: 60, clientY: 40 });
    await fire(surface, "pointerup", { clientX: 60, clientY: 40 });
    expect(store.get("a")!.bounds).toMatchObject({ x: 50, y: 30 });
    const mac = navigator.platform.includes("Mac");
    await key(surface, "z", { metaKey: mac, ctrlKey: !mac });
    expect(store.get("a")!.bounds).toMatchObject({ x: 0, y: 0 });
  });

  it("selects with a box", async () => {
    const store = make();
    const surface = await mount(store);
    await fire(surface, "pointerdown", { clientX: -20, clientY: -20 });
    await fire(surface, "pointermove", { clientX: 250, clientY: 20 });
    expect(surface.querySelector(".fg-canvas-band")).not.toBeNull();
    await fire(surface, "pointerup", { clientX: 250, clientY: 20 });
    expect([...store.getState().selection].sort()).toEqual(["a", "b"]);
    expect(surface.querySelector(".fg-canvas-band")).toBeNull();
    expect(surface.querySelector("[aria-live]")!.textContent).toBe("2 items selected");
  });

  it("nudges, deletes and selects all from the keyboard", async () => {
    const store = make();
    const surface = await mount(store);
    store.select(["a"]);
    await key(surface, "ArrowRight");
    await key(surface, "ArrowDown", { shiftKey: true });
    expect(store.get("a")!.bounds).toMatchObject({ x: 1, y: 10 });
    await key(surface, "Backspace");
    expect(store.get("a")).toBeUndefined();
    const mac = navigator.platform.includes("Mac");
    await key(surface, "a", { metaKey: mac, ctrlKey: !mac });
    expect([...store.getState().selection]).toEqual(["b"]);
  });

  it("moves the focus between items with Tab and selects the focused one", async () => {
    const store = make();
    const surface = await mount(store);
    const [a, b] = surface.querySelectorAll<HTMLElement>("[role=option]");
    await act(async () => a!.focus());
    expect([...store.getState().selection]).toEqual(["a"]);
    await key(a!, "Tab");
    expect(document.activeElement).toBe(b);
    expect([...store.getState().selection]).toEqual(["b"]);
    expect(surface.querySelector("[aria-live]")!.textContent).toBe("card b, selected");
  });

  it("starts a connection from a handle and reports where it ends", async () => {
    const store = createCanvasStore<{ title: string }>({
      items: [item("a", 0, 0, 0), item("b", 200, 0, 1)],
    });
    const onConnect = vi.fn<(...args: unknown[]) => void>();
    const surface = await mount(store, {
      onConnect,
      renderItem: (i: Item<{ title: string }>) =>
        h("span", { "data-canvas-handle": "out", className: `port-${i.id}` }, i.data.title),
    });
    await fire(surface.querySelector(".port-a")!, "pointerdown", { clientX: 5, clientY: 5 });
    expect(store.getState().connection?.from).toEqual({ itemId: "a", handle: "out" });
    await fire(surface, "pointermove", { clientX: 250, clientY: 30 });
    expect(store.getState().connection?.over).toEqual({ itemId: "b" });
    await fire(surface, "pointerup", { clientX: 250, clientY: 30 });
    expect(onConnect).toHaveBeenCalledWith(
      { itemId: "a", handle: "out" },
      { itemId: "b" },
      { x: 250, y: 30 },
    );
    expect(store.getState().connection).toBeNull();
  });

  it("hands presses to a consumer tool", async () => {
    const store = make();
    const up = vi.fn<() => void>();
    const surface = await mount(store, {
      tools: [
        {
          id: "stamp",
          label: "Stamp",
          down: (p: { world: { x: number; y: number } }, api: { store: CanvasStore }) => {
            api.store.add({
              kind: "card",
              bounds: { ...p.world, w: 10, h: 10 },
              data: { title: "s" },
            });
            return { up };
          },
        },
      ],
    });
    await act(async () => store.setTool("stamp"));
    await fire(surface, "pointerdown", { clientX: 400, clientY: 300 });
    await fire(surface, "pointerup", { clientX: 400, clientY: 300 });
    expect(store.getState().items).toHaveLength(3);
    expect(up).toHaveBeenCalledTimes(1);
  });
});

describe("culling", () => {
  it("keeps the same item nodes through a small pan and follows a long one", async () => {
    const store = createCanvasStore({
      items: [item("a", 0, 0, 0), item("b", 200, 0, 1), item("far", 3000, 0, 2)],
      grid: { snap: false },
    });
    const surface = await mount(store);
    await act(async () => store.setSize({ w: 800, h: 600 }));
    const ids = () =>
      [...surface.querySelectorAll<HTMLElement>("[data-canvas-item]")].map(
        (e) => e.dataset.canvasItem,
      );
    expect(ids()).toEqual(["a", "b"]);
    const a = surface.querySelector('[data-canvas-item="a"]');
    const world = surface.querySelector<HTMLElement>(".fg-canvas-world")!;
    await act(async () => store.panBy(-120, 40));
    // The camera moved the world layer; the items were neither re-created nor re-ordered.
    expect(world.style.transform).toBe("translate(-120px, 40px) scale(1)");
    expect(surface.querySelector('[data-canvas-item="a"]')).toBe(a);
    expect(ids()).toEqual(["a", "b"]);
    await act(async () => store.panBy(-2400, 0));
    expect(ids()).toContain("far");
  });
});

describe("renderers", () => {
  it("hands a plain scene to the renderer: primitives apart from the DOM overlay", async () => {
    const store = make();
    const scenes: Scene[] = [];
    const renderer = (): CanvasRenderer => ({
      mount: () => {},
      render: (scene) => scenes.push(scene),
      unmount: () => {},
    });
    const surface = await mount(store, {
      renderer,
      primitive: (i: Item) => (i.id === "a" ? { shape: "ellipse", fill: "--bg" } : null),
    });
    await act(async () => store.select(["a"]));
    const last = scenes.at(-1)!;
    expect(last.primitives.map((p) => [p.id, p.primitive.shape, p.selected])).toEqual([
      ["a", "ellipse", true],
    ]);
    expect(last.outlines).toHaveLength(1);
    expect(last.handles).toHaveLength(8);
    expect(surface.querySelector(".fg-canvas-chrome")).toBeNull();
    expect(surface.querySelectorAll("[role=option]")).toHaveLength(2);
  });
});

describe("the DOM renderer", () => {
  it("moves its shapes with the camera without rebuilding them", async () => {
    const store = make();
    const surface = await mount(store, {
      primitive: () => ({ shape: "rect", fill: "--bg" }),
    });
    await act(async () => store.select(["a"]));
    const shape = surface.querySelector(".fg-canvas-shapes rect");
    const group = surface.querySelector(".fg-canvas-shapes g")!;
    expect(surface.querySelectorAll(".fg-canvas-shapes rect")).toHaveLength(2);
    expect(surface.querySelectorAll(".fg-canvas-chrome .fg-canvas-outline")).toHaveLength(1);
    await act(async () => store.panBy(30, 10));
    expect(group.getAttribute("transform")).toBe("translate(30 10) scale(1)");
    expect(surface.querySelector(".fg-canvas-shapes rect")).toBe(shape);
    // The selection is drawn in screen space: it follows the camera.
    expect(surface.querySelector(".fg-canvas-outline")!.getAttribute("x")).toBe("30.5");
  });
});

describe("<ZoomControls>", () => {
  it("zooms by presets, shows the level, switches the tool and undoes", async () => {
    const store = make();
    const surface = await mount(store);
    const button = (name: string) =>
      surface.querySelector<HTMLButtonElement>(`[aria-label="${name}"]`)!;
    await act(async () => button("Zoom in").click());
    expect(store.getState().viewport.zoom).toBe(1.5);
    expect(surface.querySelector(".fg-canvas-zoom-value")!.textContent).toBe("150%");
    await act(async () =>
      surface.querySelector<HTMLButtonElement>(".fg-canvas-zoom-value")!.click(),
    );
    expect(store.getState().viewport.zoom).toBe(1);
    await act(async () => button("Hand (H)").click());
    expect(store.getState().tool).toBe("pan");
    expect(button("Undo").disabled).toBe(true);
    await act(async () => store.moveBy(["a"], 5, 0));
    expect(button("Undo").disabled).toBe(false);
    await act(async () => button("Undo").click());
    expect(store.get("a")!.bounds.x).toBe(0);
  });
});
