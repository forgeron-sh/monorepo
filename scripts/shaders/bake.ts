// Writes the GLSL compiled ahead of time for the live mounts of fixed shape (`bakedFieldModule()`
// of packages/shaders: the field mount's two programs). A test fails when the written file is
// stale (docs/shaders/design.md, S2c notes).
// Run: bun scripts/shaders/bake.ts
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { bakedFieldModule } from "../../packages/shaders/src/core/bake";

const out = "packages/shaders/src/core/field.baked.ts";
writeFileSync(out, bakedFieldModule());
spawnSync("bunx", ["oxfmt", out], { stdio: "inherit" });
console.log(`wrote ${out}`);
