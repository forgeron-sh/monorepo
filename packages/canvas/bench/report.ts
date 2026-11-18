// Markdown tables from the results of a run, Bun or browser.

import type { CpuResult, FrameResult, Stats } from "./scenarios";

export interface RunReport {
  machine: Record<string, string | number>;
  boundary: { noopNs: number; jsNoopNs: number };
  results: (CpuResult & { heap?: number; itemsHeap?: number; wasmMemory?: number })[];
  gpu?: { n: number; path: string; visible: number; draw: Stats }[];
}

const ms = (v: number) =>
  v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3);
const us = (v: number) => (v * 1000 >= 100 ? (v * 1000).toFixed(0) : (v * 1000).toFixed(1));
const mb = (b: number | null | undefined) => (b == null ? "–" : `${(b / 2 ** 20).toFixed(1)} MB`);
const n = (v: number) => v.toLocaleString("en-US");
const pct = (s: Stats) => `${ms(s.p50)} / ${ms(s.p95)} / ${ms(s.p99)}`;

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map((_, i) => (i < 2 ? "---" : "--:")).join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

function frameRows(results: RunReport["results"], pick: (r: CpuResult) => FrameResult) {
  return results.map((r) => {
    const f = pick(r);
    const row = [n(r.n), r.engine, n(f.visible), pct(f.cpu)];
    if (f.total && f.upload && f.draw) {
      row.push(ms(f.upload.p50), ms(f.draw.p50), pct(f.total), `${f.total.n}`);
    } else row.push(`${f.cpu.n}`);
    return row;
  });
}

export function report(run: RunReport): string {
  const { results } = run;
  const gpu = results.some((r) => r.explore.total);
  const fh = ["items", "engine", "visible", "cull + build p50 / p95 / p99 (ms)"];
  const fhead = gpu
    ? [...fh, "upload p50", "submit p50", "CPU frame p50 / p95 / p99", "frames"]
    : [...fh, "frames"];
  const out = [
    `Machine: ${Object.values(run.machine).join(", ")}`,
    "",
    "### Frame, explore (pan and zoom 0.3–1.5)",
    table(
      fhead,
      frameRows(results, (r) => r.explore),
    ),
    "",
    "### Frame, overview (everything in view)",
    table(
      fhead,
      frameRows(results, (r) => r.overview),
    ),
    "",
    ...(run.gpu
      ? [
          "### Draw, waiting for the GPU (SwiftShader, 30 frames each)",
          table(
            ["items", "path", "visible", "draw p50 / p95 / p99 (ms)"],
            run.gpu.map((g) => [n(g.n), g.path, n(g.visible), pct(g.draw)]),
          ),
          "",
        ]
      : []),
    "### Hit test (10,000 random points), box select, move 500",
    table(
      [
        "items",
        "engine",
        "hit p50 / p99 (µs)",
        "hit mean (µs)",
        "box p50 (ms)",
        "box hits",
        "move 500 p50 / p99 (ms)",
        "load p50 (ms)",
      ],
      results.map((r) => [
        n(r.n),
        r.engine,
        `${us(r.hit.p50)} / ${us(r.hit.p99)}` + (r.hit.n < 10_000 ? ` (${r.hit.n} samples)` : ""),
        r.hitBatchMeanUs.toFixed(2),
        ms(r.box.p50),
        n(r.boxCount),
        `${ms(r.move.p50)} / ${ms(r.move.p99)}`,
        ms(r.load.p50),
      ]),
    ),
    "",
    "### Memory",
    table(
      [
        "items",
        "engine",
        "JS heap added by the engine",
        "engine's own count",
        "wasm linear memory",
        "the Item objects",
      ],
      results.map((r) => [
        n(r.n),
        r.engine,
        mb(r.heap),
        mb(r.bytes),
        mb(r.wasmMemory),
        mb(r.itemsHeap),
      ]),
    ),
    "",
    `Boundary: one call to an exported no-op costs ${run.boundary.noopNs.toFixed(1)} ns (a JS no-op: ${run.boundary.jsNoopNs.toFixed(1)} ns). ` +
      `Calls into WebAssembly: ${results.find((r) => r.calls)?.calls ? JSON.stringify(results.find((r) => r.calls)!.calls) : "–"} (per frame, per hit, per move).`,
  ];
  return out.join("\n");
}
