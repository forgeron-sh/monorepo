// Writes crates/fg-blueprint/src/layout.rs from packages/blueprint/src/engine/layout.ts.
//   bun scripts/blueprint/gen-layout.ts
import { writeFileSync } from "node:fs";
import { layoutRust } from "../../packages/blueprint/src/engine/codegen";

const target = new URL("../../crates/fg-blueprint/src/layout.rs", import.meta.url);
writeFileSync(target, layoutRust());
console.log(`wrote ${target.pathname}`);
