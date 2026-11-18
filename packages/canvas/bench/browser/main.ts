// The browser half of the benchmark (V8): the same scenarios as the Bun runner, plus upload and
// draw through the WebGL2 renderer. Bundled and served by `bench/browser.ts`; posts its results.

import {
  boundaryCost,
  STRIDE,
  tsEngine,
  tsIndex,
  wasmCore,
  type BenchEngine,
  type CoreGlue,
} from "../engines";
import {
  cameraPath,
  crossCheck,
  MARGIN,
  runCpu,
  SCREEN,
  SIZES,
  stats,
  type CpuResult,
  type Stats,
} from "../scenarios";
import { makeScene } from "../scene-data";
import { createRenderer } from "../webgl2";

const post = (path: string, body: unknown) =>
  fetch(path, { method: "POST", body: JSON.stringify(body) });
const log = (msg: string) => void post("/log", msg);
addEventListener("error", (e) => void post("/log", `error: ${e.message}`));

async function loadGlue(variant: string) {
  const url = `/wasm/${variant}/fg_canvas_core.js`;
  const glue = (await import(/* @vite-ignore */ url)) as CoreGlue;
  const bytes = await (await fetch(`/wasm/${variant}/fg_canvas_core_bg.wasm`)).arrayBuffer();
  const { memory } = glue.initSync({ module: bytes });
  return { glue, memory };
}

const gc = (globalThis as unknown as { gc?: () => void }).gc;
const heap = () =>
  (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;

async function main() {
  const params = new URLSearchParams(location.search);
  const sizes = params.get("sizes")?.split(",").map(Number) ?? SIZES;
  const budget = Number(params.get("budget") ?? 6000);
  const small = await loadGlue("release-opt");
  const fast = await loadGlue("release-speed-opt");
  const makers: (() => BenchEngine)[] = [
    tsEngine,
    tsIndex,
    () => wasmCore(small.glue, small.memory, "rust-wasm (Oz)"),
    () => wasmCore(fast.glue, fast.memory, "rust-wasm (O3)"),
  ];
  const problems = crossCheck(
    makers.map((m) => m()),
    5000,
  );
  if (problems.length) {
    await post("/log", "The engines disagree:\n" + problems.join("\n"));
    await post("/result", { error: "cross-check" });
    return;
  }
  log("cross-check ok");

  const canvas = document.querySelector("canvas")!;
  canvas.width = SCREEN.w;
  canvas.height = SCREEN.h;
  const renderer = createRenderer(canvas, STRIDE);
  const draw = (
    inst: { data: Float32Array; count: number },
    v: { x: number; y: number; zoom: number },
  ) => renderer.draw(inst.data, inst.count, v, false);
  // The GPU time, apart: SwiftShader rasterises on the CPU, tens of ms a frame, the same whoever
  // built the buffer. A few synchronised frames per size and path, from the TypeScript index.
  const gpu: { n: number; path: string; visible: number; draw: Stats }[] = [];

  const results: (CpuResult & { heap?: number; itemsHeap?: number; wasmMemory?: number })[] = [];
  for (const n of sizes) {
    for (const make of makers) {
      const name = make().name;
      let mem: { heap: number; items: number } | null = null;
      if (gc) {
        gc();
        const h0 = heap();
        const scene = makeScene(n);
        gc();
        const h1 = heap();
        const e = make();
        e.load(scene.items);
        gc();
        mem = { heap: heap() - h1, items: h1 - h0 };
        if (e.hit(-1, -1) === "never" && scene.items.length < 0) log("");
      }
      const r = runCpu(make, n, { budget, hooks: { draw } });
      const wasmMemory = name.startsWith("rust")
        ? (name.includes("O3") ? fast : small).memory.buffer.byteLength
        : undefined;
      results.push({
        ...r,
        ...(mem ? { heap: mem.heap, itemsHeap: mem.items } : {}),
        ...(wasmMemory ? { wasmMemory } : {}),
      });
      log(
        `${n} ${name}: explore cpu p50 ${r.explore.cpu.p50.toFixed(3)} total p50 ${r.explore.total?.p50.toFixed(3)}`,
      );
      await new Promise((res) => setTimeout(res, 0));
    }
  }
  for (const n of sizes) {
    const e = tsIndex();
    const scene = makeScene(n);
    e.load(scene.items);
    for (const path of ["explore", "overview"] as const) {
      const times: number[] = [];
      let visible = 0;
      for (const v of cameraPath(scene, path, 30)) {
        const inst = e.frame(v, SCREEN, MARGIN);
        visible = Math.max(visible, inst.count);
        times.push(renderer.draw(inst.data, inst.count, v, true)[1]);
      }
      gpu.push({ n, path, visible, draw: stats(times) });
    }
  }
  const boundary = boundaryCost(small.glue, () => performance.now());
  await post("/result", {
    machine: {
      runtime: `${navigator.userAgent.match(/(HeadlessChrome|Chrome)\/[\d.]+/)?.[0] ?? "Chrome"} (V8)`,
      gpu: renderer.info,
      crossOriginIsolated: String(crossOriginIsolated),
    },
    boundary,
    gpu,
    results,
  });
}

main().catch((e: unknown) => post("/result", { error: String(e) }));
