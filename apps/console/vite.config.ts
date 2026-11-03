import { defineConfig } from "vite";

// The build is what the gateway serves at the workspace origin (`apps/gateway/wrangler.jsonc`, `assets`).
export default defineConfig({ build: { outDir: "dist", emptyOutDir: true } });
