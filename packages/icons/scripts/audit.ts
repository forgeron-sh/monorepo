// Done vs missing icons per category, from the generated manifest.
//
//   bun scripts/audit.ts           a table
//   bun scripts/audit.ts --json    the same rows as JSON
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { coverage, coverageTable } from "../src/generator/audit";
import type { IconManifestEntry } from "../src/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(root, "src/generated/manifest.json"), "utf8"),
) as IconManifestEntry[];
const rows = coverage(manifest);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(coverageTable(rows));
  const missing = manifest
    .filter((e) => e.source === "forgeron" && !e.implemented)
    .map((e) => e.name);
  if (missing.length > 0) console.log(`\nOwn icons still to draw: ${missing.join(", ")}`);
}
