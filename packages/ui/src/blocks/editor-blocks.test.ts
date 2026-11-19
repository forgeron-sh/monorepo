// @vitest-environment jsdom
import { Square01Icon } from "@forgeron/icons";
import { createElement as h, useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CanvasToolbar,
  CommentPin,
  CursorPresence,
  EDITOR_FILL_PATTERNS,
  FillPicker,
  LayersPanel,
  Minimap,
  OnboardingChecklist,
  PinLayer,
  ShortcutsSheet,
  StrokePicker,
  Tour,
  ZoomControls,
  editorBoundsOf,
  editorCenterViewport,
  editorChecklistProgress,
  editorClampViewport,
  editorClampZoom,
  editorDashArray,
  editorDropLayer,
  editorDropPlace,
  editorFillZoom,
  editorFindLayer,
  editorFitZoom,
  editorFlattenLayers,
  editorFromMap,
  editorGroupShortcuts,
  editorIndentLayer,
  editorInkOn,
  editorMinimapFit,
  editorMoveLayer,
  editorNextStep,
  editorOutdentLayer,
  editorPanViewport,
  editorParseZoom,
  editorPatternCells,
  editorPatternDensity,
  editorPresenceTone,
  editorProject,
  editorReorderLayer,
  editorScaleViewport,
  editorSelectLayers,
  editorShortcutEntries,
  editorStepZoom,
  editorToMap,
  editorTourIndex,
  editorTourPlacement,
  editorUnproject,
  editorUpdateLayer,
  editorZoomAround,
  editorZoomText,
  type EditorLayer,
  type EditorRect,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
const roots: Array<ReturnType<typeof createRoot>> = [];
const track = (root: ReturnType<typeof createRoot>) => {
  roots.push(root);
  return root;
};
afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  host?.remove();
  host = undefined;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = track(createRoot(host));
  await act(async () => root.render(element));
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });
const click = async (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
const q = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const names = (layers: ReadonlyArray<EditorLayer>): string[] => layers.map((l) => l.id);

const tree = (): EditorLayer[] => [
  { id: "a", name: "A" },
  {
    id: "g",
    name: "Group",
    children: [
      { id: "g1", name: "G1" },
      { id: "g2", name: "G2" },
    ],
  },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
];

describe("zoom model", () => {
  it("clamps and steps through the steps", () => {
    expect(editorClampZoom(1000)).toBe(64);
    expect(editorClampZoom(0)).toBe(0.02);
    expect(editorClampZoom(Number.NaN)).toBe(1);
    expect(editorStepZoom(1, 1)).toBe(1.5);
    expect(editorStepZoom(1, -1)).toBe(0.75);
    expect(editorStepZoom(0.6, 1)).toBe(0.75);
    expect(editorStepZoom(0.6, -1)).toBe(0.5);
    expect(editorStepZoom(8, 1)).toBe(8);
    expect(editorStepZoom(1, 1, [1, 2], 0.5, 1.5)).toBe(1.5);
  });

  it("fits and fills a content", () => {
    expect(editorFitZoom({ w: 1000, h: 500 }, { w: 500, h: 500 })).toBe(0.5);
    expect(editorFitZoom({ w: 1000, h: 500 }, { w: 540, h: 540 }, 20)).toBe(0.5);
    expect(editorFillZoom({ w: 1000, h: 500 }, { w: 500, h: 500 })).toBe(1);
    expect(editorFitZoom({ w: 0, h: 0 }, { w: 500, h: 500 })).toBe(1);
  });

  it("writes and reads a percent", () => {
    expect(editorZoomText(1.5)).toBe("150%");
    expect(editorZoomText(0.05)).toBe("5%");
    expect(editorZoomText(0.025)).toBe("2.5%");
    expect(editorParseZoom("150%")).toBe(1.5);
    expect(editorParseZoom(" 12,5 ")).toBe(0.125);
    expect(editorParseZoom("abc")).toBeNull();
    expect(editorParseZoom("0")).toBeNull();
  });

  it("zooms around a point and projects both ways", () => {
    const view = { x: 100, y: 50, zoom: 2 };
    expect(editorProject({ x: 110, y: 60 }, view)).toEqual({ x: 20, y: 20 });
    expect(editorUnproject({ x: 20, y: 20 }, view)).toEqual({ x: 110, y: 60 });
    const anchor = { x: 40, y: 30 };
    const next = editorZoomAround(view, 4, anchor);
    expect(editorUnproject(anchor, next)).toEqual(editorUnproject(anchor, view));
  });
});

describe("minimap model", () => {
  const world: EditorRect = { x: 0, y: 0, w: 1000, h: 500 };

  it("fits the world, centred, and converts both ways", () => {
    const fit = editorMinimapFit(world, { w: 200, h: 200 });
    expect(fit).toEqual({ scale: 0.2, offsetX: 0, offsetY: 50 });
    expect(editorToMap({ x: 500, y: 250, w: 100, h: 50 }, world, fit)).toEqual({
      x: 100,
      y: 100,
      w: 20,
      h: 10,
    });
    expect(editorFromMap({ x: 100, y: 100 }, world, fit)).toEqual({ x: 500, y: 250 });
  });

  it("keeps the viewport's centre in the world", () => {
    const vp = { x: 0, y: 0, w: 200, h: 100 };
    expect(editorClampViewport({ ...vp, x: -500 }, world).x).toBe(-100);
    expect(editorClampViewport({ ...vp, x: 5000 }, world).x).toBe(900);
    expect(editorPanViewport(vp, 50, 20, world)).toEqual({ x: 50, y: 20, w: 200, h: 100 });
  });

  it("centres on a point and scales around the centre within limits", () => {
    const vp = { x: 0, y: 0, w: 200, h: 100 };
    expect(editorCenterViewport(vp, { x: 500, y: 250 }, world)).toEqual({
      x: 400,
      y: 200,
      w: 200,
      h: 100,
    });
    const bigger = editorScaleViewport(vp, 2, { minW: 50, maxW: 1000 }, world);
    expect(bigger).toEqual({ x: -100, y: -50, w: 400, h: 200 });
    expect(editorScaleViewport(vp, 100, { minW: 50, maxW: 300 }, world).w).toBe(300);
    expect(editorScaleViewport(vp, 0.001, { minW: 50, maxW: 300 }, world).w).toBe(50);
  });

  it("finds the bounds of items", () => {
    expect(editorBoundsOf([])).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(
      editorBoundsOf(
        [
          { x: 10, y: 10, w: 10, h: 10 },
          { x: 50, y: 0, w: 10, h: 5 },
        ],
        5,
      ),
    ).toEqual({ x: 5, y: -5, w: 60, h: 30 });
  });
});

describe("layer model", () => {
  it("flattens with depth, folding groups", () => {
    const rows = editorFlattenLayers(tree());
    expect(rows.map((r) => [r.layer.id, r.depth])).toEqual([
      ["a", 0],
      ["g", 0],
      ["g1", 1],
      ["g2", 1],
      ["b", 0],
      ["c", 0],
    ]);
    expect(editorFlattenLayers(tree(), new Set(["g"])).map((r) => r.layer.id)).toEqual([
      "a",
      "g",
      "b",
      "c",
    ]);
  });

  it("tells a hidden or locked parent to its children", () => {
    const layers: EditorLayer[] = [
      { id: "g", name: "G", visible: false, locked: true, children: [{ id: "x", name: "X" }] },
    ];
    const row = editorFlattenLayers(layers)[1]!;
    expect(row.hiddenByParent).toBe(true);
    expect(row.lockedByParent).toBe(true);
  });

  it("reorders among siblings, to the ends, and stays put at the edge", () => {
    expect(names(editorReorderLayer(tree(), "b", "up"))).toEqual(["a", "b", "g", "c"]);
    expect(names(editorReorderLayer(tree(), "b", "down"))).toEqual(["a", "g", "c", "b"]);
    expect(names(editorReorderLayer(tree(), "c", "top"))).toEqual(["c", "a", "g", "b"]);
    expect(names(editorReorderLayer(tree(), "a", "bottom"))).toEqual(["g", "b", "c", "a"]);
    const t = tree();
    expect(editorReorderLayer(t, "a", "up")).toBe(t);
    expect(editorReorderLayer(t, "c", "down")).toBe(t);
    const inGroup = editorReorderLayer(t, "g2", "up");
    expect(editorFindLayer(inGroup, "g")!.layer.children!.map((l) => l.id)).toEqual(["g2", "g1"]);
  });

  it("moves into a group and out, and refuses to go into itself", () => {
    const into = editorMoveLayer(tree(), "a", { parentId: "g", index: 1 });
    expect(editorFindLayer(into, "g")!.layer.children!.map((l) => l.id)).toEqual(["g1", "a", "g2"]);
    expect(names(into)).toEqual(["g", "b", "c"]);
    const t = tree();
    expect(editorMoveLayer(t, "g", { parentId: "g1", index: 0 })).toBe(t);
    expect(editorMoveLayer(t, "g", { parentId: "g", index: 0 })).toBe(t);
    expect(editorMoveLayer(t, "a", { parentId: "b", index: 0 })).toBe(t);
    expect(editorMoveLayer(t, "nope", { parentId: null, index: 0 })).toBe(t);
  });

  it("indents into the group above and outdents after its group", () => {
    const indented = editorIndentLayer(tree(), "b");
    expect(editorFindLayer(indented, "g")!.layer.children!.map((l) => l.id)).toEqual([
      "g1",
      "g2",
      "b",
    ]);
    const t = tree();
    expect(editorIndentLayer(t, "c")).toBe(t);
    expect(editorIndentLayer(t, "a")).toBe(t);
    const out = editorOutdentLayer(tree(), "g1");
    expect(names(out)).toEqual(["a", "g", "g1", "b", "c"]);
    expect(editorOutdentLayer(t, "a")).toBe(t);
  });

  it("drops before, after and inside, counting the lifted layer", () => {
    const rows = editorFlattenLayers(tree());
    const rowOf = (id: string) => rows.find((r) => r.layer.id === id)!;
    expect(names(editorDropLayer(tree(), "a", rowOf("b"), "after"))).toEqual(["g", "b", "a", "c"]);
    expect(names(editorDropLayer(tree(), "a", rowOf("b"), "before"))).toEqual(["g", "a", "b", "c"]);
    expect(names(editorDropLayer(tree(), "c", rowOf("a"), "before"))).toEqual(["c", "a", "g", "b"]);
    expect(
      editorFindLayer(editorDropLayer(tree(), "c", rowOf("g"), "inside"), "g")!.layer.children![0]!
        .id,
    ).toBe("c");
    const t = tree();
    expect(editorDropLayer(t, "a", rowOf("a"), "after")).toBe(t);
    expect(editorDropPlace(0.1, true)).toBe("before");
    expect(editorDropPlace(0.5, true)).toBe("inside");
    expect(editorDropPlace(0.5, false)).toBe("after");
    expect(editorDropPlace(0.9, true)).toBe("after");
  });

  it("selects one, several and a range", () => {
    const rows = editorFlattenLayers(tree());
    expect(editorSelectLayers(rows, ["a"], "b", "replace", null)).toEqual(["b"]);
    expect(editorSelectLayers(rows, ["a"], "b", "toggle", null)).toEqual(["a", "b"]);
    expect(editorSelectLayers(rows, ["a", "b"], "b", "toggle", null)).toEqual(["a"]);
    expect(editorSelectLayers(rows, ["a"], "g2", "range", "a")).toEqual(["a", "g", "g1", "g2"]);
    expect(editorSelectLayers(rows, [], "g", "range", "b")).toEqual(["g", "g1", "g2", "b"]);
  });

  it("updates a nested layer without touching the rest", () => {
    const t = tree();
    const next = editorUpdateLayer(t, "g1", { name: "Renamed", visible: false });
    expect(editorFindLayer(next, "g1")!.layer).toEqual({
      id: "g1",
      name: "Renamed",
      visible: false,
    });
    expect(next[0]).toBe(t[0]);
  });
});

describe("shortcut model", () => {
  const actions = [
    { id: "undo", label: "Undo", shortcut: "mod+z", group: "Edit" },
    {
      id: "tool",
      label: "Tools",
      actions: [{ id: "rect", label: "Rectangle", shortcut: "r" }],
      group: "Tools",
    },
    { id: "plain", label: "No key" },
  ];
  const entries = [
    ...editorShortcutEntries(actions),
    { id: "pan", label: "Pan", keys: ["Space", "drag"], group: "View", keywords: ["move", "hand"] },
  ];

  it("lists actions that have a key, nested ones in their group", () => {
    expect(editorShortcutEntries(actions).map((e) => [e.id, e.group])).toEqual([
      ["undo", "Edit"],
      ["rect", "Tools"],
    ]);
  });

  it("groups by section and reads keys for the platform", () => {
    const mac = editorGroupShortcuts(entries, "", { mac: true });
    expect(mac.map((s) => s.name)).toEqual(["Edit", "Tools", "View"]);
    expect(mac[0]!.items[0]!.keys).toEqual(["⌘", "Z"]);
    expect(editorGroupShortcuts(entries, "", { mac: false })[0]!.items[0]!.keys).toEqual([
      "Ctrl",
      "Z",
    ]);
  });

  it("searches label, section, keywords and keys, all words", () => {
    expect(editorGroupShortcuts(entries, "rect")[0]!.items[0]!.id).toBe("rect");
    expect(editorGroupShortcuts(entries, "hand")[0]!.items[0]!.id).toBe("pan");
    expect(editorGroupShortcuts(entries, "edit z")[0]!.items[0]!.id).toBe("undo");
    expect(editorGroupShortcuts(entries, "space")).toHaveLength(1);
    expect(editorGroupShortcuts(entries, "zzzz")).toEqual([]);
  });

  it("puts entries with no group in the fallback section", () => {
    expect(editorGroupShortcuts([{ id: "x", label: "X", shortcut: "x" }])[0]!.name).toBe("General");
  });
});

describe("tour model", () => {
  const viewport = { w: 1000, h: 800 };
  const popup = { w: 320, h: 160 };

  it("sits on the preferred side, centred on the target, arrow on its centre", () => {
    const target = { x: 400, y: 300, w: 100, h: 40 };
    const place = editorTourPlacement(target, popup, viewport, "bottom");
    expect(place.side).toBe("bottom");
    expect(place.y).toBe(352);
    expect(place.x + place.arrow).toBe(450);
  });

  it("flips when there is no room and clamps inside the viewport", () => {
    const low = editorTourPlacement({ x: 400, y: 700, w: 100, h: 40 }, popup, viewport, "bottom");
    expect(low.side).toBe("top");
    expect(low.y).toBe(700 - 12 - 160);
    const edge = editorTourPlacement({ x: 0, y: 300, w: 20, h: 20 }, popup, viewport, "bottom");
    expect(edge.x).toBe(8);
    expect(edge.arrow).toBe(12);
    const right = editorTourPlacement({ x: 980, y: 300, w: 20, h: 20 }, popup, viewport, "right");
    expect(right.side).not.toBe("right");
  });

  it("centres without a target or when nothing fits", () => {
    expect(editorTourPlacement(null, popup, viewport)).toEqual({
      side: "center",
      x: 340,
      y: 320,
      arrow: 0,
    });
    const tiny = { w: 340, h: 200 };
    expect(editorTourPlacement({ x: 10, y: 10, w: 320, h: 180 }, popup, tiny).side).toBe("center");
  });

  it("keeps the step in range", () => {
    expect(editorTourIndex(0, -1, 3)).toBe(0);
    expect(editorTourIndex(2, 1, 3)).toBe(2);
    expect(editorTourIndex(1, 1, 3)).toBe(2);
    expect(editorTourIndex(0, 1, 0)).toBe(0);
  });
});

describe("checklist and style model", () => {
  it("counts progress and finds the next step", () => {
    const steps = [{ done: true }, { done: false }, {}];
    expect(editorChecklistProgress(steps)).toEqual({
      done: 1,
      total: 3,
      ratio: 1 / 3,
      complete: false,
    });
    expect(editorChecklistProgress([])).toEqual({ done: 0, total: 0, ratio: 0, complete: false });
    expect(editorChecklistProgress([{ done: true }]).complete).toBe(true);
    expect(editorNextStep(steps)).toBe(steps[1]);
    expect(editorNextStep([{ done: true }])).toBeNull();
  });

  it("scales dashes with the width", () => {
    expect(editorDashArray("solid", 4)).toBeUndefined();
    expect(editorDashArray("dashed", 2)).toBe("8 6");
    expect(editorDashArray("dotted", 3)).toBe("3 6");
    expect(editorDashArray("dotted", 0)).toBe("1 2");
  });

  it("has 4 x 4 dither patterns with growing density", () => {
    for (const rows of Object.values(EDITOR_FILL_PATTERNS)) {
      expect(rows).toHaveLength(4);
      expect(rows.every((r) => r.length === 4)).toBe(true);
    }
    expect(editorPatternCells("dots-50")).toHaveLength(8);
    expect(editorPatternCells("nope")).toEqual([]);
    expect(editorPatternDensity("dots-25")).toBeLessThan(editorPatternDensity("dots-50"));
    expect(editorPatternDensity("dots-50")).toBeLessThan(editorPatternDensity("dots-75"));
  });

  it("picks an ink and a person's colour", () => {
    expect(editorInkOn("#ffffff")).toBe("#0a0a0a");
    expect(editorInkOn("#000000")).toBe("#ffffff");
    expect(editorInkOn("nope")).toBe("#0a0a0a");
    expect(editorPresenceTone("ana")).toEqual(editorPresenceTone("ana"));
    expect(editorPresenceTone("ana", "#112233")).toEqual({ color: "#112233", ink: "#ffffff" });
  });
});

describe("CanvasToolbar", () => {
  const tools = [
    { id: "select", label: "Select", icon: Square01Icon, shortcut: "v", group: "pointer" },
    {
      id: "shape",
      label: "Shape",
      icon: Square01Icon,
      shortcut: "r",
      group: "draw",
      variants: [
        { id: "rect", label: "Rectangle", icon: Square01Icon },
        { id: "ellipse", label: "Ellipse", icon: Square01Icon, shortcut: "o" },
      ],
    },
    { id: "text", label: "Text", icon: Square01Icon, shortcut: "t", group: "draw", disabled: true },
  ];

  it("shows the active tool as pressed and changes it on click", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(CanvasToolbar, { label: "Tools", tools, defaultValue: "select", onChange }),
    );
    const bar = q('[role="toolbar"]', el)!;
    expect(bar.getAttribute("aria-label")).toBe("Tools");
    const select = q('[aria-label="Select"]', el)!;
    const shape = [...el.querySelectorAll("button")].find((b) =>
      b.getAttribute("aria-label")?.startsWith("Shape,"),
    )!;
    expect(select.getAttribute("aria-pressed")).toBe("true");
    expect(shape.getAttribute("aria-pressed")).toBe("false");
    await click(shape);
    expect(onChange).toHaveBeenCalledWith("shape");
    expect(shape.getAttribute("aria-pressed")).toBe("true");
    expect(select.getAttribute("aria-pressed")).toBe("false");
  });

  it("marks a disabled tool and does not pick it", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(CanvasToolbar, { label: "Tools", tools, defaultValue: "select", onChange }),
    );
    const text = q('[aria-label="Text"]', el)!;
    expect(text.hasAttribute("data-disabled") || text.hasAttribute("disabled")).toBe(true);
    await click(text);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("picks a tool by its key, a variant by its own, and not while typing", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const onVariantChange = vi.fn<(...args: unknown[]) => void>();
    await mount(
      h(CanvasToolbar, {
        label: "Tools",
        tools,
        defaultValue: "select",
        onChange,
        onVariantChange,
      }),
    );
    await key(document.body, "r");
    expect(onChange).toHaveBeenLastCalledWith("shape");
    await key(document.body, "o");
    expect(onVariantChange).toHaveBeenCalledWith("shape", "ellipse");
    onChange.mockClear();
    await key(document.body, "t");
    expect(onChange).not.toHaveBeenCalled();
    const input = document.createElement("input");
    document.body.append(input);
    await key(input, "v");
    input.remove();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("turns off the keys with shortcuts=false and hints undo / redo state", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const onUndo = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(CanvasToolbar, {
        label: "Tools",
        tools,
        defaultValue: "select",
        onChange,
        shortcuts: false,
        onUndo,
        onRedo: vi.fn<(...args: unknown[]) => void>(),
        canRedo: false,
      }),
    );
    await key(document.body, "r");
    expect(onChange).not.toHaveBeenCalled();
    expect(
      q('[aria-label="Redo"]', el)!.hasAttribute("data-disabled") ||
        q('[aria-label="Redo"]', el)!.hasAttribute("disabled"),
    ).toBe(true);
    await click(q('[aria-label="Undo"]', el)!);
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("lays out vertically", () => {
    const out = html(h(CanvasToolbar, { label: "Tools", tools, orientation: "vertical" }));
    expect(out).toContain("fg-toolbar-v");
    expect(out).toContain('aria-orientation="vertical"');
  });
});

describe("ZoomControls", () => {
  it("steps with the buttons and shows the percent", async () => {
    const onZoomChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(ZoomControls, { zoom: 1, onZoomChange }));
    expect(q(".fg-edt-zvalue", el)!.textContent).toBe("100%");
    await click(q('[aria-label="Zoom in"]', el)!);
    expect(onZoomChange).toHaveBeenLastCalledWith(1.5);
    await click(q('[aria-label="Zoom out"]', el)!);
    expect(onZoomChange).toHaveBeenLastCalledWith(0.75);
  });

  it("disables a button at its limit", async () => {
    const el = await mount(
      h(ZoomControls, { zoom: 8, max: 8, onZoomChange: vi.fn<(...args: unknown[]) => void>() }),
    );
    expect((q('[aria-label="Zoom in"]', el) as HTMLButtonElement).disabled).toBe(true);
  });

  it("binds its shortcuts only when asked", async () => {
    const onZoomChange = vi.fn<(...args: unknown[]) => void>();
    const onFit = vi.fn<(...args: unknown[]) => void>();
    await mount(h(ZoomControls, { zoom: 1, onZoomChange, onFit }));
    await key(document.body, "0", { ctrlKey: true, metaKey: true });
    expect(onZoomChange).not.toHaveBeenCalled();
    host?.remove();
    const again = vi.fn<(...args: unknown[]) => void>();
    await mount(h(ZoomControls, { zoom: 2, onZoomChange: again, onFit, bindShortcuts: true }));
    await key(document.body, "0", { metaKey: true });
    await key(document.body, "0", { ctrlKey: true });
    expect(again).toHaveBeenCalledWith(1);
    await key(document.body, "!", { shiftKey: true });
    expect(onFit).toHaveBeenCalledTimes(1);
  });
});

describe("Minimap", () => {
  const items = [
    { id: "i1", x: 0, y: 0, w: 400, h: 300 },
    { id: "i2", x: 600, y: 300, w: 400, h: 200, tone: "accent" as const },
  ];
  const world = { x: 0, y: 0, w: 1000, h: 500 };

  const setup = async (onViewportChange?: (v: EditorRect) => void) => {
    const el = await mount(
      h(Minimap, {
        label: "Overview",
        items,
        world,
        viewport: { x: 100, y: 100, w: 200, h: 100 },
        width: 200,
        height: 100,
        ...(onViewportChange ? { onViewportChange } : {}),
      }),
    );
    return { el, frame: q('[role="application"]', el)! };
  };

  it("draws the items and the viewport frame", async () => {
    const { el, frame } = await setup();
    expect(el.querySelectorAll(".fg-edt-map-item")).toHaveLength(2);
    expect(frame.getAttribute("aria-label")).toBe("Overview");
    expect(frame.style.left).toBe("20px");
    expect(frame.style.width).toBe("40px");
  });

  it("pans by the arrows, bigger with Shift, and zooms with + and −", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const { frame } = await setup(onChange);
    await key(frame, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith({ x: 120, y: 100, w: 200, h: 100 });
    await key(frame, "ArrowDown", { shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith({ x: 100, y: 200, w: 200, h: 100 });
    await key(frame, "-");
    expect(onChange).toHaveBeenLastCalledWith({ x: 75, y: 87.5, w: 250, h: 125 });
    await key(frame, "Home");
    expect(onChange).toHaveBeenLastCalledWith({ x: 400, y: 200, w: 200, h: 100 });
  });

  it("does nothing by key without a handler, and has no handle", async () => {
    const { el, frame } = await setup();
    await key(frame, "ArrowRight");
    expect(q(".fg-edt-map-handle", el)).toBeNull();
  });

  it("has a handle to resize when live", async () => {
    const { el } = await setup(vi.fn<(...args: unknown[]) => void>());
    expect(q(".fg-edt-map-handle", el)).not.toBeNull();
  });
});

describe("LayersPanel", () => {
  const mountPanel = async (extra: Record<string, unknown> = {}) => {
    const log: EditorLayer[][] = [];
    const picks: string[][] = [];
    function Host() {
      const [layers, setLayers] = useState<EditorLayer[]>(tree());
      return h(LayersPanel, {
        label: "Layers",
        layers,
        onChange: (next: EditorLayer[]) => {
          log.push(next);
          setLayers(next);
        },
        onSelectedChange: (ids: string[]) => picks.push(ids),
        ...extra,
      });
    }
    const el = await mount(h(Host));
    const row = (id: string) => q(`[data-lid="${id}"]`, el)!;
    return { el, row, log, picks };
  };

  it("is a multiselectable tree with levels and a tab stop", async () => {
    const { el, row } = await mountPanel();
    const root = q('[role="tree"]', el)!;
    expect(root.getAttribute("aria-multiselectable")).toBe("true");
    expect(row("g").getAttribute("aria-expanded")).toBe("true");
    expect(row("g1").getAttribute("aria-level")).toBe("2");
    expect(row("b").getAttribute("aria-posinset")).toBe("3");
    expect(row("b").getAttribute("aria-setsize")).toBe("4");
    expect(el.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
  });

  it("selects with click, Ctrl click and Shift click", async () => {
    const { row, picks } = await mountPanel();
    await click(row("a"));
    await act(async () => {
      row("b").dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    });
    expect(picks.at(-1)).toEqual(["a", "b"]);
    await act(async () => {
      row("c").dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    });
    expect(picks.at(-1)).toEqual(["b", "c"]);
    expect(row("c").getAttribute("aria-selected")).toBe("true");
  });

  it("moves the focus with arrows and folds a group with the left arrow", async () => {
    const { row } = await mountPanel();
    row("a").focus();
    await key(row("a"), "ArrowDown");
    expect(document.activeElement).toBe(row("g"));
    await key(row("g"), "ArrowLeft");
    expect(row("g").getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[data-lid="g1"]')).toBeNull();
    await key(row("g"), "ArrowRight");
    expect(row("g").getAttribute("aria-expanded")).toBe("true");
    await key(row("g"), "ArrowRight");
    expect(document.activeElement).toBe(row("g1"));
    await key(row("g1"), "ArrowLeft");
    expect(document.activeElement).toBe(row("g"));
  });

  it("reorders with Alt and the arrows, and the focus follows", async () => {
    const { row, log } = await mountPanel();
    row("b").focus();
    await key(row("b"), "ArrowUp", { altKey: true });
    expect(names(log.at(-1)!)).toEqual(["a", "b", "g", "c"]);
    expect(document.activeElement).toBe(row("b"));
    await key(row("b"), "End", { altKey: true });
    expect(names(log.at(-1)!)).toEqual(["a", "g", "c", "b"]);
    await key(row("b"), "Home", { altKey: true });
    expect(names(log.at(-1)!)).toEqual(["b", "a", "g", "c"]);
  });

  it("indents into a group and outdents with Alt and the side arrows", async () => {
    const { row, log } = await mountPanel();
    row("b").focus();
    await key(row("b"), "ArrowRight", { altKey: true });
    expect(editorFindLayer(log.at(-1)!, "b")!.parentId).toBe("g");
    await key(row("b"), "ArrowLeft", { altKey: true });
    expect(editorFindLayer(log.at(-1)!, "b")!.parentId).toBeNull();
  });

  it("toggles visibility and lock from the buttons and keys, and not in read-only", async () => {
    const { el, row, log } = await mountPanel();
    await click(q('[aria-label="Hide A"]', el)!);
    expect(editorFindLayer(log.at(-1)!, "a")!.layer.visible).toBe(false);
    expect(row("a").getAttribute("aria-label")).toContain("hidden");
    row("b").focus();
    await key(row("b"), "l");
    expect(editorFindLayer(log.at(-1)!, "b")!.layer.locked).toBe(true);
    const ro = await mountPanel({ readOnly: true });
    expect((q('[aria-label="Hide A"]', ro.el) as HTMLButtonElement).disabled).toBe(true);
    ro.row("b").focus();
    await key(ro.row("b"), "ArrowUp", { altKey: true });
    expect(ro.log).toHaveLength(0);
  });

  it("does not move a locked layer", async () => {
    const { row, log } = await mountPanel({
      layers: [
        { id: "x", name: "X", locked: true },
        { id: "y", name: "Y" },
      ],
      onChange: undefined,
    });
    void log;
    expect(row("x").getAttribute("draggable")).toBe("false");
    expect(row("y").getAttribute("draggable")).toBe("true");
  });

  it("renames in place: F2, Enter keeps, Escape cancels", async () => {
    const { el, row, log } = await mountPanel();
    row("a").focus();
    await key(row("a"), "F2");
    const input = q<HTMLInputElement>(".fg-edt-layer-input", el)!;
    expect(input.value).toBe("A");
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "Hero");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await key(input, "Enter");
    expect(editorFindLayer(log.at(-1)!, "a")!.layer.name).toBe("Hero");
    await key(row("a"), "F2");
    const again = q<HTMLInputElement>(".fg-edt-layer-input", el)!;
    await key(again, "Escape");
    expect(q(".fg-edt-layer-input", el)).toBeNull();
    expect(editorFindLayer(log.at(-1)!, "a")!.layer.name).toBe("Hero");
  });

  it("writes an empty state", () => {
    expect(html(h(LayersPanel, { label: "Layers", layers: [] }))).toContain("No layers yet.");
  });
});

describe("CommentPin and PinLayer", () => {
  it("names the pin with number, state and unread, never by colour alone", () => {
    expect(html(h(CommentPin, { number: 3 }))).toContain('aria-label="Comment 3, open"');
    const resolved = html(
      h(CommentPin, { number: 4, state: "resolved", unread: true, author: "Ana" }),
    );
    expect(resolved).toContain("Comment 4 by Ana, resolved, unread");
    expect(resolved).toContain("fg-edt-pin-resolved");
  });

  const pins = [
    { id: "p1", x: 10, y: 20, author: "Ana", preview: "Looks off" },
    { id: "p2", x: 30, y: 40, resolved: true },
  ];

  it("places pins from the view and opens one thread at a time", async () => {
    const onOpenChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(PinLayer, {
        label: "Comments",
        pins,
        view: { x: 0, y: 0, zoom: 2 },
        onOpenChange,
        renderThread: (pin: { id: string }) => h("p", { className: "thread" }, `Thread ${pin.id}`),
      }),
    );
    const at = el.querySelectorAll<HTMLElement>(".fg-edt-pin-at");
    expect(at[0]!.style.left).toBe("20px");
    expect(at[0]!.style.top).toBe("40px");
    expect(el.querySelectorAll(".fg-edt-pin")).toHaveLength(2);
    await click(q('[aria-label^="Comment 1"]', el)!);
    expect(onOpenChange).toHaveBeenLastCalledWith("p1");
    expect(q(".thread")!.textContent).toBe("Thread p1");
    expect(q('[aria-label^="Comment 1"]', el)!.getAttribute("aria-expanded")).toBe("true");
  });

  it("hides resolved pins on request", async () => {
    const el = await mount(h(PinLayer, { label: "Comments", pins, hideResolved: true }));
    expect(el.querySelectorAll(".fg-edt-pin")).toHaveLength(1);
  });
});

describe("CursorPresence", () => {
  const cursors = [
    { id: "ana", name: "Ana", x: 10, y: 10, color: "#ff4f1f" },
    { id: "bo", name: "Bo", selection: { x: 20, y: 20, w: 40, h: 30 }, status: "typing" },
  ];

  it("always writes the name, in a list for assistive technology too", () => {
    const out = html(h(CursorPresence, { label: "People here", cursors }));
    expect(out).toContain("Ana");
    expect(out).toContain("Bo");
    expect(out).toContain('aria-label="People here"');
    expect(out).toContain("typing");
  });

  it("projects with the view and scales a selection", async () => {
    const el = await mount(
      h(CursorPresence, { label: "People", cursors, view: { x: 5, y: 5, zoom: 2 } }),
    );
    expect(q<HTMLElement>(".fg-edt-cursor", el)!.style.transform).toBe("translate(10px, 10px)");
    const sel = q<HTMLElement>(".fg-edt-sel", el)!;
    expect(sel.style.transform).toBe("translate(30px, 30px)");
    expect(sel.style.width).toBe("80px");
  });

  it("can be silent for assistive technology", () => {
    expect(html(h(CursorPresence, { label: "People", cursors, announce: false }))).not.toContain(
      "<ul",
    );
  });
});

describe("StrokePicker and FillPicker", () => {
  it("shows the fields asked for", () => {
    const all = html(h(StrokePicker, { label: "Stroke" }));
    for (const w of [
      "Stroke colour",
      "Stroke width",
      "Stroke style",
      "Stroke ends",
      "Stroke opacity",
    ])
      expect(all).toContain(w);
    const some = html(h(StrokePicker, { label: "Stroke", fields: ["width"], preview: false }));
    expect(some).toContain("Stroke width");
    expect(some).not.toContain("Stroke ends");
    expect(some).not.toContain("fg-edt-style-preview");
  });

  it("changes dash and cap and reports the whole value", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(StrokePicker, { label: "Stroke", onChange }));
    await click(q('[aria-label="Dashed"]', el)!);
    expect(onChange).toHaveBeenLastCalledWith({
      color: "#ededed",
      width: 2,
      dash: "dashed",
      cap: "butt",
      opacity: 1,
    });
    const round = [...el.querySelectorAll("button")].find((b) => b.textContent === "Round")!;
    await click(round);
    expect(onChange.mock.lastCall![0]).toMatchObject({ dash: "dashed", cap: "round" });
    expect(q("line", q(".fg-edt-style-preview", el)!)!.getAttribute("stroke-dasharray")).toBe(
      "8 6",
    );
  });

  it("switches the fill between none, solid and pattern", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(FillPicker, { label: "Fill", onChange }));
    expect(el.textContent).toContain("No fill");
    const seg = (name: string) =>
      [...el.querySelectorAll("button")].find((b) => b.textContent === name)!;
    await click(seg("Solid"));
    expect(onChange).toHaveBeenLastCalledWith({ type: "solid", color: "#ff4f1f" });
    await click(seg("Pattern"));
    expect(onChange.mock.lastCall![0]).toMatchObject({ type: "pattern", pattern: "dots-25" });
    const radios = el.querySelectorAll('[role="radio"]');
    expect(radios.length).toBe(Object.keys(EDITOR_FILL_PATTERNS).length);
    await click(radios[2]!);
    expect(onChange.mock.lastCall![0]).toMatchObject({ pattern: "dots-75" });
    expect(radios[2]!.getAttribute("aria-checked")).toBe("true");
  });
});

describe("ShortcutsSheet", () => {
  const actions = [
    { id: "undo", label: "Undo", shortcut: "mod+z", group: "Edit" },
    { id: "rect", label: "Rectangle", shortcut: "r", group: "Tools" },
  ];

  it("renders nothing while closed and opens on ?", async () => {
    const onOpenChange = vi.fn<(...args: unknown[]) => void>();
    await mount(h(ShortcutsSheet, { actions, onOpenChange }));
    expect(q('[role="dialog"]')).toBeNull();
    await key(document.body, "?", { shiftKey: true });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(q('[role="dialog"]')).not.toBeNull();
  });

  it("lists sections and keys, and filters by search", async () => {
    await mount(
      h(ShortcutsSheet, {
        actions,
        defaultOpen: true,
        mac: false,
        entries: [{ id: "pan", label: "Pan", keys: ["Space"], group: "View" }],
      }),
    );
    const dialog = q('[role="dialog"]')!;
    expect(dialog.textContent).toContain("Edit");
    expect(dialog.textContent).toContain("Ctrl");
    expect(dialog.querySelectorAll(".fg-edt-sheet-sec")).toHaveLength(3);
    const input = q<HTMLInputElement>('input[type="search"]', dialog)!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        input,
        "rect",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(dialog.querySelectorAll(".fg-edt-sheet-sec")).toHaveLength(1);
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "zzz");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(dialog.textContent).toContain("No shortcut matches");
  });

  it("closes on Escape", async () => {
    const onOpenChange = vi.fn<(...args: unknown[]) => void>();
    await mount(h(ShortcutsSheet, { actions, defaultOpen: true, onOpenChange }));
    await key(q('[role="dialog"]')!, "Escape");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(q('[role="dialog"]')).toBeNull();
  });
});

describe("Tour", () => {
  const steps = [
    { id: "s1", target: "#tour-a", title: "First", body: "About A" },
    { id: "s2", target: "#tour-b", title: "Second" },
    { id: "s3", title: "Last, no target" },
  ];
  const withTargets = async (props: Record<string, unknown> = {}) => {
    host = document.createElement("div");
    document.body.append(host);
    const a = document.createElement("button");
    a.id = "tour-a";
    a.textContent = "A";
    const b = document.createElement("button");
    b.id = "tour-b";
    host.append(a, b);
    const mountPoint = document.createElement("div");
    host.append(mountPoint);
    const root = track(createRoot(mountPoint));
    await act(async () =>
      root.render(h(Tour, { label: "Tour", steps, defaultOpen: true, ...props })),
    );
    return { a, b };
  };

  it("shows the first step as a dialog with progress, and focuses it", async () => {
    await withTargets();
    const card = q('[role="dialog"]')!;
    expect(card.getAttribute("aria-label")).toBe("Tour");
    expect(card.textContent).toContain("First");
    expect(card.textContent).toContain("Step 1 of 3");
    expect(card.querySelectorAll(".fg-edt-tour-dot")).toHaveLength(3);
    expect(card.querySelector('[aria-current="step"]')).not.toBeNull();
    expect(document.activeElement).toBe(card);
    expect(q(".fg-edt-tour-lit")).not.toBeNull();
  });

  it("walks next and back and finishes on the last step", async () => {
    const onStepChange = vi.fn<(...args: unknown[]) => void>();
    const onFinish = vi.fn<(...args: unknown[]) => void>();
    await withTargets({ onStepChange, onFinish });
    const btn = (t: string) =>
      [...document.querySelectorAll<HTMLElement>(".fg-edt-tour button")].find((b) =>
        b.textContent?.includes(t),
      )!;
    await click(btn("Next"));
    expect(onStepChange).toHaveBeenLastCalledWith(1);
    expect(q('[role="dialog"]')!.textContent).toContain("Second");
    await click(btn("Back"));
    expect(q('[role="dialog"]')!.textContent).toContain("First");
    await click(btn("Next"));
    await click(btn("Next"));
    expect(q('[role="dialog"]')!.textContent).toContain("Last, no target");
    expect(q(".fg-edt-tour-lit")).toBeNull();
    expect(q(".fg-edt-tour-dim")).not.toBeNull();
    await click(btn("Done"));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(q('[role="dialog"]')).toBeNull();
  });

  it("skips with Escape and the Skip button, reporting the step", async () => {
    const onSkip = vi.fn<(...args: unknown[]) => void>();
    await withTargets({ onSkip, defaultStep: 1 });
    await key(q('[role="dialog"]')!, "Escape");
    expect(onSkip).toHaveBeenCalledWith(1);
    expect(q('[role="dialog"]')).toBeNull();
  });

  it("moves with the arrow keys from the card", async () => {
    await withTargets();
    const card = q('[role="dialog"]')!;
    await key(card, "ArrowRight");
    expect(q('[role="dialog"]')!.textContent).toContain("Second");
    await key(q('[role="dialog"]')!, "ArrowLeft");
    expect(q('[role="dialog"]')!.textContent).toContain("First");
  });

  it("returns the focus to what had it", async () => {
    host = document.createElement("div");
    document.body.append(host);
    const opener = document.createElement("button");
    host.append(opener);
    opener.focus();
    const mountPoint = document.createElement("div");
    host.append(mountPoint);
    const root = track(createRoot(mountPoint));
    await act(async () => root.render(h(Tour, { label: "Tour", steps, open: true })));
    expect(document.activeElement).toBe(q('[role="dialog"]'));
    await act(async () => root.render(h(Tour, { label: "Tour", steps, open: false })));
    expect(document.activeElement).toBe(opener);
  });

  it("centres a step whose target is missing", async () => {
    await withTargets({ steps: [{ id: "x", target: "#nope", title: "Lost" }] });
    expect(q('[role="dialog"]')!.getAttribute("data-side")).toBe("center");
  });
});

describe("OnboardingChecklist", () => {
  const steps = [
    { id: "s1", title: "Create a board", done: true },
    {
      id: "s2",
      title: "Invite someone",
      description: "Share the link",
      action: { label: "Invite", onClick: vi.fn<(...args: unknown[]) => void>() },
    },
    { id: "s3", title: "Add a comment" },
  ];

  it("shows progress, marks the next step and says done steps are done", async () => {
    const el = await mount(
      h(OnboardingChecklist, {
        title: "Get started",
        steps,
        onMarkDone: vi.fn<(...args: unknown[]) => void>(),
      }),
    );
    expect(q(".fg-edt-check-count", el)!.textContent).toBe("1/3");
    expect(q('[role="progressbar"]', el)!.getAttribute("aria-valuenow")).toBe("1");
    expect(q('[aria-current="step"]', el)!.textContent).toContain("Invite someone");
    expect(el.textContent).toContain("(done)");
  });

  it("reports mark done, undo, the action and dismiss", async () => {
    const onMarkDone = vi.fn<(...args: unknown[]) => void>();
    const onMarkUndone = vi.fn<(...args: unknown[]) => void>();
    const onDismiss = vi.fn<(...args: unknown[]) => void>();
    const onClick = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(OnboardingChecklist, {
        title: "Get started",
        steps: [steps[0]!, { ...steps[1]!, action: { label: "Invite", onClick } }, steps[2]!],
        onMarkDone,
        onMarkUndone,
        onDismiss,
      }),
    );
    await click(q('[aria-label="Mark “Add a comment” as done"]', el)!);
    expect(onMarkDone).toHaveBeenCalledWith("s3");
    await click(q('[aria-label="Mark “Create a board” as not done"]', el)!);
    expect(onMarkUndone).toHaveBeenCalledWith("s1");
    await click([...el.querySelectorAll("button")].find((b) => b.textContent === "Invite")!);
    expect(onClick).toHaveBeenCalled();
    await click(q('[aria-label="Dismiss Get started"]', el)!);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("collapses to its header", async () => {
    const onCollapsedChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(OnboardingChecklist, { title: "Get started", steps, onCollapsedChange }),
    );
    const toggle = q(".fg-edt-check-toggle", el)!;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await click(toggle);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(q<HTMLElement>(".fg-edt-check-body", el)!.hidden).toBe(true);
  });

  it("says when everything is done", async () => {
    const el = await mount(
      h(OnboardingChecklist, {
        title: "Get started",
        steps: [{ id: "a", title: "A", done: true }],
        completeMessage: "Well done",
      }),
    );
    expect(el.textContent).toContain("Well done");
  });
});
