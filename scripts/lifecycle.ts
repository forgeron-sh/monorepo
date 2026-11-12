// Writes docs/lifecycle.md into `@forgeron/scaffold` (`LIFECYCLE`), the copy every new repository gets
// (D-121). Run it after changing docs/lifecycle.md and formatting it; a test of the CLI checks the two.
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const doc = await readFile(new URL("docs/lifecycle.md", root), "utf8");
const target = new URL("packages/scaffold/src/lifecycle.ts", root);
const source = await readFile(target, "utf8");
const updated = source.replace(
  /export const LIFECYCLE =\n {2}".*";\n/s,
  () => `export const LIFECYCLE =\n  ${JSON.stringify(doc)};\n`,
);
if (updated === source && !source.includes(JSON.stringify(doc))) {
  throw new Error(`No LIFECYCLE found in ${target.pathname}.`);
}
await writeFile(target, updated);
console.log(`LIFECYCLE written from docs/lifecycle.md (${doc.length} characters).`);
