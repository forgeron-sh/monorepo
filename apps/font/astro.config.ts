import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://font.forgeron.sh",
  server: { port: 5180 },
  // @forgeron/icons ships as TypeScript sources: Vite compiles it. Icons render at build time.
  vite: { ssr: { noExternal: ["@forgeron/icons"] } },
});
