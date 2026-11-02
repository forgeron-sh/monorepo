// Fails when the neutral entry point of `@forgeron/sdk` imports a Node module.
import { nodeImportsOf } from "./neutral";

const ENTRY = "packages/sdk/src/index.ts";
const found = await nodeImportsOf(ENTRY);
if (found.length > 0) {
  console.error(`${ENTRY} imports Node modules, which a Worker does not have: ${found.join(", ")}`);
  process.exit(1);
}
console.log(`${ENTRY}: no Node module in the bundle.`);
