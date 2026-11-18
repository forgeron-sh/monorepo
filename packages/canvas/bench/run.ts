// The CPU benchmark under Bun (JavaScriptCore):
//   bun packages/canvas/bench/build-wasm.ts   # once, and after each change of the crate
//   bun packages/canvas/bench/run.ts [--sizes 1000,20000] [--quick]
// Writes target/bench/bun.json and prints the tables of docs/benchmarks/canvas-engine.md.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, loadavg, release, totalmem } from "node:os";
import {
  boundaryCost,
  tsEngine,
  tsIndex,
  wasmCore,
  type BenchEngine,
  type CoreGlue,
} from "./engines";
import { report } from "./report";
import { crossCheck, runCpu, SIZES, type CpuResult } from "./scenarios";
import { makeScene } from "./scene-data";

const root = new URL("../../../", import.meta.url).pathname;
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const sizes = arg("sizes")?.split(",").map(Number) ?? SIZES;
const quick = process.argv.includes("--quick");

async function loadGlue(variant: string): Promise<{ glue: CoreGlue; memory: WebAssembly.Memory }> {
  const dir = `${root}target/fg-canvas-core-web/${variant}`;
  const glue = (await import(`${dir}/fg_canvas_core.js`)) as CoreGlue;
  const { memory } = glue.initSync({ module: readFileSync(`${dir}/fg_canvas_core_bg.wasm`) });
  return { glue, memory };
}

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
  console.error("The engines disagree:\n" + problems.join("\n"));
  process.exit(1);
}
console.error("cross-check: the four engines agree on hit, box, culling and moves (5,000 items)");

/** The JS heap an engine adds once loaded, after a full collection. */
function heapDelta(make: () => BenchEngine, n: number): { heap: number; items: number } {
  Bun.gc(true);
  const h0 = process.memoryUsage().heapUsed;
  const scene = makeScene(n);
  Bun.gc(true);
  const h1 = process.memoryUsage().heapUsed;
  const engine = make();
  engine.load(scene.items);
  Bun.gc(true);
  const h2 = process.memoryUsage().heapUsed;
  // Keep both alive until measured.
  if (engine.hit(-1, -1) === "never" && scene.items.length < 0) console.log("");
  return { heap: h2 - h1, items: h1 - h0 };
}

const results: (CpuResult & { heap: number; itemsHeap: number; wasmMemory?: number })[] = [];
for (const n of sizes) {
  for (const make of makers) {
    const name = make().name;
    const mem = heapDelta(make, n);
    const r = runCpu(make, n, { budget: quick ? 1500 : 6000 });
    const wasmMemory = name.startsWith("rust")
      ? (name.includes("O3") ? fast : small).memory.buffer.byteLength
      : undefined;
    results.push({
      ...r,
      heap: mem.heap,
      itemsHeap: mem.items,
      ...(wasmMemory ? { wasmMemory } : {}),
    });
    console.error(
      `${n} ${name}: explore p50 ${r.explore.cpu.p50.toFixed(3)} ms, overview p50 ${r.overview.cpu.p50.toFixed(3)} ms, hit p50 ${(r.hit.p50 * 1000).toFixed(1)} µs`,
    );
  }
}

const boundary = boundaryCost(small.glue, () => performance.now());
const machine = {
  runtime: `Bun ${Bun.version} (JavaScriptCore)`,
  cpu: cpus()[0]?.model ?? "?",
  cores: cpus().length,
  memoryGb: Math.round(totalmem() / 2 ** 30),
  os: `${process.platform} ${process.arch} ${release()}`,
  loadAverage: loadavg()
    .map((l) => l.toFixed(1))
    .join(" "),
};
mkdirSync(`${root}target/bench`, { recursive: true });
writeFileSync(
  `${root}target/bench/bun.json`,
  JSON.stringify({ machine, boundary, results }, null, 2),
);
console.log(report({ machine, boundary, results }));
