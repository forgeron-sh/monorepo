import { describe, expect, it } from "vitest";
import {
  bandOf,
  haloCells,
  REVEAL_BANDS as BANDS,
  REVEAL_END as END,
  revealCells,
  revealFrame as frame,
} from "./reveal";

// Moved from apps/font with the code it tests (the specimen's reveal is this source).
describe("dither reveal", () => {
  it("gives every inked pixel, and only those, a time in [0, 1)", () => {
    const lines = [["#.#", "###"], ["##"]];
    const cells = revealCells(lines);
    expect(cells.map((l) => l.length)).toEqual([5, 2]);
    for (const c of cells.flat()) {
      expect(c.t).toBeGreaterThanOrEqual(0);
      expect(c.t).toBeLessThan(1);
    }
  });

  it("scans the rows top to bottom, across both lines, each from left to right", () => {
    const full = Array.from({ length: 8 }, () => "#".repeat(16));
    const [first = [], second = []] = revealCells([full, full]);
    const mean = (cs: { t: number }[]) => cs.reduce((n, c) => n + c.t, 0) / cs.length;
    expect(mean(first)).toBeLessThan(mean(second));
    expect(mean(first.filter((c) => c.y === 0))).toBeLessThan(mean(first.filter((c) => c.y === 7)));
    const top = first.filter((c) => c.y === 0);
    expect(mean(top.filter((c) => c.x < 8))).toBeLessThan(mean(top.filter((c) => c.x >= 8)));
  });

  it("overlaps consecutive rows, so the front is slanted", () => {
    const full = Array.from({ length: 8 }, () => "#".repeat(16));
    const [cells = []] = revealCells([full]);
    const last = Math.max(...cells.filter((c) => c.y === 0).map((c) => c.t));
    const firstOfNext = Math.min(...cells.filter((c) => c.y === 1).map((c) => c.t));
    expect(firstOfNext).toBeLessThan(last);
  });

  it("never switches a whole row or column on at once", () => {
    const full = Array.from({ length: 8 }, () => "#".repeat(16));
    const [cells = []] = revealCells([full]);
    for (let x = 0; x < 16; x++)
      expect(new Set(cells.filter((c) => c.x === x).map((c) => c.t)).size).toBeGreaterThan(1);
    for (let y = 0; y < 8; y++)
      expect(new Set(cells.filter((c) => c.y === y).map((c) => c.t)).size).toBeGreaterThan(1);
  });

  it("steps through the palette as a pixel settles, then stays ink", () => {
    expect(bandOf(0)).toBe(0);
    expect(bandOf(BANDS[0])).toBe(1);
    expect(bandOf(BANDS[2] + 0.001)).toBe(3);
    expect(bandOf(BANDS[3])).toBe(4);
    expect(bandOf(5)).toBe(4);
  });

  it("rings the letters with a halo of paper pixels, outside the bitmap too", () => {
    const [halo = []] = haloCells([["...", ".#.", "..."]]);
    expect(halo).toHaveLength(8);
    const [edge = []] = haloCells([["#"]]);
    expect(edge.some((c) => c.x === -1 && c.y === -1)).toBe(true);
  });

  it("ends on the text exactly: every inked pixel in place, in ink, and nothing else", () => {
    const lines = [["#.#", "###"]];
    const [cells = []] = revealCells(lines);
    const [halo = []] = haloCells(lines);
    const last = frame(cells, halo, END);
    expect(last).toHaveLength(cells.length);
    expect(last.every((p) => p.band === 4)).toBe(true);
    expect(last.map((p) => `${p.x},${p.y}`).sort()).toEqual(
      cells.map((c) => `${c.x},${c.y}`).sort(),
    );
  });

  it("starts empty and, half-way, shows a dithered, coloured, partly shifted front", () => {
    const full = [Array.from({ length: 11 }, () => "#".repeat(47))];
    const [cells = []] = revealCells(full);
    const [halo = []] = haloCells(full);
    expect(frame(cells, halo, -0.2)).toEqual([]);
    const mid = frame(cells, halo, 0.5);
    expect(mid.length).toBeGreaterThan(0);
    expect(mid.length).toBeLessThan(cells.length);
    expect(new Set(mid.map((p) => p.band)).size).toBeGreaterThan(2);
    const moved = mid.filter((p) => !cells.some((c) => c.x === p.x && c.y === p.y));
    expect(moved.length).toBeGreaterThan(0);
  });
});
