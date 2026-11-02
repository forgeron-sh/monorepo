// Vitest global setup: builds every template, as `forgeron test` builds a tool before its tests.
// `createTestTool` runs the built Worker (`.forgeron/build/worker.js`).
import { buildAll } from "../packages/compiler/src/index";

export default async function setup(): Promise<void> {
  await buildAll("templates");
}
