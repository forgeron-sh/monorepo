// Fails when a neutral entry point imports a Node module: the SDK runs in a tool's Worker, and
// `@forgeron/hosting` runs in the gateway (a Worker) as well as in the CLI.
import { nodeImportsOf } from "./neutral";

const ENTRIES = ["packages/sdk/src/index.ts", "packages/hosting/src/index.ts"];

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
