import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://ui.forgeron.sh",
  server: { port: 5181 },
  integrations: [react()],
  // The workspace packages ship as TypeScript sources: Vite compiles them.
  vite: {
    ssr: {
      noExternal: ["@forgeron/ui", "@forgeron/icons", "@forgeron/blueprint", "@forgeron/canvas"],
    },
  },
});
