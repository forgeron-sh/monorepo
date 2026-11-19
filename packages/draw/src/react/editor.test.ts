// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDrawStore, type DrawStore } from "../core/engine";
import { shapeItem } from "../core/create";
import type { ArrowData, DrawItem } from "../core/types";
import { DrawEditor } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
beforeEach(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduce"),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
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

async function mount(store: DrawStore) {
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  await act(async () => r.render(h(DrawEditor, { store, label: "Test board" })));
  return host.querySelector<HTMLElement>(".fg-canvas")!;
}

const fire = async (el: Element, type: string, init: Record<string, unknown> = {}) =>
  act(async () => {
    const Ctor = (globalThis as { PointerEvent?: typeof MouseEvent }).PointerEvent ?? MouseEvent;
    el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0, ...init }));
  });

/** A press, moves and a release, in screen pixels (the surface is at 0, 0, zoom 1). */
async function drag(
  el: Element,
  path: Array<[number, number]>,
  init: Record<string, unknown> = {},
) {
  const [first, ...rest] = path;
  await fire(el, "pointerdown", { clientX: first![0], clientY: first![1], ...init });
  for (const [x, y] of rest) await fire(el, "pointermove", { clientX: x, clientY: y, ...init });
  const last = path.at(-1)!;
  await fire(el, "pointerup", { clientX: last[0], clientY: last[1], ...init });
}

const typeInto = async (field: HTMLTextAreaElement, value: string) =>
  act(async () => {
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    set.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });

const make = () => createDrawStore();

describe("<DrawEditor> tools", () => {
  it("draws a rectangle by dragging, snapped, as one undo step, then selects it", async () => {
    const store = make();
    const surface = await mount(store);
    await act(async () => store.setTool("rectangle"));
    await drag(surface, [
      [102, 98],
      [180, 160],
      [298, 222],
    ]);
    const [rect] = store.getState().items;
    expect(rect?.kind).toBe("rectangle");
    expect(rect?.bounds).toEqual({ x: 100, y: 100, w: 200, h: 120 });
    expect([...store.getState().selection]).toEqual([rect!.id]);
    expect(store.getState().tool).toBe("select");
    expect(surface.querySelector(`[data-canvas-item="${rect!.id}"] .fgd-svg rect`)).not.toBeNull();
    await act(async () => store.undo());
    expect(store.getState().items).toHaveLength(0);
  });

  it("places a shape of a default size on a click", async () => {
    const store = make();
    const surface = await mount(store);
    await act(async () => store.setTool("ellipse"));
    await drag(surface, [[400, 300]]);
    expect(store.getState().items[0]?.bounds).toEqual({ x: 340, y: 240, w: 120, h: 120 });
  });

  it("types text in place, and the text grows with it", async () => {
    const store = make();
    const surface = await mount(store);
    await act(async () => store.setTool("text"));
    await drag(surface, [[60, 400]]);
    const field = surface.querySelector<HTMLTextAreaElement>("textarea.fgd-text")!;
    expect(field).not.toBeNull();
    await typeInto(field, "Hello");
    await typeInto(field, "Hello board, a longer line");
    await act(async () => field.blur());
    const [text] = store.getState().items as DrawItem[];
    expect(text?.data).toMatchObject({ type: "text", text: "Hello board, a longer line" });
    expect(text!.bounds.w).toBeGreaterThan(200);
    expect(surface.querySelector("textarea")).toBeNull();
    expect(surface.querySelector(".fgd-text")?.textContent).toBe("Hello board, a longer line");
    // Adding and typing are one step.
    await act(async () => store.undo());
    expect(store.getState().items).toHaveLength(0);
  });

  it("an empty text goes away when typing ends", async () => {
    const store = make();
    const surface = await mount(store);
    await act(async () => store.setTool("text"));
    await drag(surface, [[60, 400]]);
    await act(async () => surface.querySelector<HTMLTextAreaElement>("textarea")!.blur());
    expect(store.getState().items).toHaveLength(0);
  });

  it("a sticky note grows as its text gets longer", async () => {
    const store = make();
    const surface = await mount(store);
    await act(async () => store.setTool("sticky"));
    await drag(surface, [[200, 200]]);
    const field = surface.querySelector<HTMLTextAreaElement>("textarea.fgd-sticky-text")!;
    await typeInto(field, "word ".repeat(60));
    const [note] = store.getState().items;
    expect(note!.bounds.h).toBeGreaterThan(note!.bounds.w);
  });

  it("connects an arrow from one shape to another, and it follows them", async () => {
    const store = make();
    const [a, b] = store.add([
      shapeItem("rectangle", { x: 0, y: 0, w: 100, h: 100 }),
      shapeItem("rectangle", { x: 300, y: 0, w: 100, h: 100 }),
    ]);
    const surface = await mount(store);
    await act(async () => store.setTool("arrow"));
    await drag(surface, [
      [50, 50],
      [200, 60],
      [350, 50],
    ]);
    const arrow = store.getState().items.find((i) => i.kind === "arrow") as DrawItem<ArrowData>;
    expect(arrow.data.start.bind).toBe(a!.id);
    expect(arrow.data.end.bind).toBe(b!.id);
    await act(async () => store.moveBy([b!.id], 0, 200));
    const moved = store.get(arrow.id) as DrawItem<ArrowData>;
    expect(moved.bounds.y + moved.data.end.y).toBeGreaterThan(200);
  });

  it("drags an arrow's end onto another item to bind it there", async () => {
    const store = make();
    const [, , c] = store.add([
      shapeItem("rectangle", { x: 0, y: 0, w: 100, h: 100 }),
      shapeItem("rectangle", { x: 300, y: 0, w: 100, h: 100 }),
      shapeItem("rectangle", { x: 300, y: 300, w: 100, h: 100 }),
    ]);
    const surface = await mount(store);
    await act(async () => store.setTool("arrow"));
    await drag(surface, [
      [50, 50],
      [350, 50],
    ]);
    const arrow = store.getState().items.find((i) => i.kind === "arrow")!;
    const end = surface.querySelector(
      `[data-canvas-item="${arrow.id}"] [data-canvas-handle="end"]`,
    )!;
    expect(end).not.toBeNull();
    await fire(end, "pointerdown", { clientX: 296, clientY: 50 });
    await fire(surface, "pointermove", { clientX: 340, clientY: 200 });
    await fire(surface, "pointermove", { clientX: 350, clientY: 350 });
    await fire(surface, "pointerup", { clientX: 350, clientY: 350 });
    expect((store.get(arrow.id) as DrawItem<ArrowData>).data.end.bind).toBe(c!.id);
  });

  it("erases what the eraser crosses, in one step", async () => {
    const store = make();
    store.add([
      shapeItem("rectangle", { x: 0, y: 0, w: 100, h: 100 }),
      shapeItem("rectangle", { x: 200, y: 0, w: 100, h: 100 }),
      shapeItem("rectangle", { x: 0, y: 300, w: 100, h: 100 }),
    ]);
    const surface = await mount(store);
    await act(async () => store.setTool("eraser"));
    await drag(surface, [
      [50, 50],
      [250, 50],
    ]);
    expect(store.getState().items.map((i) => i.bounds.y)).toEqual([300]);
    await act(async () => store.undo());
    expect(store.getState().items).toHaveLength(3);
  });

  it("draws a pixel pen stroke on the pixel grid", async () => {
    const store = make();
    const surface = await mount(store);
    await act(async () => store.setTool("pen"));
    await drag(surface, [
      [11, 13],
      [30, 20],
      [61, 41],
      [90, 70],
    ]);
    const [stroke] = store.getState().items as DrawItem[];
    expect(stroke?.kind).toBe("pen");
    expect(stroke!.bounds.x % 4).toBe(0);
    expect(surface.querySelector(`[data-canvas-item="${stroke!.id}"] path`)).not.toBeNull();
  });

  it("picks tools with their keys and shows the inspector for a selection", async () => {
    const store = make();
    const surface = await mount(store);
    for (const [k, tool] of [
      ["r", "rectangle"],
      ["o", "ellipse"],
      ["d", "diamond"],
      ["s", "sticky"],
      ["t", "text"],
      ["a", "arrow"],
      ["p", "pen"],
      ["e", "eraser"],
      ["f", "frame"],
      ["h", "pan"],
      ["v", "select"],
    ] as const) {
      await act(async () => {
        surface.dispatchEvent(
          new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }),
        );
      });
      expect(store.getState().tool).toBe(tool);
    }
    expect(host!.querySelector(".fgd-inspector")).toBeNull();
    const [r] = store.add(shapeItem("rectangle", { x: 0, y: 0, w: 100, h: 100 }));
    await act(async () => store.select([r!.id]));
    expect(host!.querySelector(".fgd-inspector")?.textContent).toContain("Rectangle");
  });
});
