import { textWidth } from "@forgeron/blueprint";
import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  bayer,
  DitherField,
  ditherFieldFrame,
  ditherPath,
  FIELD_BG,
  FIELD_HIGH,
  FIELD_LOW,
  FIELD_SHADERS,
  FieldShader,
  Hearth,
  hearthFrame,
  hearthGrid,
  PixelReveal,
  REVEAL_END,
  revealCells,
  revealFrame,
  haloCells,
  textRows,
} from "./index";

// The 8×8 table the sub-sites carried (apps/*/src/lib/pixels.ts): the field must not change.
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

describe("dither field", () => {
  it("thresholds with the same 8×8 matrix as the sub-sites' copies", () => {
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++)
        expect(bayer(x, y, 8)).toBe(((BAYER8[y * 8 + x] ?? 0) + 0.5) / 64);
  });

  it("is deterministic and uses its three tones, the ember at the bottom right", () => {
    const a = ditherFieldFrame(64, 48, 1.5);
    expect(ditherFieldFrame(64, 48, 1.5)).toEqual(a);
    expect(new Set(a)).toEqual(new Set([FIELD_BG, FIELD_LOW, FIELD_HIGH]));
    const high = (x0: number, y0: number) => {
      let n = 0;
      for (let y = y0; y < y0 + 16; y++)
        for (let x = x0; x < x0 + 16; x++) n += +(a[y * 64 + x] === FIELD_HIGH);
      return n;
    };
    expect(high(48, 32)).toBeGreaterThan(high(0, 0));
    expect(high(0, 0)).toBe(0);
  });
});

describe("ditherPath", () => {
  it("draws nothing at 0, everything at 1, half the cells at one half", () => {
    expect(ditherPath(8, 8, () => 0)).toBe("");
    expect(ditherPath(8, 8, () => 1).match(/M/g)).toHaveLength(64);
    expect(ditherPath(4, 4, () => 0.5, 4).match(/M/g)).toHaveLength(8);
  });
});

describe("reveal", () => {
  it("lays a line out on seven rows, as wide as the pixel face says", () => {
    const rows = textRows("Forge");
    expect(rows).toHaveLength(7);
    for (const r of rows) expect(r).toHaveLength(textWidth("FORGE"));
  });

  it("starts empty and ends on the text exactly, in ink", () => {
    const lines = [textRows("UI")];
    const [cells = []] = revealCells(lines);
    const [halo = []] = haloCells(lines);
    expect(revealFrame(cells, halo, 0).length).toBeLessThan(cells.length / 4);
    const end = revealFrame(cells, halo, REVEAL_END);
    expect(end.map(({ x, y }) => `${x},${y}`).sort()).toEqual(
      cells.map(({ x, y }) => `${x},${y}`).sort(),
    );
    expect(end.every((p) => p.band === 4)).toBe(true);
  });
});

describe("hearth", () => {
  it("stands the word on the bottom of its slot and never leaves a letter empty", () => {
    const grid = hearthGrid(120, 40, { x: 0, y: 10, w: 120, h: 28 });
    expect(grid.y + 7 * grid.k).toBe(38);
    const frame = hearthFrame(grid, 2);
    expect(hearthFrame(grid, 2)).toEqual(frame);
    const letters = [...frame].filter((_, i) => grid.word[i]);
    expect(letters.length).toBeGreaterThan(0);
    expect(letters.every((tone) => tone > 1)).toBe(true);
  });
});

describe("React wrappers", () => {
  it("render plain, decorative markup on the server", () => {
    expect(html(h(DitherField, { pixel: 4 }))).toBe(
      '<canvas class="fg-shader" aria-hidden="true"></canvas>',
    );
    expect(html(h(FieldShader, { mode: "globe", className: "x" }))).toContain(
      'class="fg-shader x"',
    );
    const hearth = html(h(Hearth, { text: "Forgeron" }));
    expect(hearth).toContain('class="fg-hearth"');
    expect(hearth).toContain('aria-label="Forgeron"');
    expect(html(h(PixelReveal, { text: "UI", pixel: 6 }))).toContain("--fg-reveal-px:6px");
  });

  it("knows the four fields of the site", () => {
    expect(FIELD_SHADERS).toEqual(["ember", "globe", "dissolve", "field"]);
  });
});
