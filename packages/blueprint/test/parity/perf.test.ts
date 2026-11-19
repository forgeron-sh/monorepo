/**
 * Perf budgets of P2 (docs/blueprint/engine.md §4), on the release module: the Rust part of an
 * immediate frame (copy in, decode, raster, labels, shade) for `erp-village` and `machine` full
 * screen (720 × 450 raster) and a card, and `load` of the largest converted scene.
 *
 * The budgets (p95) are for a quiet M4; this machine often runs other work, whose spikes land in
 * the p95. So each test reports its p50 and p95 and fails only when its median is beyond 3 × the
 * budget. Numbers go to target/bench/blueprint.json.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { evaluate } from "../../../../apps/site/src/illustrations/library/samples";
import { EngineHandle, EngineScene } from "../../src/engine/index";
import { packBlocks } from "../../src/engine/pack";
import { readBlueprint, writeSceneBin } from "../../src/format/index";
import type { BlueprintFile } from "../../src/format/types";
import { fit } from "../../src/index";

const repo = new URL("../../../../", import.meta.url);
const SLACK = 3;
const results: Record<string, { p50: number; p95: number; budget: number; unit: "ms" }> = {};

function measure(run: () => void, n = 120): { p50: number; p95: number } {
  for (let i = 0; i < 10; i++) run();
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    run();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return { p50: times[Math.floor(n / 2)]!, p95: times[Math.floor(n * 0.95)]! };
}

/** Records and reports a measure; returns its median over the budget (fails above `SLACK`). */
function check(name: string, m: { p50: number; p95: number }, budget: number): number {
  results[name] = { ...m, budget, unit: "ms" };
  console.log(
    `${name}: p50 ${m.p50.toFixed(3)} ms, p95 ${m.p95.toFixed(3)} ms (budget ${budget} ms, fails at a median of ${budget * SLACK} ms)`,
  );
  return m.p50 / budget;
}

/** The Rust part of one immediate frame of `scene` on a `width` × `height` raster. */
function immediate(scene: string, width: number, height: number, fill: number) {
  const blocks = evaluate(scene, { t: 0, active: -1 });
  const handle = EngineHandle.immediate();
  handle.resize(width, height);
  handle.view = fit(blocks, width, height, { fill, unit: "any" });
  handle.labels(true);
  handle.shading({ dither: 4, glow: null });
  const packed = packBlocks(blocks);
  const m = measure(() => handle.drawPacked(packed));
  handle.dispose();
  return { m, blocks: blocks.length };
}

describe("perf (release module, p95)", () => {
  it("erp-village, 720 × 450, immediate: ≤ 2 ms", () => {
    const { m, blocks } = immediate("erp-village", 720, 450, 0.98);
    expect(blocks).toBeGreaterThan(1000);
    expect(check("erp-village immediate 720x450", m, 2)).toBeLessThanOrEqual(SLACK);
  });

  it("machine, 720 × 450, immediate: ≤ 1.5 ms", () => {
    const { m, blocks } = immediate("machine", 720, 450, 0.94);
    expect(blocks).toBeGreaterThan(1000);
    expect(check("machine immediate 720x450", m, 1.5)).toBeLessThanOrEqual(SLACK);
  });

  it("a card (dashboard, 425 × 279 at 2 px), immediate: ≤ 0.3 ms", () => {
    const { m } = immediate("dashboard", 212, 139, 0.8);
    expect(check("card immediate 212x139", m, 0.3)).toBeLessThanOrEqual(SLACK);
  });

  it("load of the largest converted scene: ≤ 5 ms", async () => {
    const dir = new URL("apps/site/src/illustrations/library/", repo);
    const files = readdirSync(dir).filter((f) => f.endsWith(".bp.json"));
    let largest: { name: string; bin: Uint8Array } = { name: "", bin: new Uint8Array() };
    for (const f of files) {
      const name = f.replace(/\.bp\.json$/, "");
      const file = JSON.parse(readFileSync(new URL(f, dir), "utf8")) as BlueprintFile;
      const bin = writeSceneBin(await readBlueprint(file, { location: f }), name);
      if (bin.length > largest.bin.length) largest = { name, bin };
    }
    const m = measure(() => EngineScene.load(largest.bin).dispose(), 30);
    console.log(`largest SceneBin: ${largest.name}, ${(largest.bin.length / 1024).toFixed(0)} KB`);
    expect(check(`load ${largest.name}`, m, 5)).toBeLessThanOrEqual(SLACK);
  });
});

afterAll(() => {
  const dir = new URL("target/bench/", repo);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    new URL("blueprint.json", dir),
    `${JSON.stringify({ date: new Date().toISOString(), results }, null, 2)}\n`,
  );
});
