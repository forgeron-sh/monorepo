// `bun run templates:check`: every folder of templates/ is a tool with a config and tests, so that a
// new template cannot escape CI (docs/ARCHITECTURE.md: templates are the SDK's integration tests).
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const templates = readdirSync(join(root, "templates"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const problems: string[] = [];
for (const name of templates) {
  const dir = join(root, "templates", name);
  if (!existsSync(join(dir, "forgeron.config.ts"))) problems.push(`${name}: no forgeron.config.ts`);
  const tests = existsSync(join(dir, "tests")) ? readdirSync(join(dir, "tests")) : [];
  if (!tests.some((file) => /\.test\.tsx?$/.test(file)))
    problems.push(`${name}: no test in tests/`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${templates.length} templates: ${templates.join(", ")}.`);
