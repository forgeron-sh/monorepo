import react from "@astrojs/react";
import { blueprint } from "@forgeron/blueprint/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://forgeron.sh",
  server: { port: 5173 },
  integrations: [react()],
  // @forgeron/ui, @forgeron/blueprint and @forgeron/icons ship as TypeScript sources: Vite must
  // compile them at build time.
  // `blueprint()`: imports of `*.bp` scenes, compiled to SceneBin at build time (`?compiled`).
  vite: {
    plugins: [blueprint()],
    ssr: { noExternal: ["@forgeron/ui", "@forgeron/blueprint", "@forgeron/icons"] },
  },
});
