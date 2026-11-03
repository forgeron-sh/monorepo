// `bun run templates:check`: every folder of templates/ is a tool with tests, and is part of the
// preview workflow, so that a new template cannot escape CI (docs/ARCHITECTURE.md: templates are
// the SDK's integration tests).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const templates = readdirSync(join(root, "templates"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const workflow = readFileSync(join(root, ".github/workflows/templates-preview.yml"), "utf8");
const listed =
  /template:\s*\[([^\]]*)\]/
    .exec(workflow)?.[1]
    ?.split(",")
    .map((t) => t.trim()) ?? [];

const problems: string[] = [];
for (const name of templates) {
  const dir = join(root, "templates", name);
  if (!existsSync(join(dir, "forgeron.config.ts"))) problems.push(`${name}: no forgeron.config.ts`);
  const tests = existsSync(join(dir, "tests")) ? readdirSync(join(dir, "tests")) : [];
  if (!tests.some((file) => /\.test\.tsx?$/.test(file)))
    problems.push(`${name}: no test in tests/`);
  if (!listed.includes(name)) {
    problems.push(`${name}: missing from the matrix of .github/workflows/templates-preview.yml`);
  }
}
for (const name of listed) {
  if (!templates.includes(name)) problems.push(`${name}: listed in the workflow, no such template`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${templates.length} templates: ${templates.join(", ")}.`);
