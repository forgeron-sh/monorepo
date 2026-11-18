import { describe, expect, it } from "vitest";
import {
  containsBounds,
  intersects,
  pointInPolygon,
  rectFromPoints,
  unionBounds,
} from "./geometry";
import { gridOffset, gridStep, snap, snapBounds } from "./grid";
import {
  handleAt,
  hitTest,
  itemsInLasso,
  itemsInRect,
  nearestInDirection,
  readingOrder,
  resizeBounds,
} from "./hit";
import { applySelection, pruneSelection, sameSelection } from "./selection";
import { CanvasFormatError, deserialize, serialize } from "./serialize";
import { gestureFor, type PressInput } from "./tools";
import type { Item } from "./types";
import {
  clampZoom,
  fitBounds,
  lerpViewport,
  screenToWorld,
  stepZoom,
  visibleWorld,
  worldToScreen,
  zoomAt,
} from "./viewport";

const item = (id: string, x: number, y: number, w = 100, h = 60, z = 0, extra = {}): Item => ({
  id,
  kind: "box",
  bounds: { x, y, w, h },
  z,
  data: null,
  ...extra,
});

describe("geometry", () => {
  it("builds a rectangle from two corners in any order", () => {
    expect(rectFromPoints({ x: 10, y: 40 }, { x: 0, y: 0 })).toEqual({ x: 0, y: 0, w: 10, h: 40 });
  });
  it("tells overlap and containment apart", () => {
    const a = { x: 0, y: 0, w: 100, h: 100 };
    expect(intersects(a, { x: 90, y: 90, w: 20, h: 20 })).toBe(true);
    expect(containsBounds(a, { x: 90, y: 90, w: 20, h: 20 })).toBe(false);
    expect(containsBounds(a, { x: 10, y: 10, w: 20, h: 20 })).toBe(true);
    expect(intersects(a, { x: 101, y: 0, w: 5, h: 5 })).toBe(false);
  });
  it("unions bounds, null when empty", () => {
    expect(unionBounds([])).toBeNull();
    expect(
      unionBounds([
        { x: 0, y: 0, w: 10, h: 10 },
        { x: 20, y: -5, w: 5, h: 5 },
      ]),
    ).toEqual({ x: 0, y: -5, w: 25, h: 15 });
  });
  it("finds a point inside a polygon", () => {
    const tri = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];
    expect(pointInPolygon({ x: 10, y: 10 }, tri)).toBe(true);
    expect(pointInPolygon({ x: 90, y: 90 }, tri)).toBe(false);
  });
});

describe("viewport", () => {
  const v = { x: 100, y: 50, zoom: 2 };
  it("goes from screen to world and back", () => {
    const w = screenToWorld(v, { x: 300, y: 250 });
    expect(w).toEqual({ x: 100, y: 100 });
    expect(worldToScreen(v, w)).toEqual({ x: 300, y: 250 });
  });
  it("zooms around a point that stays put, on whole pixels", () => {
    const anchor = { x: 400, y: 300 };
    const before = screenToWorld(v, anchor);
    const next = zoomAt(v, 3, anchor);
    expect(next.zoom).toBe(3);
    const after = worldToScreen(next, before);
    expect(Math.abs(after.x - anchor.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.y - anchor.y)).toBeLessThanOrEqual(1);
    expect(Number.isInteger(next.x) && Number.isInteger(next.y)).toBe(true);
  });
  it("clamps the zoom", () => {
    expect(clampZoom(10)).toBe(4);
    expect(clampZoom(0.01)).toBe(0.1);
    expect(zoomAt(v, 100, { x: 0, y: 0 }).zoom).toBe(4);
  });
  it("steps through the presets", () => {
    expect(stepZoom(1, 1)).toBe(1.5);
    expect(stepZoom(1, -1)).toBe(0.75);
    expect(stepZoom(1.2, 1)).toBe(1.5);
    expect(stepZoom(1.2, -1)).toBe(1);
    expect(stepZoom(4, 1)).toBe(4);
    expect(stepZoom(0.1, -1)).toBe(0.1);
  });
  it("fits a rectangle in view, centred, without zooming past the cap", () => {
    const size = { w: 800, h: 600 };
    const fit = fitBounds({ x: 0, y: 0, w: 1360, h: 480 }, size, { padding: 40 });
    expect(fit.zoom).toBeCloseTo(0.529, 2);
    const shown = visibleWorld(fit, size);
    expect(shown.x).toBeLessThanOrEqual(0);
    expect(shown.x + shown.w).toBeGreaterThanOrEqual(1360);
    expect(fitBounds({ x: 0, y: 0, w: 10, h: 10 }, size).zoom).toBe(1);
  });
  it("interpolates in log zoom", () => {
    const mid = lerpViewport({ x: 0, y: 0, zoom: 1 }, { x: 100, y: 0, zoom: 4 }, 0.5);
    expect(mid.zoom).toBeCloseTo(2);
    expect(mid.x).toBe(50);
  });
});

describe("grid", () => {
  it("snaps values and bounds", () => {
    expect(snap(29, 20)).toBe(20);
    expect(snap(31, 20)).toBe(40);
    expect(snap(7, 0)).toBe(7);
    expect(snapBounds({ x: 9, y: 11, w: 3, h: 50 }, 20)).toEqual({ x: 0, y: 20, w: 20, h: 40 });
  });
  it("doubles the drawn step until dots are far enough apart", () => {
    expect(gridStep(20, 1)).toBe(20);
    expect(gridStep(20, 0.5)).toBe(20);
    expect(gridStep(20, 0.25)).toBe(20);
    expect(gridStep(20, 0.1)).toBe(16);
    expect(gridOffset(-25, 20)).toBe(15);
  });
});

describe("hit testing", () => {
  const items = [item("a", 0, 0, 100, 100, 0), item("b", 50, 50, 100, 100, 1)];
  it("finds the top-most item", () => {
    expect(hitTest(items, { x: 60, y: 60 })?.id).toBe("b");
    expect(hitTest(items, { x: 10, y: 10 })?.id).toBe("a");
    expect(hitTest(items, { x: 500, y: 500 })).toBeNull();
  });
  it("asks the kind's own hit test and skips what is not selectable", () => {
    const kinds = {
      box: { hitTest: (i: Item, p: { x: number }) => p.x < i.bounds.x + 10 },
    };
    expect(hitTest(items, { x: 55, y: 60 }, kinds)?.id).toBe("b");
    expect(hitTest(items, { x: 80, y: 60 }, kinds)).toBeNull();
    expect(hitTest(items, { x: 60, y: 60 }, { box: { selectable: false } })).toBeNull();
  });
  it("catches items in a box, touching or contained, never locked", () => {
    const list = [...items, item("c", 0, 0, 10, 10, 2, { locked: true })];
    const box = { x: -10, y: -10, w: 120, h: 120 };
    expect(itemsInRect(list, box).map((i) => i.id)).toEqual(["a", "b"]);
    expect(itemsInRect(list, box, "contain").map((i) => i.id)).toEqual(["a"]);
  });
  it("catches items whose centre is in a lasso", () => {
    const lasso = [
      { x: -10, y: -10 },
      { x: 120, y: -10 },
      { x: 120, y: 80 },
      { x: -10, y: 80 },
    ];
    expect(itemsInLasso(items, lasso).map((i) => i.id)).toEqual(["a"]);
  });
  it("finds a handle near the pointer, corners first", () => {
    const b = { x: 0, y: 0, w: 100, h: 50 };
    expect(handleAt(b, { x: 101, y: 49 }, 4, ["se", "s", "e"])).toBe("se");
    expect(handleAt(b, { x: 50, y: 52 }, 4, ["se", "s", "e"])).toBe("s");
    expect(handleAt(b, { x: 50, y: 25 }, 4, ["se", "s", "e"])).toBeNull();
  });
});

describe("resizeBounds", () => {
  const start = { x: 0, y: 0, w: 100, h: 50 };
  it("keeps the opposite edge", () => {
    expect(resizeBounds(start, "se", 20, 10)).toEqual({ x: 0, y: 0, w: 120, h: 60 });
    expect(resizeBounds(start, "nw", 20, 10)).toEqual({ x: 20, y: 10, w: 80, h: 40 });
    expect(resizeBounds(start, "e", 20, 99)).toEqual({ x: 0, y: 0, w: 120, h: 50 });
  });
  it("respects the minimum and snaps to the grid", () => {
    expect(resizeBounds(start, "e", -500, 0, { rule: { minW: 40 } }).w).toBe(40);
    expect(resizeBounds(start, "w", -500, 0, { rule: { minW: 40, maxW: 200 } })).toEqual({
      x: -100,
      y: 0,
      w: 200,
      h: 50,
    });
    expect(resizeBounds(start, "se", 13, 7, { grid: 20 })).toEqual({ x: 0, y: 0, w: 120, h: 60 });
  });
  it("keeps the ratio when asked", () => {
    const r = resizeBounds(start, "se", 100, 0, { keepAspect: true });
    expect(r.w / r.h).toBeCloseTo(2);
    expect(r.w).toBe(200);
  });
});

describe("selection", () => {
  const cur = new Set(["a", "b"]);
  it("replaces, adds, toggles and removes", () => {
    expect([...applySelection(cur, ["c"])]).toEqual(["c"]);
    expect([...applySelection(cur, ["c"], "add")]).toEqual(["a", "b", "c"]);
    expect([...applySelection(cur, ["a", "c"], "toggle")]).toEqual(["b", "c"]);
    expect([...applySelection(cur, ["a"], "remove")]).toEqual(["b"]);
  });
  it("compares and prunes", () => {
    expect(sameSelection(cur, new Set(["b", "a"]))).toBe(true);
    expect(pruneSelection(cur, (id) => id === "a")).toEqual(new Set(["a"]));
    expect(pruneSelection(cur, () => true)).toBe(cur);
  });
});

describe("serialize", () => {
  it("round-trips items and the viewport with a version", () => {
    const json = serialize([item("a", 1, 2)], { x: 3, y: 4, zoom: 0.5 });
    expect(JSON.parse(json).version).toBe(1);
    const doc = deserialize(json);
    expect(doc.items[0]?.bounds).toEqual({ x: 1, y: 2, w: 100, h: 60 });
    expect(doc.viewport).toEqual({ x: 3, y: 4, zoom: 0.5 });
  });
  it("refuses an unknown version, a bad item, a duplicate id", () => {
    expect(() => deserialize('{"version":2,"items":[]}')).toThrow(CanvasFormatError);
    expect(() => deserialize('{"version":1,"items":[{"id":"a","kind":"k"}]}')).toThrow(/bounds/);
    const twice = serialize([item("a", 0, 0), item("a", 1, 1)]);
    expect(() => deserialize(twice)).toThrow(/twice/);
    expect(() => deserialize("nope")).toThrow(/JSON/);
  });
});

describe("gestureFor", () => {
  const base: PressInput = {
    tool: "select",
    pointer: { button: 0, shift: false, alt: false, mod: false },
    spaceHeld: false,
    target: { type: "empty" },
  };
  const press = (patch: Partial<PressInput>, pointer = {}) =>
    gestureFor({ ...base, ...patch, pointer: { ...base.pointer, ...pointer } }).type;

  it("pans with the middle button, Space or the hand", () => {
    expect(press({}, { button: 1 })).toBe("pan");
    expect(press({ spaceHeld: true, target: { type: "item", itemId: "a" } })).toBe("pan");
    expect(press({ tool: "pan" })).toBe("pan");
    expect(press({ tool: "pan" }, { shift: true })).toBe("box");
  });
  it("selects with a box, or a lasso with Alt", () => {
    expect(press({})).toBe("box");
    expect(press({}, { alt: true })).toBe("lasso");
    expect(press({ tool: "lasso" })).toBe("lasso");
  });
  it("presses, resizes and connects", () => {
    expect(press({ target: { type: "item", itemId: "a" } })).toBe("press-item");
    expect(press({ target: { type: "resize", itemId: "a", handle: "se" } })).toBe("resize");
    expect(press({ target: { type: "connect", itemId: "a", handle: "out" } })).toBe("connect");
    expect(press({ readOnly: true, target: { type: "connect", itemId: "a", handle: "out" } })).toBe(
      "press-item",
    );
  });
  it("hands other presses to a consumer tool, ignores the secondary button", () => {
    expect(press({ tool: "rect", target: { type: "item", itemId: "a" } })).toBe("tool");
    expect(press({}, { button: 2 })).toBe("none");
  });
});

describe("keyboard navigation", () => {
  const grid = [item("tl", 0, 0), item("tr", 200, 0), item("bl", 0, 200), item("br", 200, 210)];
  it("reads top to bottom, left to right", () => {
    expect(readingOrder([...grid].reverse()).map((i) => i.id)).toEqual(["tl", "tr", "bl", "br"]);
  });
  it("finds the nearest item in a direction", () => {
    const tl = grid[0]!;
    expect(nearestInDirection(grid, tl, "right")?.id).toBe("tr");
    expect(nearestInDirection(grid, tl, "down")?.id).toBe("bl");
    expect(nearestInDirection(grid, tl, "left")).toBeNull();
  });
});
