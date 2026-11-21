/**
 * Still parity (docs/blueprint/engine.md, P2, frozen in P4): every routed scene of the site, at
 * the sizes and with the options it is mounted with (`sizes.json`), at t = 0, for active ∈
 * {-1, 0, 1, 2} and labels on and off, drawn by the Rust core from both inputs, gives the frames
 * of `golden.json`: those that equalled the TypeScript reference buffer for buffer until P4
 * deleted it (`golden.ts`).
 *
 * - immediate mode: the scene function's blocks, through `render` (the engine);
 * - data: the converted `.bp` (its static part, P1) as a SceneBin, fitted and drawn by the
 *   engine; its fit equals `fit` of the blocks `flatten` gives.
 *
 * Under Node only: parity is defined against V8's Math (P1 note 2).
 */
import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { ROUTED, evaluate } from "../../../../apps/site/src/illustrations/library/samples";
import { dither, fit, pixelate, render } from "../../src/index";
import type { Block, Scene } from "../../src/core/types";
import { EngineScene, EngineHandle } from "../../src/engine/index";
import { flatten, readBlueprint, sceneDefs, writeSceneBin } from "../../src/format/index";
import type { BlueprintFile } from "../../src/format/types";
import { golden } from "./golden";
import sizes from "./sizes.json";

const repo = new URL("../../../../", import.meta.url);
const ACTIVE = [-1, 0, 1, 2];
const LABELS = [true, false];
const FILTERS = [pixelate(2), dither({ matrix: 4 })];
interface Mount {
  page: string;
  options: { pixel: number; fill?: number; unit?: string; labels: boolean };
  sizes: [viewport: number, width: number, height: number][];
}

const frozen = golden("still");

function expectGolden(name: string, frame: Parameters<typeof frozen.check>[1]): void {
  expect(frozen.check(name, frame)).toBe("");
}

/** The scene's blocks at an input, drawn twice as the converter does (stateful scenes settle). */
const blocksAt = (name: string, active: number): readonly Block[] =>
  evaluate(name, { t: 0, active });

const mountsOf = (name: string) => (sizes.scenes as unknown as Record<string, Mount[]>)[name] ?? [];

let cases = 0;

describe("still parity under Node", () => {
  it("runs under Node, not Bun", () => {
    expect((process.versions as { bun?: string }).bun).toBeUndefined();
  });

  it("covers every routed scene", () => {
    expect(ROUTED.filter((name) => mountsOf(name).length === 0)).toEqual([]);
  });
});

describe.each(ROUTED)("%s", (name) => {
  const mounts = mountsOf(name);

  it("immediate mode: the scene function through the engine", () => {
    const handle = EngineHandle.immediate();
    // Framing: the scene at t = 0, active = 0 (`frameView`), with the page's fill and unit.
    const probe: Scene = { blocks: blocksAt(name, 0) };
    const byActive = new Map<number, readonly Block[]>();
    let previous = "";
    for (const active of ACTIVE) {
      const blocks = blocksAt(name, active);
      const text = JSON.stringify(blocks);
      // An active the scene ignores draws the same picture: drawn once.
      if (text !== previous) byActive.set(active, blocks);
      previous = text;
    }
    for (const m of mounts) {
      const fitOptions = {
        ...(m.options.fill !== undefined ? { fill: m.options.fill } : {}),
        ...(m.options.unit === "any" ? { unit: "any" as const } : {}),
      };
      for (const [viewport, width, height] of m.sizes) {
        const [w, h] = [Math.floor(width / 2), Math.floor(height / 2)];
        const view = fit(probe.blocks, w, h, fitOptions);
        handle.resize(w, h);
        handle.fitBlocks(probe.blocks, fitOptions.fill, fitOptions.unit);
        expect(handle.view, `${name} ${viewport}: fit`).toEqual(view);
        for (const [active, blocks] of byActive)
          for (const labels of LABELS) {
            const options = { width, height, filters: FILTERS, labels, view };
            expectGolden(
              `${name}-${m.page.replace(/\W/g, "") || "home"}-f${m.options.fill ?? "-"}-${viewport}-a${active}-${labels ? "labels" : "plain"}-immediate`,
              render({ blocks }, options).frame,
            );
            cases++;
          }
      }
    }
    handle.dispose();
  });

  it("data: the converted file as a SceneBin", async () => {
    const file = JSON.parse(
      readFileSync(new URL(`packages/libraries/blueprints/${name}.bp`, repo), "utf8"),
    ) as BlueprintFile;
    const lib = await readBlueprint(file, { location: `${name}.bp` });
    // A scene drawn with rigs (the village) has no picture `flatten` can give: the engine's
    // framing is checked by the animated suite against the function's.
    const rigs = Object.values(file.parts ?? {}).some((p) => p.prims.some((q) => q.kind === "rig"));
    const root = sceneDefs(lib, name)[0]!.params.map(([n]) => n);
    const activeIndex = root.indexOf("active");
    for (const m of mounts) {
      const fitOptions = {
        ...(m.options.fill !== undefined ? { fill: m.options.fill } : {}),
        ...(m.options.unit === "any" ? { unit: "any" as const } : {}),
      };
      for (const labels of LABELS) {
        const scene = EngineScene.load(writeSceneBin(lib, name, { ...fitOptions, labels }));
        for (const [viewport, width, height] of m.sizes) {
          const [w, h] = [Math.floor(width / 2), Math.floor(height / 2)];
          scene.resize(w, h);
          for (const active of activeIndex < 0 ? [-1] : ACTIVE) {
            if (activeIndex >= 0) scene.set(activeIndex, active);
            if (!rigs) {
              const blocks = flatten(lib, name, activeIndex < 0 ? {} : { active });
              const view = fit(blocks, w, h, fitOptions);
              // oxlint-disable-next-line vitest/no-conditional-expect -- a rig scene's fit is the animated suite's
              expect(scene.view, `${name} ${viewport}: fit`).toEqual(view);
            }
            scene.draw();
            expectGolden(
              `${name}-${m.page.replace(/\W/g, "") || "home"}-f${m.options.fill ?? "-"}-${viewport}-a${active}-${labels ? "labels" : "plain"}-data`,
              scene.frame(),
            );
            cases++;
          }
        }
        scene.dispose();
      }
    }
  });
});

describe("count", () => {
  it("reports the cases", () => {
    console.log(`still parity: ${cases} cases equal to golden.json`);
    expect(cases).toBeGreaterThan(0);
  });

  it("draws every frozen case", () => {
    if (frozen.size === 0) return; // a filtered run
    expect(frozen.missing()).toEqual([]);
  });
});

afterAll(() => frozen.save());
