// Checks that each import rule (.dependency-cruiser.cjs) rejects what it should reject.
// For each case, writes temporary offending files, runs dependency-cruiser on them, expects the
// rule to fire, then deletes the files. A rule that no longer rejects anything fails
// `bun run check` (dependency-cruiser says nothing when it analyzes no module: see D-002).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = require("../.dependency-cruiser.cjs") as { forbidden: { name: string }[] };

interface Case {
  rule: string;
  files: Record<string, string>; // path relative to the root → content
}

// Cases also write the import target: packages do not need to exist yet, and the relative
// import keeps no-unresolved from rejecting the case before the rule under test.
const F = "__boundary_fixture";
const STUB = "export {};\n";
const cases: Case[] = [
  {
    rule: "no-cycles",
    files: {
      [`packages/sdk/src/${F}_a.ts`]: `import "./${F}_b.ts";\n`,
      [`packages/sdk/src/${F}_b.ts`]: `import "./${F}_a.ts";\n`,
    },
  },
  {
    rule: "no-unresolved",
    files: { [`packages/sdk/src/${F}.ts`]: `import "./does-not-exist.ts";\n` },
  },
  {
    rule: "packages-do-not-import-apps",
    files: {
      [`packages/sdk/src/${F}.ts`]: `import "../../../apps/cli/src/${F}_target.ts";\n`,
      [`apps/cli/src/${F}_target.ts`]: STUB,
    },
  },
  {
    rule: "apps-do-not-import-each-other",
    files: {
      [`apps/console/src/${F}.ts`]: `import "../../gateway/src/${F}_target.ts";\n`,
      [`apps/gateway/src/${F}_target.ts`]: STUB,
    },
  },
  {
    rule: "templates-use-public-sdk-only",
    files: {
      [`templates/crm/tests/${F}.ts`]: `import "../../../packages/manifest/src/${F}_target.ts";\n`,
      [`packages/manifest/src/${F}_target.ts`]: STUB,
    },
  },
  {
    rule: "runtime-does-not-import-compiler",
    files: {
      [`packages/runtime/src/${F}.ts`]: `import "../../compiler/src/${F}_target.ts";\n`,
      [`packages/compiler/src/${F}_target.ts`]: STUB,
    },
  },
  {
    rule: "runtime-stays-on-workers",
    files: { [`packages/runtime/src/${F}.ts`]: `import "node:fs";\n` },
  },
  {
    rule: "sdk-stays-light",
    files: {
      [`packages/sdk/src/${F}.ts`]: `import "../../hosting/src/${F}_target.ts";\n`,
      [`packages/hosting/src/${F}_target.ts`]: STUB,
    },
  },
  {
    rule: "manifest-is-a-leaf",
    files: {
      [`packages/manifest/src/${F}.ts`]: `import "../../hosting/src/${F}_target.ts";\n`,
      [`packages/hosting/src/${F}_target.ts`]: STUB,
    },
  },
  {
    rule: "ui-does-not-import-sdk",
    files: {
      [`packages/ui/src/${F}.ts`]: `import "../../sdk/src/${F}_target.ts";\n`,
      [`packages/sdk/src/${F}_target.ts`]: STUB,
    },
  },
];

// Every declared rule must have a case, and vice versa.
const declared = config.forbidden.map((r) => r.name).sort();
const covered = [...new Set(cases.map((c) => c.rule))].sort();
if (JSON.stringify(declared) !== JSON.stringify(covered)) {
  console.error("Rules without a test case, or cases without a rule:", { declared, covered });
  process.exit(1);
}

// Writes a case's files, runs `run`, then deletes the files and directories it created.
// Never touches an existing file: a case that targets a real path in the repository fails first.
function withFixtures<T>(files: Record<string, string>, run: (paths: string[]) => T): T {
  const paths = Object.keys(files);
  for (const path of paths) {
    if (existsSync(join(root, path))) {
      throw new Error(`The test file ${path} already exists: pick another path.`);
    }
  }
  const created: string[] = [];
  try {
    for (const [path, content] of Object.entries(files)) {
      const dir = dirname(join(root, path));
      if (!existsSync(dir)) created.push(mkdirSync(dir, { recursive: true }) ?? dir);
      writeFileSync(join(root, path), content);
    }
    return run(paths);
  } finally {
    for (const path of paths) rmSync(join(root, path), { force: true });
    for (const dir of created) rmSync(dir, { recursive: true, force: true });
  }
}

let failures = 0;

for (const c of cases) {
  const rules = withFixtures(c.files, (paths) => {
    const run = spawnSync(
      "node_modules/.bin/depcruise",
      [...paths, "--config", ".dependency-cruiser.cjs", "--output-type", "json"],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    const report = JSON.parse(run.stdout) as {
      summary: { violations: { rule: { name: string } }[] };
    };
    return new Set(report.summary.violations.map((v) => v.rule.name));
  });
  if (rules.has(c.rule)) {
    console.log(`OK    ${c.rule}`);
  } else {
    failures++;
    console.error(
      `FAIL  ${c.rule} (${Object.keys(c.files)[0]}) : violations found ${JSON.stringify([...rules])}`,
    );
  }
}

if (failures > 0) process.exit(1);
console.log(`${cases.length} cases checked for ${declared.length} import rules.`);
