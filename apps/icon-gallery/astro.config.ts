import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://icons.forgeron.sh",
  server: { port: 5179 },
  integrations: [react()],
  // @forgeron/icons ships as TypeScript sources: Vite compiles it.
  vite: { ssr: { noExternal: ["@forgeron/icons"] } },
});
