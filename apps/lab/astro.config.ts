import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://lab.forgeron.sh",
  server: { port: 5184 },
  integrations: [react()],
  // The workspace packages ship as TypeScript sources: Vite compiles them.
  vite: {
    ssr: { noExternal: ["@forgeron/ui", "@forgeron/icons", "@forgeron/font", "@forgeron/shaders"] },
  },
});
