// Builds one tool: `bun scripts/build-tool.ts <dir>`. A template's typecheck needs it first, because
// `.forgeron/generated/db.d.ts` (the types of `ctx.db`) is written by the build and not committed.
import { buildTool } from "../packages/compiler/src/index";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: bun scripts/build-tool.ts <tool folder>");
  process.exit(2);
}
const result = await buildTool(dir);
console.log(`${result.name}@${result.version} built`);
