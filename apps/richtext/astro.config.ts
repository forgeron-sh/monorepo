import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://richtext.forgeron.sh",
  server: { port: 5183 },
  integrations: [react()],
  // Prose is written across lines around inline code: keep the spaces between a word and its tag.
  compressHTML: false,
  // Monochrome code, as the rest of the lab: no syntax colours (the highlighter has its own palette).
  markdown: { syntaxHighlight: false },
  // The workspace packages ship as TypeScript sources: Vite compiles them.
  vite: {
    ssr: {
      noExternal: ["@forgeron/ui", "@forgeron/icons", "@forgeron/richtext"],
    },
  },
});
