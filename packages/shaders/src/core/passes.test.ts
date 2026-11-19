import { describe, expect, it } from "vitest";
import {
  bayerMaskPath,
  binomial,
  BLUE_NOISE_SIZE,
  blueNoiseMask,
  builtInPresets,
  chainOf,
  checkPreset,
  compileStages,
  type Preset,
  passPresets,
  runCpu,
  toTones,
} from "../index";

// The captions' masks of forgeron.sh's opening as its page wrote them (apps/site/src/pages/index.astro
// at 51529742): the cells of the 4×4 Bayer table under the level, 4 units each.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const siteMask = (level: number, eaten = false) => {
  let d = "";
  BAYER.forEach((v, i) => {
    if (eaten ? v >= level : v < level) d += `M${(i % 4) * 4} ${Math.floor(i / 4) * 4}h4v4h-4z`;
  });
  return d;
};

const ramp = (levels: number): Preset => ({
  version: 1,
  source: { type: "constant", value: 0 },
  passes: [{ type: "floyd-steinberg", levels, serpentine: false }],
});

describe("S2 passes", () => {
  it("bayer masks are the captions' masks and the burn's fringe, path for path", () => {
    for (let level = 0; level <= 16; level++)
      expect(bayerMaskPath(level, { cell: 4 })).toBe(siteMask(level));
    for (const level of [5, 11])
      expect(bayerMaskPath(level, { cell: 4, off: true })).toBe(siteMask(level, true));
  });

  it("blue noise ranks every cell of the 64×64 mask once", () => {
    const m = blueNoiseMask();
    const n = BLUE_NOISE_SIZE * BLUE_NOISE_SIZE;
    expect(m.length).toBe(n);
    const ranks = new Set(Array.from(m, (t) => Math.round(t * n - 0.5)));
    expect(ranks.size).toBe(n);
    expect(blueNoiseMask()).toBe(m);
  });

  it("blue noise spreads a level evenly: every 8×8 block of the half level holds 32 ± 8", () => {
    const m = blueNoiseMask();
    const N = BLUE_NOISE_SIZE;
    for (let by = 0; by < N; by += 8)
      for (let bx = 0; bx < N; bx += 8) {
        let on = 0;
        for (let y = by; y < by + 8; y++)
          for (let x = bx; x < bx + 8; x++) if ((m[y * N + x] ?? 0) < 0.5) on++;
        expect(Math.abs(on - 32)).toBeLessThanOrEqual(8);
      }
  });

  it("Floyd–Steinberg keeps the mean and runs on the CPU only", () => {
    const chain = chainOf({
      ...ramp(3),
      source: { type: "constant", value: 0.3 },
    });
    const tones = toTones(runCpu(chain, 64, 64, { px: 1 }));
    const mean = tones.reduce((a, b) => a + b, 0) / tones.length / 2;
    expect(Math.abs(mean - 0.3)).toBeLessThan(0.01);
    expect(() => compileStages(chain)).toThrow(/CPU only/);
  });

  it("Floyd–Steinberg gives the textbook result on a small frame", () => {
    // 0.5 everywhere, two tones, left to right: the classic checkerboard.
    const chain = chainOf({ ...ramp(2), source: { type: "constant", value: 0.5 } });
    const tones = toTones(runCpu(chain, 4, 2, { px: 1 }));
    expect([...tones]).toEqual([1, 0, 1, 0, 0, 1, 0, 1]);
  });

  it("glow is separable: its kernel is binomial and it takes two stages", () => {
    expect(binomial(2)).toEqual([1, 4, 6, 4, 1]);
    const preset = passPresets().glow;
    const stages = compileStages(chainOf(preset));
    expect(stages.map((s) => s.cellResolution)).toEqual([true, true, false]);
  });

  it("a neighbourhood pass starts a stage; the CRT starts the last one", () => {
    expect(compileStages(chainOf(passPresets().edges))).toHaveLength(2);
    expect(compileStages(chainOf(passPresets().crt))).toHaveLength(2);
    expect(compileStages(chainOf(passPresets().halftone))).toHaveLength(1);
  });

  it("a pass that reads cells cannot follow a present pass", () => {
    const r = checkPreset({
      version: 1,
      source: { type: "field" },
      passes: [{ type: "grid" }, { type: "crt" }],
    });
    expect("issues" in r && r.issues[0]?.message).toMatch(/cannot follow "grid"/);
  });

  it("every built-in preset validates and runs on the CPU", () => {
    for (const [name, preset] of Object.entries(builtInPresets())) {
      expect([name, "preset" in checkPreset(preset)]).toEqual([name, true]);
      if (["dithered-image", "hearth"].includes(name)) continue;
      const frame = runCpu(chainOf(preset), 48, 32, { time: 1 });
      expect([name, frame.data.some((v) => v !== 0)]).toEqual([name, true]);
    }
  });
});
