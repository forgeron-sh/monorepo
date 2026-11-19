import react from "@astrojs/react";
import { blueprint } from "@forgeron/blueprint/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://forgeron.sh",
  server: { port: 5173 },
  integrations: [react()],
  // @forgeron/ui, @forgeron/blueprint and @forgeron/icons ship as TypeScript sources: Vite must
  // compile them at build time.
  // `blueprint()`: imports of `*.bp` scenes, compiled to SceneBin at build time (`?compiled`),
  // in the pages and in the worker that plays the iso scenes (a module worker: it splits chunks).
  vite: {
    plugins: [blueprint()],
    worker: { format: "es", plugins: () => [blueprint()] },
    ssr: { noExternal: ["@forgeron/ui", "@forgeron/blueprint", "@forgeron/icons"] },
  },
});
