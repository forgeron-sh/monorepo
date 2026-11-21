import { defineConfig } from "vitest/config";
import { blueprint } from "./src/vite";

// Every suite of the package: the unit tests of src/ (also run by the root configuration) and
// the parity and perf suites of test/, against the TypeScript reference, under Node (parity is
// defined against V8's Math, docs/blueprint/engine.md §5).
//   bunx vitest run --config packages/blueprint/vitest.config.ts
export default defineConfig({
  plugins: [blueprint()],
  test: {
    root: new URL(".", import.meta.url).pathname,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    testTimeout: 120_000,
    maxWorkers: 4,
    // The player's suite measures the heap of its loop (`gc()`).
    execArgv: ["--expose-gc"],
  },
});
