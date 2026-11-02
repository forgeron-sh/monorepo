import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://forgeron.app",
  server: { port: 5173 },
  integrations: [react()],
  // @forgeron/ui ships as TypeScript sources: Vite must compile it at build time.
  vite: { ssr: { noExternal: ["@forgeron/ui"] } },
});
