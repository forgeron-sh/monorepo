/**
 * Still parity (docs/blueprint/engine.md, P2): every routed scene of the site, at the sizes and
 * with the options it is mounted with (`sizes.json`), at t = 0, for active ∈ {-1, 0, 1, 2} and
 * labels on and off, drawn by the Rust core from both inputs, equals the TypeScript reference
 * (`test/reference/`, today's renderer) buffer for buffer:
 *
 * - immediate mode: the scene function's blocks, through `render` (the engine);
 * - data: the converted `.bp.json` (its static part, P1) as a SceneBin, fitted and drawn by the
 *   engine, against the reference drawing `flatten` of the same file.
 *
 * Under Node only: parity is defined against V8's Math (P1 note 2). A failing case writes
 * `target/parity/<case>.png`: reference, engine and their difference side by side.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ROUTED, evaluate } from "../../../../apps/site/src/illustrations/library/samples";
import { dither, paint, pixelate, plan, render, resolvePalette } from "../../src/index";
import type { Block, Scene } from "../../src/core/types";
import { EngineScene, EngineHandle } from "../../src/engine/index";
import { flatten, readBlueprint, sceneDefs, writeSceneBin } from "../../src/format/index";
import type { BlueprintFile } from "../../src/format/types";
import { fit as referenceFit } from "../reference/project";
import { render as referenceRender } from "../reference/render";
import { png } from "./png";
import sizes from "./sizes.json";

const repo = new URL("../../../../", import.meta.url);
const ACTIVE = [-1, 0, 1, 2];
const LABELS = [true, false];
const KEYS = ["material", "ink", "tone", "color"] as const;
const FILTERS = [pixelate(2), dither({ matrix: 4 })];

interface Mount {
  page: string;
  options: { pixel: number; fill?: number; unit?: string; labels: boolean };
  sizes: [viewport: number, width: number, height: number][];
}

type Frame = Record<(typeof KEYS)[number], ArrayLike<number>> & { width: number; height: number };

function differing(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let n = Math.abs(a.length - b.length);
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (!Object.is(a[i], b[i])) n++;
  return n;
}

const colors = resolvePalette(plan().colors);

/** Writes reference | engine | difference as one PNG under target/parity/. */
function dump(name: string, ref: Frame, eng: Frame): string {
  const { width: w, height: h } = ref;
  const asFrame = (f: Frame) => ({ ...f, color: Uint8Array.from(f.color) }) as never;
  const a = paint(asFrame(ref), colors);
  const b = paint(asFrame(eng), colors);
  const out = new Uint8Array(w * 3 * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const same = KEYS.every((k) => Object.is(ref[k][i], eng[k][i]));
      const put = (col: number, rgba: ArrayLike<number>) => {
        const o = (y * w * 3 + col * w + x) * 4;
        for (let c = 0; c < 4; c++) out[o + c] = rgba[c] ?? 0;
      };
      put(0, [a[i * 4]!, a[i * 4 + 1]!, a[i * 4 + 2]!, 255]);
      put(1, [b[i * 4]!, b[i * 4 + 1]!, b[i * 4 + 2]!, 255]);
      put(2, same ? [24, 24, 24, 255] : [255, 0, 64, 255]);
    }
  const dir = new URL("target/parity/", repo);
  mkdirSync(dir, { recursive: true });
  const file = new URL(`${name}.png`, dir);
  writeFileSync(file, png(w * 3, h, out));
  return file.pathname;
}

function expectSame(name: string, ref: Frame, eng: Frame): void {
  expect([eng.width, eng.height], `${name}: size`).toEqual([ref.width, ref.height]);
  const diffs = KEYS.map((k) => [k, differing(ref[k], eng[k])] as const).filter(([, n]) => n > 0);
  const report = diffs.length
    ? `${name}: ${diffs.map(([k, n]) => `${n} ${k}`).join(", ")} differ (${dump(name, ref, eng)})`
    : "";
  expect(report).toBe("");
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
        const view = referenceFit(probe.blocks, w, h, fitOptions);
        handle.resize(w, h);
        handle.fitBlocks(probe.blocks, fitOptions.fill, fitOptions.unit);
        expect(handle.view, `${name} ${viewport}: fit`).toEqual(view);
        for (const [active, blocks] of byActive)
          for (const labels of LABELS) {
            const options = { width, height, filters: FILTERS, labels, view };
            const ref = referenceRender({ blocks }, options).frame;
            const eng = render({ blocks }, options).frame;
            expectSame(
              `${name}-${m.page.replace(/\W/g, "") || "home"}-${viewport}-a${active}-${labels ? "labels" : "plain"}-immediate`,
              ref,
              eng,
            );
            cases++;
          }
      }
    }
    handle.dispose();
  });

  it("data: the converted file as a SceneBin", async () => {
    const file = JSON.parse(
      readFileSync(new URL(`apps/site/src/illustrations/library/${name}.bp.json`, repo), "utf8"),
    ) as BlueprintFile;
    const lib = await readBlueprint(file, { location: `${name}.bp.json` });
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
            const blocks = flatten(lib, name, activeIndex < 0 ? {} : { active });
            const source = { blocks, fit: fitOptions };
            const view = referenceFit(blocks, w, h, fitOptions);
            expect(scene.view, `${name} ${viewport}: fit`).toEqual(view);
            scene.draw();
            const ref = referenceRender(source, { width, height, filters: FILTERS, labels }).frame;
            expectSame(
              `${name}-${m.page.replace(/\W/g, "") || "home"}-${viewport}-a${active}-${labels ? "labels" : "plain"}-data`,
              ref,
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
    console.log(`still parity: ${cases} cases equal`);
    expect(cases).toBeGreaterThan(0);
  });
});
