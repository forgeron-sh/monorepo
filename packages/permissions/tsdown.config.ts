import { defineConfig } from "tsdown";

// The published build of @forgeron/permissions (D-122): ES modules and their types in dist/. The
// workspace keeps using src/; scripts/pack.ts writes the package.json that npm receives.
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: "esm",
  platform: "neutral",
  dts: true,
  clean: true,
  outDir: "dist",
});
