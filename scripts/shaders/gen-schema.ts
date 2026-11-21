// Writes the JSON schema of shader presets, version 1, from the params of the passes and sources
// (`presetSchema()` of packages/shaders). A test fails when the written file is stale.
// Run: bun scripts/shaders/gen-schema.ts
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { presetSchema } from "../../packages/shaders/src/index";

const out = "packages/shaders/schema/preset.v1.json";
writeFileSync(out, `${JSON.stringify(presetSchema(), null, 2)}\n`);
spawnSync("bunx", ["oxfmt", out], { stdio: "inherit" });
console.log(`wrote ${out}`);
