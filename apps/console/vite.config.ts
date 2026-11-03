import { defineConfig } from "vite";

// `manifest` lists the build's files (`dist/.vite/manifest.json`); `platform install` skips it.
// The build is what the gateway serves at the workspace origin (`apps/gateway/wrangler.jsonc`, `assets`).
export default defineConfig({ build: { outDir: "dist", emptyOutDir: true, manifest: true } });
