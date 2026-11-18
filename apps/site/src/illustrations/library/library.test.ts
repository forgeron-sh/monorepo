import { type Block, render } from "@forgeron/blueprint";
import {
  type BlueprintFile,
  flatten,
  readBlueprint,
  staticBlocks,
  staticCounts,
} from "@forgeron/blueprint/format";
import { describe, expect, it } from "vitest";
import { ROUTED, SCENE_NAMES, samplesOf } from "./samples";

// The converted library (scripts/blueprint/convert-site.ts) against the scene functions: at every
// sample, `flatten` of the file gives the blocks every sample draws, as values, float64 exact. A
// scene converted by hand (scripts/blueprint/by-hand.ts) gives its whole picture at t = 0.
// Run in `SCENE_NAMES` order, as the converter does, so stateful scenes see the same history.

const load = async (name: string): Promise<BlueprintFile> =>
  ((await import(`./${name}.bp.json`)) as { default: BlueprintFile }).default;

/** How many entries of two buffers differ (an element loop: `toStrictEqual` is slow on them). */
function differing(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let n = Math.abs(a.length - b.length);
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (!Object.is(a[i], b[i])) n++;
  return n;
}

describe("the converted library", () => {
  it("covers every routed scene", () => {
    for (const name of ROUTED) expect(SCENE_NAMES).toContain(name);
  });

  it.each(SCENE_NAMES)(
    "%s flattens to its static blocks at every sample",
    async (name) => {
      const file = await load(name);
      const lib = await readBlueprint(file, { location: `${name}.bp.json` });
      const samples = samplesOf(name);
      // A scene converted by hand (P3) also draws what moves: its params' defaults are its
      // picture at t = 0, and the animated parity suite (packages/blueprint/test/parity/) checks
      // every other time.
      if (Object.values(file.scenes ?? {}).some((s) => s.timelines)) {
        const first = samples.find((s) => s.input.t === 0)!.blocks;
        // oxlint-disable-next-line vitest/no-conditional-expect -- by-hand scenes differ in kind; the rest is checked below
        expect(flatten(lib, name)).toStrictEqual(staticBlocks(first, staticCounts([first])));
        return;
      }
      const counts = staticCounts(samples.map((s) => s.blocks));
      // The first sample by `toStrictEqual`, every other one by exact text (JSON writes one
      // shortest form per float64): `toStrictEqual` on them all takes minutes.
      const text = (blocks: readonly Block[]) =>
        blocks
          .map((b) => JSON.stringify(Object.entries(b).sort(([x], [y]) => (x < y ? -1 : 1))))
          .join("\n");
      const [first, ...rest] = samples.map((s) => ({
        input: s.input,
        flat: flatten(lib, name, s.input),
        expected: staticBlocks(s.blocks, counts),
      }));
      expect(first!.flat).toStrictEqual(first!.expected);
      for (const s of rest)
        expect(text(s.flat), `${name} at ${JSON.stringify(s.input)}`).toBe(text(s.expected));
      // The current renderer draws the same frame from both.
      const original: Block[] = staticBlocks(samples[0]!.blocks, counts);
      const size = { width: 720, height: 480 };
      const a = render({ blocks: original }, size).frame;
      const b = render({ blocks: flatten(lib, name) }, size).frame;
      expect([b.width, b.height]).toEqual([a.width, a.height]);
      for (const key of ["material", "ink", "tone", "color"] as const)
        expect(differing(b[key], a[key]), `${name}: ${key} pixels that differ`).toBe(0);
    },
    30_000,
  );
});
