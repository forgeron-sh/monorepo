/**
 * The player's frame (docs/blueprint/engine.md, P3): exactly one `frame` call into the engine per
 * drawn frame, no JavaScript allocation in a data scene's loop (heap delta over 600 frames under
 * `--expose-gc`), and the budgets of a frame from inputs to present: ≤ 3 ms for `erp-village`
 * full screen (720 × 450 raster, the script layer: its function, packing, raster, paint,
 * present), ≤ 0.5 ms for a card. The 2D presenter puts the RGBA on a stub context (no canvas in
 * Node): what is measured is the engine and the copy.
 *
 * As P2, budgets are for a quiet M4; a test reports p50 and p95 and fails only when its median
 * passes 3 × the budget. Numbers go to target/bench/blueprint-player.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { sceneAtProgress } from "../../../../apps/site/src/illustrations/library/samples";
import { plan } from "../../src/core/filters";
import { resolvePalette } from "../../src/core/palette";
import { present2d, type Presenter } from "../../src/dom/present-2d";
import { createScene, createScriptScene, FRAME_FLAGS } from "../../src/engine/scene";
import { readBlueprint } from "../../src/format/index";
import type { BlueprintFile } from "../../src/format/types";

const repo = new URL("../../../../", import.meta.url);
const SLACK = 3;
const results: Record<string, { p50: number; p95: number; budget: number; unit: "ms" }> = {};
const colors = resolvePalette(plan().colors);

/** A canvas whose 2D context only takes the image (Node has no canvas). */
function stubCanvas(): HTMLCanvasElement {
  let puts = 0;
  const ctx = {
    putImageData: () => void puts++,
    createImageData: (w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    }),
  };
  return {
    width: 0,
    height: 0,
    style: {},
    getContext: () => ctx,
    get puts() {
      return puts;
    },
  } as unknown as HTMLCanvasElement;
}

async function library(name: string) {
  const file = JSON.parse(
    readFileSync(new URL(`apps/site/src/illustrations/library/${name}.bp.json`, repo), "utf8"),
  ) as BlueprintFile;
  return readBlueprint(file, { location: `${name}.bp.json` });
}

function measure(run: (k: number) => void, n = 240): { p50: number; p95: number } {
  for (let i = 0; i < 20; i++) run(i);
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    run(20 + i);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return { p50: times[Math.floor(n / 2)]!, p95: times[Math.floor(n * 0.95)]! };
}

function check(name: string, m: { p50: number; p95: number }, budget: number): number {
  results[name] = { ...m, budget, unit: "ms" };
  console.log(
    `${name}: p50 ${m.p50.toFixed(3)} ms, p95 ${m.p95.toFixed(3)} ms (budget ${budget} ms, fails at a median of ${budget * SLACK} ms)`,
  );
  return m.p50 / budget;
}

/** One played frame: the engine's call, then the presenter when it drew. */
function player(scene: { frame(t: number, dt: number): number }, presenter: Presenter) {
  return (t: number) => {
    if (scene.frame(t, 1 / 60) & FRAME_FLAGS.drawn) presenter.present(scene as never);
  };
}

describe("the player's frame", () => {
  it("calls the engine once per frame (data and script)", async () => {
    const scene = createScene(await library("cli"), "cli");
    scene.resize(212, 139);
    scene.palette(colors);
    const canvas = stubCanvas();
    const presenter = present2d(canvas);
    presenter.resize(212, 139, 2, 0);
    let drawn = 0;
    for (let k = 0; k < 120; k++) if (scene.frame(k / 60, 1 / 60) & FRAME_FLAGS.drawn) drawn++;
    expect(scene.frameCalls).toBe(120);
    // A frame whose inputs change nothing is not drawn: cli's cursor blinks every half second.
    expect(drawn).toBeGreaterThan(0);
    expect(drawn).toBeLessThan(120);
    const script = createScriptScene(sceneAtProgress("dashboard"));
    script.resize(212, 139);
    for (let k = 0; k < 60; k++) script.frame(k / 60, 1 / 60);
    expect(script.frameCalls).toBe(60);
    scene.dispose();
    script.dispose();
    presenter.dispose();
  });

  it("allocates nothing in a data scene's loop (600 frames, --expose-gc)", async () => {
    const gc = (globalThis as { gc?: () => void }).gc;
    expect(gc, "run under --expose-gc (packages/blueprint/vitest.config.ts)").toBeTypeOf(
      "function",
    );
    const scene = createScene(await library("usage-iso"), "usage-iso");
    scene.resize(212, 139);
    scene.palette(colors);
    const presenter = present2d(stubCanvas());
    presenter.resize(212, 139, 2, 0);
    const play = player(scene, presenter);
    for (let k = 0; k < 600; k++) play(k / 60); // warm: views, the image, the JIT
    /** Heap growth over `n` frames, after full collections. */
    const growth = (n: number) => {
      gc!();
      gc!();
      const before = process.memoryUsage().heapUsed;
      for (let k = 0; k < n; k++) play(20 + k / 60);
      gc!();
      gc!();
      return process.memoryUsage().heapUsed - before;
    };
    growth(600); // a first collection frees what the warm-up left
    const small = growth(600);
    const large = growth(3000);
    const perFrame = (large - small) / 2400;
    console.log(
      `heap delta of usage-iso: ${small} bytes over 600 frames, ${large} over 3000 (${perFrame.toFixed(2)} bytes a frame)`,
    );
    // ≈ 0: what the collector leaves varies by KBs between runs, and the loop's own boxed
    // numbers cost a few bytes a frame; one typed-array view, one ImageData or one block list
    // per frame would cost hundreds.
    expect(small).toBeLessThan(64 * 1024);
    expect(perFrame).toBeLessThan(16);
    scene.dispose();
  });

  it("erp-village, full screen (720 × 450), the script layer: ≤ 3 ms", () => {
    const scene = createScriptScene(sceneAtProgress("erp-village", 0.1), {
      fill: 0.98,
      unit: "any",
    });
    scene.resize(720, 450);
    scene.palette(colors);
    const presenter = present2d(stubCanvas());
    presenter.resize(720, 450, 2, 0);
    const play = player(scene, presenter);
    const m = measure((k) => play(k / 60));
    expect(check("play erp-village 720x450 (script)", m, 3)).toBeLessThanOrEqual(SLACK);
    scene.dispose();
  });

  it("a card, 212 × 139: ≤ 0.5 ms, from data and on the script layer", async () => {
    const data = createScene(await library("usage-iso"), "usage-iso");
    data.resize(212, 139);
    data.palette(colors);
    const p1 = present2d(stubCanvas());
    p1.resize(212, 139, 2, 0);
    const m1 = measure(player(data, p1));
    expect(check("play usage-iso 212x139 (data)", m1, 0.5)).toBeLessThanOrEqual(SLACK);
    const script = createScriptScene(sceneAtProgress("dashboard"), { fill: 0.8 });
    script.resize(212, 139);
    script.palette(colors);
    const p2 = present2d(stubCanvas());
    p2.resize(212, 139, 2, 0);
    const m2 = measure((k) => {
      if (script.frame(k / 60, 1 / 60) & FRAME_FLAGS.drawn) p2.present(script);
    });
    expect(check("play dashboard 212x139 (script)", m2, 0.5)).toBeLessThanOrEqual(SLACK);
    data.dispose();
    script.dispose();
  });
});

afterAll(() => {
  const dir = new URL("target/bench/", repo);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    new URL("blueprint-player.json", dir),
    `${JSON.stringify({ date: new Date().toISOString(), results }, null, 2)}\n`,
  );
});
