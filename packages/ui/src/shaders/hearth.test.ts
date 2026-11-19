import { textSvg } from "@forgeron/blueprint";
import { describe, expect, it } from "vitest";
import { HEARTH_TONES as TONES, hearthCell as cellSize, hearthFrame, hearthGrid } from "./index";

// The footer's hearth (moved from apps/site/src/illustrations/hearth.test.ts with the effect).
const [BG, EMBER, IRON, HOT, SPARK] = [0, 1, 2, 3, 4];

// The footer's grid at 1440 px: 319 × 136 cells of 4 px, the word slot under the link cells.
const slot = { x: 8, y: 78, w: 303, h: 45 };
const grid = hearthGrid(319, 136, slot);
const pixels = (textSvg("FORGERON").match(/M\d+ \d+h1v1h-1z/g) ?? []).length;

const share = (frame: Uint8Array, rows: [number, number], tones: number[]) => {
  let hit = 0;
  let all = 0;
  for (let y = rows[0]; y < rows[1]; y++)
    for (let x = 0; x < grid.cols; x++) {
      const i = y * grid.cols + x;
      if (!grid.word[i]) continue;
      all++;
      if (tones.includes(frame[i] ?? BG)) hit++;
    }
  return hit / all;
};

describe("hearthGrid", () => {
  it("draws the wordmark in whole cells, as large as the slot allows, on its bottom edge", () => {
    expect(grid.k).toBe(6);
    expect(grid.word.reduce((a, b) => a + b, 0)).toBe(pixels * grid.k * grid.k);
    expect(grid.y + 7 * grid.k).toBe(slot.y + slot.h);
    const left = grid.x - slot.x;
    const right = slot.x + slot.w - (grid.x + 47 * grid.k);
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  it("keeps one cell per pixel of the face in a slot narrower than the word", () => {
    expect(hearthGrid(40, 20, { x: 0, y: 0, w: 30, h: 10 }).k).toBe(1);
  });
});

describe("hearthFrame", () => {
  it("is deterministic", () => {
    expect(hearthFrame(grid, 3.2)).toEqual(hearthFrame(grid, 3.2));
  });

  it("keeps the letters in iron, white or ember, and the rest in embers, sparks or nothing", () => {
    const letter = new Set([IRON, HOT, SPARK]);
    const around = new Set([BG, EMBER, SPARK]);
    for (const t of [0, 1.5, 7]) {
      const frame = hearthFrame(grid, t, { x: 100, y: 100 });
      const wrong = [...frame].filter((tone, i) => !(grid.word[i] ? letter : around).has(tone));
      expect(wrong).toEqual([]);
      expect(Math.max(...frame)).toBeLessThan(TONES.length);
    }
  });

  it("heats the letters from their foot: the top rows are colder than the bottom rows", () => {
    const frame = hearthFrame(grid, 0);
    const top = share(frame, [grid.y, grid.y + grid.k * 2], [HOT, SPARK]);
    const foot = share(frame, [grid.y + grid.k * 5, grid.y + grid.k * 7], [HOT, SPARK]);
    expect(top).toBeLessThan(0.25);
    expect(foot).toBeGreaterThan(top + 0.25);
  });

  it("heats the cells under the pointer", () => {
    const rows: [number, number] = [grid.y, grid.y + grid.k * 3];
    const cold = share(hearthFrame(grid, 0), rows, [HOT, SPARK]);
    const blown = share(hearthFrame(grid, 0, { x: grid.x + 20, y: grid.y + 8 }), rows, [
      HOT,
      SPARK,
    ]);
    expect(blown).toBeGreaterThan(cold);
  });

  it("moves with time", () => {
    expect(hearthFrame(grid, 0)).not.toEqual(hearthFrame(grid, 0.5));
  });
});

describe("cellSize", () => {
  it("uses 4 px cells, 2 px below 560 px", () => {
    expect(cellSize(1278)).toBe(4);
    expect(cellSize(373)).toBe(2);
  });
});
