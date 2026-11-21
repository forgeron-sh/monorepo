// The time auto-layout takes on generated flows: `bun packages/flow/bench/layout.ts`.
// Prints the median and worst of 20 runs per size, after 3 warm-up runs.

import { generateFlowGraph, layoutGraph } from "../src/index";

const sizes: Array<[number, number]> = [
  [100, 140],
  [500, 700],
  [1000, 1400],
  [2000, 2800],
];
console.log("nodes  edges  median ms  worst ms  layers  crossings");
for (const [nodes, edges] of sizes) {
  const graph = generateFlowGraph({ nodes, edges, seed: 3 });
  for (let i = 0; i < 3; i++) layoutGraph(graph);
  const times: number[] = [];
  let last = layoutGraph(graph);
  for (let i = 0; i < 20; i++) {
    const t = performance.now();
    last = layoutGraph(graph);
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)]!;
  console.log(
    [
      String(nodes).padStart(5),
      String(edges).padStart(6),
      median.toFixed(2).padStart(10),
      times.at(-1)!.toFixed(2).padStart(9),
      String(last.layers.length).padStart(7),
      String(last.crossings).padStart(10),
    ].join(" "),
  );
}
