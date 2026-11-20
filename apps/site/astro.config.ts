import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { blueprint } from "@forgeron/blueprint/vite";
import { defineConfig } from "astro/config";
import { labTheme } from "./src/lib/code-theme";

export default defineConfig({
  site: "https://forgeron.sh",
  server: { port: 5173 },
  // `mdx()`: the blog's posts (`src/content/blog/*.mdx`), with their components.
  integrations: [react(), mdx()],
  // Code blocks of the posts, in the lab palette.
  markdown: { shikiConfig: { theme: labTheme } },
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
