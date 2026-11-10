import { defineConfig } from "tsdown";

// The published build of @forgeron/sdk (D-122): one ES module and its types per entry of `exports`,
// in dist/. The workspace keeps using src/; scripts/pack.ts writes the package.json that npm receives.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "db/index": "src/db/index.ts",
    "react/index": "src/react/index.ts",
    "testing/index": "src/testing/index.ts",
    "testing/memory-d1": "src/testing/memory-d1.ts",
  },
  format: "esm",
  platform: "neutral",
  dts: true,
  clean: true,
  outDir: "dist",
});
