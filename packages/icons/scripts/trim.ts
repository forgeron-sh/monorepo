// Trims the rows of every drawing in src/drawn/: trailing `.` and trailing empty rows go, since
// `pixelRows` pads each icon back to its grid. Leading empty rows stay as "" (they place the
// drawing). Measured on 2026-11-17 over 322 drawn icons: −23 % of the icon data raw, −11 %
// gzipped, with the same rendered output.
//
// bun run trim           rewrite the files
// bun run trim --check   exit 1 and list the files that are not trimmed

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/drawn");
const check = process.argv.includes("--check");
const skip = new Set(
  process.argv.filter((a) => a.startsWith("--skip=")).flatMap((a) => a.slice(7).split(",")),
);

// The rows block, with or without the `prettier-ignore` that keeps one row per line (oxfmt would
// otherwise fold a short trimmed array onto one line and the drawing would stop reading as a grid).
const ROWS = /( {2}\/\/ prettier-ignore\n)? {2}rows: \[([\s\S]*?)\],/;
const IGNORE = "  // prettier-ignore\n";

function block(rows: readonly string[]): string {
  return `${IGNORE}  rows: [\n${rows.map((r) => `    "${r}",`).join("\n")}\n  ],`;
}

function trimRows(rows: readonly string[]): string[] {
  const out = rows.map((row) => row.replace(/\.+$/, ""));
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out;
}

const stale: string[] = [];
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".ts"))
  .sort()) {
  if (skip.has(file.replace(/\.ts$/, ""))) continue;
  const path = join(dir, file);
  const source = readFileSync(path, "utf8");
  const match = ROWS.exec(source);
  if (!match) throw new Error(`${file}: no rows block found`);
  const rows = [...(match[2] ?? "").matchAll(/"([.#o]*)"/g)].map((m) => m[1] ?? "");
  const next = block(trimRows(rows));
  if (match[0] === next) continue;
  stale.push(file);
  if (check) continue;
  writeFileSync(path, source.replace(ROWS, next));
}

if (check && stale.length > 0) {
  console.error(`Not trimmed (run \`bun run trim\` in packages/icons):\n  ${stale.join("\n  ")}`);
  process.exit(1);
}
console.log(check ? "src/drawn/ is trimmed." : `Trimmed ${stale.length} drawings.`);
