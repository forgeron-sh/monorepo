import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["scripts/build-templates.ts"],
    include: [
      "apps/*/src/**/*.test.ts",
      "packages/*/src/**/*.test.ts",
      "templates/*/tests/**/*.test.ts",
    ],
    passWithNoTests: true,
  },
});
