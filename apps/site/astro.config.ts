import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://forgeron.app",
  server: { port: 5173 },
  integrations: [react()],
  // @forgeron/ui est livré en sources TypeScript : Vite doit le compiler au build.
  vite: { ssr: { noExternal: ["@forgeron/ui"] } },
});
