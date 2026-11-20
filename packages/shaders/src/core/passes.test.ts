import { describe, expect, it } from "vitest";
import {
  bayerMaskPath,
  binomial,
  builtInPresets,
  chainOf,
  checkPreset,
  compileStages,
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

describe("S2 passes", () => {
  it("bayer masks are the captions' masks and the burn's fringe, path for path", () => {
    for (let level = 0; level <= 16; level++)
      expect(bayerMaskPath(level, { cell: 4 })).toBe(siteMask(level));
    for (const level of [5, 11])
      expect(bayerMaskPath(level, { cell: 4, off: true })).toBe(siteMask(level, true));
  });

  it("glow is separable: its kernel is binomial and it takes two stages", () => {
    expect(binomial(2)).toEqual([1, 4, 6, 4, 1]);
    const preset = passPresets().glow;
    const stages = compileStages(chainOf(preset));
    expect(stages.map((s) => s.cellResolution)).toEqual([true, true, false]);
  });

  it("a neighbourhood pass starts a stage", () => {
    expect(compileStages(chainOf(passPresets().ring))).toHaveLength(1);
  });

  it("a pass that reads cells cannot follow a present pass", () => {
    const r = checkPreset({
      version: 1,
      source: { type: "field" },
      passes: [{ type: "grid" }, { type: "ordered" }],
    });
    expect("issues" in r && r.issues[0]?.message).toMatch(/cannot follow "grid"/);
  });

  it("hatch stripes a diagonal of whole cells inside its area and drifts with time", () => {
    const run = (time: number) =>
      toTones(
        runCpu(
          chainOf({
            version: 1,
            source: { type: "constant", value: 0 },
            passes: [
              { type: "hatch", tone: 1, over: [0], period: 4, width: 2, speed: 2, x0: 0, x1: 0.5 },
            ],
          }),
          8,
          4,
          { px: 1, time },
        ),
      );
    const a = run(0);
    expect(a[0]).toBe(1);
    expect(a[1]).toBe(1);
    expect(a[2]).toBe(0);
    // the next row leans one cell right: stripe cells 3 and 0
    expect([a[8], a[9], a[10], a[11]]).toEqual([1, 0, 0, 1]);
    for (let y = 0; y < 4; y++) for (let x = 4; x < 8; x++) expect(a[y * 8 + x]).toBe(0);
    expect(run(1)).not.toEqual(a);
  });

  it("dissolve takes the Bayer order: none at 0, every cell at 1", () => {
    const at = (progress: number) =>
      toTones(
        runCpu(
          chainOf({
            version: 1,
            source: { type: "constant", value: 1 },
            passes: [
              { type: "ordered", matrix: 4, centered: true, origin: "top", steps: [[0, 1]] },
              { type: "dissolve", tone: 0, over: [], progress, cycle: 0, matrix: 4 },
            ],
          }),
          8,
          8,
          { px: 1 },
        ),
      );
    expect(at(0).every((v) => v === 1)).toBe(true);
    expect(at(1).every((v) => v === 0)).toBe(true);
    const half = at(0.5).filter((v) => v === 0).length;
    expect(half).toBe(32);
  });

  it("ring draws nothing before its start and after its life, and something in between", () => {
    const at = (time: number) =>
      toTones(
        runCpu(
          chainOf({
            version: 1,
            source: { type: "constant", value: 0 },
            passes: [
              { type: "ordered", matrix: 4, centered: true, origin: "top", steps: [[0, 1]] },
              { type: "ring", start: 1, life: 1, repeat: 0, tones: [2] },
            ],
          }),
          40,
          24,
          { px: 1, time },
        ),
      );
    expect(at(0.5).some((v) => v !== 0)).toBe(false);
    expect(at(1.3).some((v) => v === 2)).toBe(true);
    expect(at(2.5).some((v) => v !== 0)).toBe(false);
  });

  it("reveal shows nothing at the start and the whole text at the end, empty cells staying empty", () => {
    const at = (time: number) =>
      toTones(
        runCpu(
          chainOf({
            version: 1,
            source: { type: "constant", value: 1 },
            passes: [
              { type: "ordered", matrix: 4, centered: true, origin: "top", steps: [[0, 1]] },
              { type: "reveal", duration: 1, hold: 0, loop: false, front: [2] },
            ],
          }),
          16,
          8,
          { px: 1, time },
        ),
      );
    expect(at(0).every((v) => v === 0)).toBe(true);
    expect(at(1).every((v) => v === 1)).toBe(true);
    const mid = at(0.5);
    expect(mid.some((v) => v === 0) && mid.some((v) => v === 1)).toBe(true);
  });

  it("every role is a built-in preset", () => {
    const names = Object.keys(builtInPresets()).filter((n) => n.startsWith("role-"));
    expect(names.sort()).toEqual([
      "role-background",
      "role-ember",
      "role-feedback",
      "role-image",
      "role-progress",
      "role-selection",
      "role-title",
      "role-transition",
    ]);
  });

  const burnChain = (front: Record<string, unknown>) =>
    chainOf({
      version: 1,
      source: { type: "front", ...front },
      passes: [
        { type: "sparks", tick: 0.18, fly: 0.01 },
        {
          type: "ordered",
          matrix: 4,
          centered: false,
          origin: "top",
          steps: [
            [0, 1],
            [1.5, 0],
            [2.5, 0],
            [3.5, 0],
          ],
        },
      ],
    });

  it("a rectangle front: whole at the start, closed onto its band at the end", () => {
    const at = (progress: number) =>
      toTones(
        runCpu(burnChain({ shape: "rect", direction: "close", progress }), 40, 30, { px: 1 }),
      );
    expect(at(0).every((v) => v === 1)).toBe(true);
    const end = at(1);
    expect(end[5 * 40 + 20]).toBe(0); // above the band: the page
    expect(end[15 * 40 + 20]).toBe(1); // inside the band: the picture
  });

  it("the other direction of a front is the same front backwards", () => {
    const run = (direction: string, progress: number) =>
      toTones(runCpu(burnChain({ shape: "lobed", direction, progress }), 40, 30, { px: 1 }));
    expect(run("close", 0.3)).toEqual(run("open", 0.7));
  });

  it("a driven front reads the input the page sets, not its own progress", () => {
    const chain = burnChain({ shape: "rect", direction: "close", driven: true, progress: 0 });
    const at = (progress: number) => toTones(runCpu(chain, 40, 30, { px: 1, progress }));
    expect(at(0).every((v) => v === 1)).toBe(true);
    expect(at(1)[5 * 40 + 20]).toBe(0);
  });

  it("sparks catch along the edge of a front, on a tick, and nowhere without one", () => {
    const run = (progress: number, time: number) =>
      toTones(
        runCpu(burnChain({ shape: "rect", direction: "close", progress }), 80, 40, { px: 1, time }),
      );
    const mid = run(0.5, 1);
    expect(mid.some((v) => v >= 2)).toBe(true);
    expect(run(0.5, 1)).toEqual(mid);
    expect(run(0.5, 1.05)).toEqual(mid); // same 0.18 s tick
    expect(run(0, 1).some((v) => v >= 2)).toBe(false); // no front, no sparks
  });

  it("every built-in preset validates and runs on the CPU", () => {
    for (const [name, preset] of Object.entries(builtInPresets())) {
      expect([name, "preset" in checkPreset(preset)]).toEqual([name, true]);
      if (["dithered-image", "hearth", "role-image", "role-ember", "role-title"].includes(name))
        continue;
      const frame = runCpu(chainOf(preset), 48, 32, { time: 1 });
      expect([name, frame.data.some((v) => v !== 0)]).toEqual([name, true]);
    }
  });
});
