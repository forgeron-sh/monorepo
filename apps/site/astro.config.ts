import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://forgeron.sh",
  server: { port: 5173 },
  integrations: [react()],
  // @forgeron/ui, @forgeron/blueprint and @forgeron/icons ship as TypeScript sources: Vite must
  // compile them at build time.
  vite: { ssr: { noExternal: ["@forgeron/ui", "@forgeron/blueprint", "@forgeron/icons"] } },
});
