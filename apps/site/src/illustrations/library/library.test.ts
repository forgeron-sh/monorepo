import { type Block, render } from "@forgeron/blueprint";
import { type BlueprintScene, createScene, loadScene } from "@forgeron/blueprint/engine";
import {
  type BlueprintFile,
  type BlueprintMeta,
  type CompiledBlueprint,
  encodeScene,
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

/** Every file of the library, as written (`*.bp` imports through `@forgeron/blueprint/vite`). */
const FILES = import.meta.glob<BlueprintFile>("./**/*.bp", { import: "default", eager: true });
const load = (name: string): BlueprintFile => FILES[`./${name}.bp`]!;

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
      const file = load(name);
      const lib = await readBlueprint(file, { location: `${name}.bp` });
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

// Every file of the library as the site imports it, compiled at build time (`?compiled`, through
// `@forgeron/blueprint/vite`), against the same file read as JSON: the same SceneBin bytes, with
// and without a page's fit, and the same frames, outputs and states when played.
const COMPILED = import.meta.glob<CompiledBlueprint>("./**/*.bp", {
  query: "?compiled",
  import: "default",
  eager: true,
});

// The same files without their bytes (`?meta`): what the page reads of scenes the worker plays.
const META = import.meta.glob<BlueprintMeta>("./**/*.bp", {
  query: "?meta",
  import: "default",
  eager: true,
});

/** The frame's four buffers, the root scope and every machine's state, as one comparable value. */
function played(scene: BlueprintScene, t: number, dt: number) {
  scene.frame(t, dt);
  const f = scene.snapshot();
  return {
    material: f.material,
    ink: f.ink,
    tone: f.tone,
    color: f.color,
    scope: scene.scope.map((n) => scene.get(n)),
    states: scene.encoded.machines.map((_, m) => scene.state(m)),
  };
}

describe("the compiled library", () => {
  it("has every file compiled", () => {
    expect(Object.keys(COMPILED).sort()).toEqual(Object.keys(FILES).sort());
    expect(Object.keys(FILES).length).toBeGreaterThan(40);
  });

  it("gives every file's names and cameras without the bytes (`?meta`)", () => {
    for (const [path, compiled] of Object.entries(COMPILED)) {
      const meta = META[path]!;
      expect(meta.id).toBe(compiled.id);
      for (const [name, { bin, ...rest }] of Object.entries(compiled.scenes)) {
        expect(bin.length).toBeGreaterThan(0);
        expect(meta.scenes[name]).toEqual(rest);
        expect("bin" in meta.scenes[name]!).toBe(false);
      }
    }
  });

  it.each(Object.keys(FILES).sort())(
    "%s plays as the file read from JSON",
    async (path) => {
      const lib = await readBlueprint(FILES[path]!, { location: path });
      const compiled = COMPILED[path]!;
      expect(Object.keys(compiled.scenes)).toEqual([...lib.scenes.keys()]);
      for (const name of lib.scenes.keys()) {
        for (const options of [{}, { fill: 0.8, unit: "any" as const, labels: false }]) {
          const read = encodeScene(lib, name, options);
          const scene = loadScene(compiled.scenes[name]!, options);
          expect(scene.encoded.bytes, `${name} ${JSON.stringify(options)}`).toEqual(read.bytes);
          expect(scene.encoded.strings).toEqual(read.strings);
          expect(scene.scope).toEqual(read.scope);
          scene.dispose();
        }
        const a = createScene(lib, name);
        const b = loadScene(compiled.scenes[name]!);
        for (const s of [a, b]) {
          s.resize(212, 139);
          if (s.scope.includes("progress")) s.set("progress", 0.4);
        }
        let last = 0;
        for (const t of [0, 0.37, 1.7, 4.3, 9.2]) {
          expect(played(b, t, t - last), `${name} at t = ${t}`).toEqual(played(a, t, t - last));
          last = t;
        }
        a.dispose();
        b.dispose();
      }
    },
    30_000,
  );
});
