// The scenarios, shared by the Bun runner (JavaScriptCore) and the browser page (V8). Each one is
// timed per operation with `performance.now()`; a budget stops the slow engines early, and the
// result says how many samples it holds.

import type { Bounds, Size, Viewport } from "../src/index";
import type { BenchEngine, Instances } from "./engines";
import { makeScene, random, type BenchScene } from "./scene-data";

export const SIZES = [1_000, 5_000, 20_000, 100_000];
export const SCREEN: Size = { w: 1280, h: 800 };
export const MARGIN = 100;

export interface Stats {
  n: number;
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  max: number;
}

export function stats(samples: number[]): Stats {
  const s = [...samples].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? NaN;
  const mean = s.reduce((a, b) => a + b, 0) / (s.length || 1);
  return { n: s.length, p50: at(0.5), p95: at(0.95), p99: at(0.99), mean, max: s.at(-1) ?? NaN };
}

/** Runs `fn(i)` up to `max` times or until `budgetMs` is spent; times each call in ms. */
function sample(max: number, budgetMs: number, fn: (i: number) => void): number[] {
  const out: number[] = [];
  const start = performance.now();
  for (let i = 0; i < max; i++) {
    const t = performance.now();
    fn(i);
    out.push(performance.now() - t);
    if (performance.now() - start > budgetMs) break;
  }
  return out;
}

/** A camera path: `explore` pans across the world zooming between 0.3 and 1.5 (a few hundred
 *  items in view); `overview` fits the whole world and drifts (every item in view). */
export function cameraPath(
  scene: BenchScene,
  kind: "explore" | "overview",
  frames: number,
): Viewport[] {
  const out: Viewport[] = [];
  const side = scene.world.w;
  for (let f = 0; f < frames; f++) {
    const t = f / frames;
    let zoom: number;
    let cx: number;
    let cy: number;
    if (kind === "explore") {
      zoom = 0.3 + 1.2 * (0.5 + 0.5 * Math.sin(t * Math.PI * 6));
      cx = side * (0.5 + 0.4 * Math.sin(t * Math.PI * 2));
      cy = side * (0.5 + 0.4 * Math.sin(t * Math.PI * 4));
    } else {
      zoom = Math.min(SCREEN.w, SCREEN.h) / (side * 1.05);
      cx = side / 2 + Math.sin(t * Math.PI * 2) * 40;
      cy = side / 2 + Math.cos(t * Math.PI * 2) * 40;
    }
    out.push({ x: SCREEN.w / 2 - cx * zoom, y: SCREEN.h / 2 - cy * zoom, zoom });
  }
  return out;
}

interface FrameHooks {
  /** Upload and draw, in the browser: returns [uploadMs, drawMs]. */
  draw?: (inst: Instances, v: Viewport) => [number, number];
}

export interface FrameResult {
  cpu: Stats;
  upload?: Stats;
  draw?: Stats;
  total?: Stats;
  visible: number;
}

function runFrames(
  engine: BenchEngine,
  scene: BenchScene,
  kind: "explore" | "overview",
  hooks: FrameHooks = {},
  frames = 400,
  budgetMs = 8000,
): FrameResult {
  const path = cameraPath(scene, kind, frames);
  for (let i = 0; i < 20; i++) engine.frame(path[i % path.length]!, SCREEN, MARGIN);
  const cpu: number[] = [];
  const up: number[] = [];
  const dr: number[] = [];
  const tot: number[] = [];
  let visible = 0;
  const start = performance.now();
  for (let f = 0; f < path.length; f++) {
    const v = path[f]!;
    const t0 = performance.now();
    const inst = engine.frame(v, SCREEN, MARGIN);
    const t1 = performance.now();
    cpu.push(t1 - t0);
    visible = Math.max(visible, inst.count);
    if (hooks.draw) {
      const [u, d] = hooks.draw(inst, v);
      up.push(u);
      dr.push(d);
      tot.push(performance.now() - t0);
    }
    if (performance.now() - start > budgetMs) break;
  }
  return {
    cpu: stats(cpu),
    visible,
    ...(hooks.draw ? { upload: stats(up), draw: stats(dr), total: stats(tot) } : {}),
  };
}

export interface CpuResult {
  engine: string;
  n: number;
  load: Stats;
  explore: FrameResult;
  overview: FrameResult;
  hit: Stats;
  /** Mean per hit over batches of 1,000 (immune to a coarse timer). */
  hitBatchMeanUs: number;
  box: Stats;
  boxCount: number;
  move: Stats;
  bytes: number | null;
  calls?: { frame: number; hit: number; move: number };
}

export interface RunOptions {
  hooks?: FrameHooks;
  /** Overall budget per scenario, ms. */
  budget?: number;
}

/** The selection a move drags: 500 items picked at random, the same each time. */
function pickIds(scene: BenchScene, count: number, seed = 7): string[] {
  const rnd = random(seed);
  const ids = new Set<string>();
  while (ids.size < Math.min(count, scene.items.length)) {
    ids.add(scene.items[Math.floor(rnd() * scene.items.length)]!.id);
  }
  return [...ids];
}

function hitPoints(scene: BenchScene, count: number, seed = 3): Float64Array {
  const rnd = random(seed);
  const pts = new Float64Array(count * 2);
  for (let i = 0; i < count * 2; i++) pts[i] = rnd() * scene.world.w;
  return pts;
}

export function runCpu(make: () => BenchEngine, n: number, options: RunOptions = {}): CpuResult {
  const budget = options.budget ?? 6000;
  const scene = makeScene(n);
  const engine = make();
  // Load: the same engine reloaded (each load replaces the document).
  const load = sample(n >= 100_000 ? 5 : 15, budget, () => engine.load(scene.items));
  const explore = runFrames(engine, scene, "explore", options.hooks ?? {}, 400, budget);
  const calls = { frame: engine.calls ?? 0, hit: 0, move: 0 };
  const overview = runFrames(engine, scene, "overview", options.hooks ?? {}, 400, budget);

  const pts = hitPoints(scene, 10_000);
  for (let i = 0; i < 200; i++) engine.hit(pts[i * 2]!, pts[i * 2 + 1]!);
  const hit = sample(10_000, budget, (i) => engine.hit(pts[i * 2]!, pts[i * 2 + 1]!));
  calls.hit = engine.calls ?? 0;
  const batch = Math.min(1000, hit.length);
  const tb = performance.now();
  for (let i = 0; i < batch; i++) engine.hit(pts[i * 2]!, pts[i * 2 + 1]!);
  const hitBatchMeanUs = ((performance.now() - tb) * 1000) / batch;

  // A box over a quarter of the world: thousands of items at 20k.
  const w = scene.world.w;
  const rect: Bounds = { x: w * 0.25, y: w * 0.25, w: w * 0.5, h: w * 0.5 };
  let boxCount = 0;
  const box = sample(50, budget, (i) => {
    boxCount = engine.box(rect, i % 2 === 1).length;
  });
  boxCount = engine.box(rect, false).length;

  const ids = pickIds(scene, 500);
  const move = sample(n >= 100_000 ? 20 : 60, budget, (i) => {
    const d = i % 2 === 0 ? 37 : -37;
    engine.move(ids, d, d / 2);
  });
  calls.move = engine.calls ?? 0;

  return {
    engine: engine.name,
    n,
    load: stats(load),
    explore,
    overview,
    hit: stats(hit),
    hitBatchMeanUs,
    box: stats(box),
    boxCount,
    move: stats(move),
    bytes: engine.bytes(),
    ...(engine.calls !== undefined ? { calls } : {}),
  };
}

/** The three engines must answer alike before their times mean anything. */
export function crossCheck(engines: BenchEngine[], n: number): string[] {
  const scene = makeScene(n, 11);
  for (const e of engines) e.load(scene.items);
  const problems: string[] = [];
  const pts = hitPoints(scene, 500, 5);
  for (let i = 0; i < 500; i++) {
    const answers = engines.map((e) => e.hit(pts[i * 2]!, pts[i * 2 + 1]!));
    if (new Set(answers).size > 1) problems.push(`hit ${i}: ${answers.join(" / ")}`);
  }
  const w = scene.world.w;
  for (const contain of [false, true]) {
    const rect = { x: w * 0.1, y: w * 0.2, w: w * 0.3, h: w * 0.4 };
    const answers = engines.map((e) => e.box(rect, contain).sort().join(","));
    if (new Set(answers).size > 1) problems.push(`box contain=${contain} differs`);
  }
  for (const v of cameraPath(scene, "explore", 30)) {
    const counts = engines.map((e) => e.frame(v, SCREEN, MARGIN).count);
    if (new Set(counts).size > 1) problems.push(`frame count differs: ${counts.join(" / ")}`);
  }
  const ids = pickIds(scene, 100);
  for (const e of engines) e.move(ids, 333, -333);
  for (let i = 0; i < 200; i++) {
    const answers = engines.map((e) => e.hit(pts[i * 2]!, pts[i * 2 + 1]!));
    if (new Set(answers).size > 1) problems.push(`hit after move ${i}: ${answers.join(" / ")}`);
  }
  return problems.slice(0, 10);
}
