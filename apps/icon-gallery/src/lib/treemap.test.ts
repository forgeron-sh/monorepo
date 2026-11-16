import { describe, expect, it } from "vitest";
import { planCells } from "./pixels";
import { squarify } from "./treemap";

describe("squarify", () => {
  const items = [6, 6, 4, 3, 2, 2, 1].map((value, i) => ({ value, data: i }));
  const rects = squarify(items, 600, 400);

  it("gives every item an area in proportion to its value", () => {
    expect(rects).toHaveLength(items.length);
    const total = items.reduce((a, i) => a + i.value, 0);
    for (const r of rects) {
      const value = items[r.data]!.value;
      expect(r.w * r.h).toBeCloseTo((value / total) * 600 * 400, 6);
    }
  });

  it("fills the rectangle without overlaps or overflow", () => {
    const area = rects.reduce((a, r) => a + r.w * r.h, 0);
    expect(area).toBeCloseTo(600 * 400, 6);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-9);
      expect(r.y).toBeGreaterThanOrEqual(-1e-9);
      expect(r.x + r.w).toBeLessThanOrEqual(600 + 1e-9);
      expect(r.y + r.h).toBeLessThanOrEqual(400 + 1e-9);
    }
    for (const a of rects) {
      for (const b of rects) {
        if (a === b) continue;
        const overlapW = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapH = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(overlapW <= 1e-9 || overlapH <= 1e-9).toBe(true);
      }
    }
  });

  it("ignores empty values and an empty box", () => {
    expect(squarify([{ value: 0, data: 0 }], 10, 10)).toEqual([]);
    expect(squarify(items, 0, 10)).toEqual([]);
  });
});

describe("planCells", () => {
  it("draws one square per icon when they fit, filled in the share drawn", () => {
    expect(planCells(100, 100, 10, 50, 5)).toEqual({ cols: 10, rows: 10, cells: 50, filled: 5 });
  });

  it("keeps at least one ember square when anything is drawn", () => {
    expect(planCells(100, 100, 10, 1000, 1).filled).toBe(1);
    expect(planCells(100, 100, 10, 1000, 0).filled).toBe(0);
  });

  it("scales down when the rectangle holds fewer squares than icons", () => {
    expect(planCells(50, 50, 10, 100, 50)).toEqual({ cols: 5, rows: 5, cells: 25, filled: 13 });
  });
});
