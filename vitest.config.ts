import { defineConfig } from "vitest/config";
import { blueprint } from "./packages/blueprint/src/vite";

export default defineConfig({
  // Imports of `*.bp` files (Blueprint scenes, docs/blueprint/format.md).
  plugins: [blueprint()],
  test: {
    globalSetup: ["scripts/build-templates.ts"],
    include: [
      "apps/*/src/**/*.test.{ts,tsx}",
      "packages/*/src/**/*.test.ts",
      "packages/blueprint/test/parity/still.test.ts",
      "packages/ui/tokens/*.test.ts",
      "scripts/*.test.ts",
      "templates/*/tests/**/*.test.ts",
    ],
    passWithNoTests: true,
  },
});
