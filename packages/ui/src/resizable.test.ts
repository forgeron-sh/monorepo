// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./parts-resizable";
import {
  fitLayout,
  fitRemainder,
  initialLayout,
  resizePair,
  toggleCollapse,
  type PanelLimits,
} from "./resizable-model";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const lim = (over: Partial<PanelLimits> = {}): PanelLimits => ({
  min: 0,
  max: 100,
  collapsible: false,
  collapsedSize: 0,
  ...over,
});

describe("resizable model", () => {
  it("shares what the panels without a size leave", () => {
    expect(initialLayout([20, undefined, undefined], [lim(), lim(), lim()], 100)).toEqual([
      20, 40, 40,
    ]);
  });
  it("fits a layout to the total and the limits", () => {
    expect(fitLayout([50, 50, 50], [lim(), lim(), lim()], 100).reduce((a, b) => a + b)).toBeCloseTo(
      100,
    );
    expect(fitLayout([10, 90], [lim({ min: 30 }), lim()], 100)).toEqual([30, 70]);
    expect(fitLayout([90, 10], [lim({ max: 60 }), lim()], 100)).toEqual([60, 40]);
  });
  it("moves a handle between its two neighbours only", () => {
    const l = [lim({ min: 10 }), lim({ min: 10 }), lim()];
    expect(resizePair([30, 30, 40], l, 0, 40)).toEqual([40, 20, 40]);
    expect(resizePair([30, 30, 40], l, 0, 80)).toEqual([30 + 20, 10, 40]);
    expect(resizePair([30, 30, 40], l, 1, -Infinity)).toEqual([30, 10, 60]);
  });
  it("collapses a collapsible panel under half way to its minimum, and expands past it", () => {
    const l = [lim({ min: 20, collapsible: true }), lim()];
    expect(resizePair([30, 70], l, 0, 8, { snap: true })).toEqual([0, 100]);
    expect(resizePair([30, 70], l, 0, 12, { snap: true })).toEqual([20, 80]);
    expect(resizePair([0, 100], l, 0, 4, { snap: true })).toEqual([0, 100]);
    expect(resizePair([0, 100], l, 0, 15, { snap: true })).toEqual([20, 80]);
  });
  it("toggles a collapsible panel back to the size it had", () => {
    const l = [lim({ min: 10, collapsible: true }), lim()];
    const closed = toggleCollapse([40, 60], l, 0, new Map())!;
    expect(closed).toEqual([0, 100]);
    expect(toggleCollapse(closed, l, 0, new Map([[0, 40]]))).toEqual([40, 60]);
    expect(toggleCollapse([40, 60], [lim(), lim()], 0, new Map())).toBeNull();
  });
  it("gives the last panel what the others leave in px, and takes from the others if short", () => {
    expect(
      fitRemainder(
        [200, 0],
        [lim({ min: 100, max: Infinity }), lim({ min: 100, max: Infinity })],
        600,
      ),
    ).toEqual([200, 400]);
    expect(
      fitRemainder(
        [550, 0],
        [lim({ min: 100, max: Infinity }), lim({ min: 100, max: Infinity })],
        600,
      ),
    ).toEqual([500, 100]);
  });
});

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(element));
  return host;
};
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });

const group = (props: Record<string, unknown> = {}, panel: Record<string, unknown>[] = []) =>
  h(
    ResizablePanelGroup,
    { className: "g", ...props },
    h(ResizablePanel, { defaultSize: 25, minSize: 10, className: "p", ...panel[0] }, "a"),
    h(ResizableHandle, { withHandle: true, className: "x" }),
    h(ResizablePanel, { minSize: 10, ...panel[1] }, "b"),
    h(ResizableHandle, null),
    h(ResizablePanel, { defaultSize: 25, minSize: 10, ...panel[2] }, "c"),
  );

describe("Resizable parts", () => {
  it("renders the layout, the slots and the data attributes", () => {
    const out = html(group({ direction: "vertical" }));
    expect(out).toContain('data-slot="resizable-panel-group"');
    expect(out).toContain('data-panel-group-direction="vertical"');
    expect(out).toContain("flex:25 1 0px");
    expect(out).toContain("flex:50 1 0px");
    expect(out).toContain('data-slot="resizable-handle"');
    expect(out).toContain('data-resize-handle-state="inactive"');
    expect(out).toContain('data-slot="resizable-handle-grip"');
    expect(out).toContain('class="g"');
  });
  it("is a window splitter with the sizes and limits", async () => {
    const el = await mount(group());
    const [first, second] = Array.from(el.querySelectorAll("[role=separator]"));
    expect(first!.getAttribute("aria-valuenow")).toBe("25");
    expect(first!.getAttribute("aria-valuemin")).toBe("10");
    expect(first!.getAttribute("aria-valuemax")).toBe("65");
    expect(first!.getAttribute("aria-orientation")).toBe("vertical");
    expect(first!.getAttribute("tabindex")).toBe("0");
    expect(second!.getAttribute("aria-valuenow")).toBe("50");
    const panels = el.querySelectorAll("[data-slot=resizable-panel]");
    expect(first!.getAttribute("aria-controls")).toBe(panels[0]!.id);
  });
  it("redistributes between the two neighbours on arrows, Home and End", async () => {
    const onLayout = vi.fn<(l: number[]) => void>();
    const onLayoutChanged = vi.fn<(l: number[]) => void>();
    const el = await mount(group({ onLayout, onLayoutChanged }));
    const [first, second] = Array.from(el.querySelectorAll("[role=separator]"));
    await key(first!, "ArrowRight");
    expect(onLayout).toHaveBeenLastCalledWith([30, 45, 25]);
    await key(first!, "ArrowLeft", { shiftKey: true });
    expect(onLayout).toHaveBeenLastCalledWith([10, 65, 25]);
    await key(second!, "End");
    expect(onLayout).toHaveBeenLastCalledWith([10, 80, 10]);
    await key(first!, "Home");
    expect(onLayoutChanged).toHaveBeenCalledTimes(4);
  });
  it("is controlled with layout, and keeps its own without", async () => {
    const onLayout = vi.fn<(l: number[]) => void>();
    const el = await mount(group({ layout: [20, 60, 20], onLayout }));
    const bar = el.querySelector("[role=separator]")!;
    await key(bar, "ArrowRight");
    expect(onLayout).toHaveBeenLastCalledWith([25, 55, 20]);
    expect(bar.getAttribute("aria-valuenow")).toBe("20");
  });
  it("collapses and expands a collapsible panel with Enter", async () => {
    const el = await mount(group({}, [{ collapsible: true, defaultSize: 30 }]));
    const bar = el.querySelector("[role=separator]")!;
    const panel = el.querySelector("[data-slot=resizable-panel]")!;
    await key(bar, "Enter");
    expect(panel.getAttribute("data-state")).toBe("collapsed");
    expect(bar.getAttribute("aria-valuenow")).toBe("0");
    await key(bar, "Enter");
    expect(panel.getAttribute("data-state")).toBe("expanded");
    expect(bar.getAttribute("aria-valuenow")).toBe("30");
  });
  it("does not move a disabled handle", async () => {
    const el = await mount(
      h(
        ResizablePanelGroup,
        { orientation: "vertical" },
        h(ResizablePanel, { defaultSize: 50 }, "a"),
        h(ResizableHandle, { disabled: true }),
        h(ResizablePanel, null, "b"),
      ),
    );
    const bar = el.querySelector("[role=separator]")!;
    expect(bar.getAttribute("tabindex")).toBeNull();
    expect(bar.getAttribute("aria-disabled")).toBe("true");
    await key(bar, "ArrowDown");
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
  });
  it("keeps the layout under storageKey", async () => {
    localStorage.setItem("fg-resizable:t", JSON.stringify([40, 20, 40]));
    const el = await mount(group({ storageKey: "t" }));
    const [first] = Array.from(el.querySelectorAll("[role=separator]"));
    expect(first!.getAttribute("aria-valuenow")).toBe("40");
    await key(first!, "ArrowRight");
    expect(JSON.parse(localStorage.getItem("fg-resizable:t")!)).toEqual([45, 15, 40]);
    localStorage.clear();
  });
});
