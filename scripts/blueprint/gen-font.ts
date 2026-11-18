// Writes crates/fg-blueprint/src/font.rs from packages/blueprint/src/core/font.ts.
//   bun scripts/blueprint/gen-font.ts
import { writeFileSync } from "node:fs";
import { fontRust } from "../../packages/blueprint/src/engine/codegen";

const target = new URL("../../crates/fg-blueprint/src/font.rs", import.meta.url);
writeFileSync(target, fontRust());
console.log(`wrote ${target.pathname}`);
