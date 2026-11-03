import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["scripts/build-templates.ts"],
    include: [
      "apps/*/src/**/*.test.{ts,tsx}",
      "packages/*/src/**/*.test.ts",
      "packages/ui/tokens/*.test.ts",
      "templates/*/tests/**/*.test.ts",
    ],
    passWithNoTests: true,
  },
});
