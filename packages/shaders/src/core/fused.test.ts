import { describe, expect, it } from "vitest";
import type { RGB } from "./color";
import { bindChain } from "./contract";
import { runCpu, toRgba } from "./cpu";
import { ditherFieldPixels, hearthPixels } from "./fused";
import { orderedCpu } from "./passes/ordered.cpu";
import { paletteCpu } from "./passes/palette.cpu";
import { ditherFieldTones } from "./dither-field";
import { ditherFieldPreset, hearthPreset } from "./presets";
import { hearthFrame, hearthGrid, HEARTH_TONES, type PixelFace } from "./sources/hearth";
import { hearthCpu } from "./sources/hearth.cpu";
import { heatCpu } from "./sources/heat.cpu";

// Whole channels, as `resolveColor` gives them, over the whole range and beyond it (clamped).
const palette = (n: number): RGB[] =>
  Array.from(
    { length: n },
    (_, i) => [i * 61, 255 - i * 51, i === 1 ? 300 : (i * 97) % 256] as RGB,
  );
const resolverOf = (refs: readonly unknown[], colors: RGB[]) => (ref: unknown) =>
  colors[refs.findIndex((r) => JSON.stringify(r) === JSON.stringify(ref))] ?? ([0, 0, 0] as RGB);

describe("fused CPU chains", () => {
  it("the dither field's loop writes the bytes of runCpu then toRgba", () => {
    const tones = ditherFieldTones();
    const colors = palette(3);
    const chain = bindChain(
      ditherFieldPreset(),
      { heat: heatCpu },
      { ordered: orderedCpu, palette: paletteCpu },
    );
    for (const [w, h, t] of [
      [1, 1, 0],
      [37, 23, 0],
      [320, 120, 1.7],
      [301, 97, 12.25],
    ] as const) {
      const want = toRgba(
        runCpu(chain, w, h, { px: 1, time: t, resolve: resolverOf(tones, colors) }),
      );
      const got = new Uint8ClampedArray(w * h * 4);
      ditherFieldPixels(got, w, h, t, colors);
      expect(got).toEqual(want);
    }
  });

  it("the hearth's loop writes the bytes of runCpu then toRgba", () => {
    const face: PixelFace = {
      glyph: () => ({ rows: ["###", "#.#", "###", "#.#", "###", "#.#", "###"], top: 0 }),
      glyphWidth: () => 3,
      textWidth: (s) => s.length * 4 - 1,
    };
    const colors = palette(5);
    const chain = bindChain(hearthPreset(), { hearth: hearthCpu }, { palette: paletteCpu });
    for (const [cols, rows, t, heat] of [
      [60, 20, 0, null],
      [120, 40, 2.3, { x: 30, y: 12 }],
      [333, 51, 9.95, null],
    ] as const) {
      const grid = hearthGrid(face, cols, rows, { x: 2, y: 4, w: cols - 4, h: rows - 6 });
      const want = toRgba(
        runCpu(chain, cols, rows, {
          px: 1,
          time: t,
          data: { grid, heat },
          resolve: resolverOf(HEARTH_TONES, colors),
        }),
      );
      const got = new Uint8ClampedArray(cols * rows * 4);
      hearthPixels(got, hearthFrame(grid, t, heat), colors);
      expect(got).toEqual(want);
    }
  });
});
