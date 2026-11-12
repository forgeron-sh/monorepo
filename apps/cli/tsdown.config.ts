import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

// The published build of the CLI, `forgeron` on npm (D-122): one file for Node, with the platform's
// own packages inside (compiler, hosting, registry, platform contract, playground, scaffold). The SDK, the
// runtime and the manifest stay dependencies: the compiler bundles the runtime and the SDK a tool is
// built with, resolved from where the CLI is installed.
const { version } = JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf8")) as {
  version: string;
};

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: "esm",
  platform: "node",
  target: "node24",
  dts: false,
  clean: true,
  outDir: "dist",
  noExternal: [
    /^@forgeron\/(compiler|hosting|platform-contract|playground|registry|scaffold)(\/|$)/,
  ],
  define: { __FORGERON_VERSION__: JSON.stringify(version) },
});
