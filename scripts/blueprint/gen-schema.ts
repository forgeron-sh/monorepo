// Writes the JSON schema of Blueprint files, version 1, from its source in the package
// (`packages/blueprint/src/format/schema.ts`). A test fails when the written file is stale.
// Run: bun scripts/blueprint/gen-schema.ts
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { formatJson, SCHEMA } from "../../packages/blueprint/src/format";

const out = "packages/blueprint/schema/blueprint.v1.json";
writeFileSync(out, formatJson(SCHEMA));
spawnSync("bunx", ["oxfmt", out], { stdio: "inherit" });
console.log(`wrote ${out}`);
