import react from "@astrojs/react";
import { blueprint } from "@forgeron/blueprint/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://blueprint.forgeron.sh",
  server: { port: 5182 },
  integrations: [react()],
  // Monochrome code, as the rest of the lab: no syntax colours.
  markdown: { syntaxHighlight: false },
  // The workspace packages ship as TypeScript sources: Vite compiles them.
  // `blueprint()`: imports of `*.bp` files, compiled to SceneBin at build time (`?compiled`).
  vite: {
    plugins: [blueprint()],
    ssr: {
      noExternal: [
        "@forgeron/ui",
        "@forgeron/icons",
        "@forgeron/blueprint",
        "@forgeron/libraries",
        "@forgeron/canvas",
      ],
    },
  },
});
