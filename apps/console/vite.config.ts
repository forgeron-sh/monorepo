import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { defineConfig, type Plugin } from "vite";

// The images of the harness's README (`/console-api/api/catalog/<tool>/assets/...`): served from the mock's folder in
// `vite dev` only. A build never carries them; in production the gateway serves a tool's own bundle.
const MOCK_ASSETS = join(import.meta.dirname, "src/features/portal/mock-assets");
const mockAssets = (): Plugin => ({
  name: "forgeron-mock-assets",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const match = /^\/console-api\/api\/catalog\/[\w-]+\/assets\/img\/([\w.-]+)(\?.*)?$/.exec(
        request.url ?? "",
      );
      const file = match ? normalize(join(MOCK_ASSETS, match[1]!)) : undefined;
      if (!file || !file.startsWith(MOCK_ASSETS) || !existsSync(file)) return next();
      response.setHeader("content-type", extname(file) === ".svg" ? "image/svg+xml" : "image/png");
      createReadStream(file).pipe(response);
    });
  },
});

// `manifest` lists the build's files (`dist/.vite/manifest.json`); `platform install` skips it.
// The build is what the gateway serves at the workspace origin (`apps/gateway/wrangler.jsonc`, `assets`).
export default defineConfig({
  plugins: [mockAssets()],
  build: { outDir: "dist", emptyOutDir: true, manifest: true },
});
