// Vérifie que chaque règle d'import (.dependency-cruiser.cjs) refuse bien ce qu'elle doit refuser.
// Pour chaque cas, écrit des fichiers temporaires fautifs, lance dependency-cruiser dessus, attend
// la règle, puis supprime les fichiers. Une règle qui ne refuserait plus rien fait échouer
// `bun run check` (dependency-cruiser ne dit rien quand il n'analyse aucun module : voir D-002).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = require("../.dependency-cruiser.cjs") as { forbidden: { name: string }[] };

interface Case {
  rule: string;
  files: Record<string, string>; // chemin relatif à la racine → contenu
}

// Les cas écrivent aussi la cible de l'import : les paquets n'ont pas besoin d'exister encore, et
// l'import relatif évite que no-unresolved refuse le cas avant la règle testée.
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

// Chaque règle déclarée doit avoir son cas, et inversement.
const declared = config.forbidden.map((r) => r.name).sort();
const covered = [...new Set(cases.map((c) => c.rule))].sort();
if (JSON.stringify(declared) !== JSON.stringify(covered)) {
  console.error("Règles sans cas de test, ou cas sans règle :", { declared, covered });
  process.exit(1);
}

// Écrit les fichiers d'un cas, exécute `run`, puis supprime fichiers et dossiers créés.
// Ne touche jamais un fichier existant : un cas qui viserait un vrai chemin du dépôt échoue d'abord.
function withFixtures<T>(files: Record<string, string>, run: (paths: string[]) => T): T {
  const paths = Object.keys(files);
  for (const path of paths) {
    if (existsSync(join(root, path))) {
      throw new Error(`Le fichier de test ${path} existe déjà : choisir un autre chemin.`);
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
      `ÉCHEC ${c.rule} (${Object.keys(c.files)[0]}) : violations obtenues ${JSON.stringify([...rules])}`,
    );
  }
}

if (failures > 0) process.exit(1);
console.log(`${cases.length} cas vérifiés pour ${declared.length} règles d'import.`);
