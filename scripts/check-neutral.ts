// Fails when a neutral entry point imports a Node module: the SDK runs in a tool's Worker, and
// `@forgeron/hosting` runs in the gateway (a Worker) as well as in the CLI.
import { nodeImportsOf } from "./neutral";

const ENTRIES = [
  "packages/sdk/src/index.ts",
  "packages/hosting/src/index.ts",
  "packages/registry/src/index.ts",
  // The files of a new tool: the gateway makes them in its Worker (D-123).
  "packages/scaffold/src/index.ts",
  // Blueprint's core renders the site's illustrations at build time and in the browser.
  "packages/blueprint/src/index.ts",
  // Forgeron Sans: the glyph table and `textSvg` run at build time and in the browser.
  "packages/font/src/index.ts",
  // The effects' core: presets and CPU passes run at build time and in a Worker (D-149).
  "packages/shaders/src/index.ts",
  // The rich text core (JSON, Markdown, static renderer) renders previews in a Worker.
  "packages/richtext/src/index.ts",
  // The core halves of its plugins: a read-only place imports them with the core.
  "packages/richtext/src/plugins/index.ts",
  // The flow graph, its plugin host and the core halves of its plugins: a run plan on a server, a
  // Worker validating a graph, a layout computed outside the browser.
  // The board's JSON, its plugin host, the SVG export and the core halves of the draw plugins: a
  // board preview in a Worker, an export at build time.
  "packages/draw/src/index.ts",
  "packages/draw/src/plugins/index.ts",
  "packages/flow/src/index.ts",
  "packages/flow/src/plugins/index.ts",
];

let failed = false;
for (const entry of ENTRIES) {
  const found = await nodeImportsOf(entry);
  if (found.length > 0) {
    failed = true;
    console.error(
      `${entry} imports Node modules, which a Worker does not have: ${found.join(", ")}`,
    );
  } else {
    console.log(`${entry}: no Node module in the bundle.`);
  }
}
if (failed) process.exit(1);
