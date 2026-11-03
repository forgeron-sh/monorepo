import { createRequire } from "node:module";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { rolldown } from "rolldown";
import { checkResources } from "./check";
import { discoverTools } from "./discover";
import { fingerprintSources, sha256 } from "./fingerprint";
import { resolveMigration, sameSnapshot, snapshotOf } from "@forgeron/sdk/db";
import { loadTool, schemaFileOf, seedFileOf, sourcesOf } from "./load";
import { readSnapshot } from "./migrations/generate";
import { buildManifest } from "./manifest";
import { changelogOf } from "./changelog";

/** A migration as the build records it: its statements, resolved, and the fingerprint of its file. */
interface BuiltMigration {
  name: string;
  fingerprint: string;
  up: Array<{ sql: string; parameters: unknown[] }>;
  down: Array<{ sql: string; parameters: unknown[] }>;
  destructive: boolean;
}

const MIGRATION_NAME = /^(\d{4})_[a-z0-9_]+$/;

async function builtMigrations(
  dir: string,
  migrations: Record<string, unknown>,
): Promise<BuiltMigration[]> {
  const names = Object.keys(migrations).sort();
  const numbers = new Set<string>();
  const built: BuiltMigration[] = [];
  for (const name of names) {
    const match = MIGRATION_NAME.exec(name);
    if (!match) {
      throw new Error(
        `db/migrations/${name}.ts: a migration is named NNNN_<name>, like 0001_init.`,
      );
    }
    if (numbers.has(match[1]!))
      throw new Error(`Two migrations have the number ${match[1]}: renumber one.`);
    numbers.add(match[1]!);
    const definition = migrations[name] as Parameters<typeof resolveMigration>[0] | undefined;
    if (definition?.kind !== "migration") {
      throw new Error(
        `db/migrations/${name}.ts: the default export is not a migration (use migration() from @forgeron/sdk/db).`,
      );
    }
    const source = await readFile(join(dir, "db", "migrations", `${name}.ts`));
    built.push({
      name,
      fingerprint: sha256(source),
      ...resolveMigration(definition),
      destructive: definition.destructive ?? false,
    });
  }
  return built;
}

export interface BuildResult {
  /** The tool folder. */
  dir: string;
  name: string;
  version: string;
  /** The hash of the sources: the same code gives the same fingerprint. */
  fingerprint: string;
  outDir: string;
}

const BUILD_DIR = [".forgeron", "build"];

// The Worker's entry. Identity is the gateway's job: it forwards the person it resolved in
// `x-forgeron-user` (a JSON `{ id, email, name, roles }`), and only the gateway can call a tool Worker.
function workerEntry(
  runtimePath: string,
  manifestPath: string,
  actions: Array<{ name: string; file: string }>,
  events: Array<{ name: string; file: string }>,
  jobs: Array<{ name: string; file: string }>,
  schemaFile: string | undefined,
  migrationsFile: string | undefined,
  seedFile: string | undefined,
): string {
  const q = JSON.stringify;
  return [
    `import { createDb, createRuntime } from ${q(runtimePath)};`,
    `import manifest from ${q(manifestPath)};`,
    ...actions.map((a, i) => `import action${i} from ${q(a.file)};`),
    ...(schemaFile ? [`import schema from ${q(schemaFile)};`] : []),
    ...(migrationsFile ? [`import migrations from ${q(migrationsFile)};`] : []),
    ...(seedFile ? [`import seed from ${q(seedFile)};`] : []),
    ...events.map((e, i) => `import event${i} from ${q(e.file)};`),
    ...jobs.map((j, i) => `import job${i} from ${q(j.file)};`),
    `const actions = { ${actions.map((a, i) => `${q(a.name)}: action${i}`).join(", ")} };`,
    `const events = { ${events.map((e, i) => `${q(e.name)}: event${i}`).join(", ")} };`,
    `const jobs = { ${jobs.map((j, i) => `${q(j.name)}: job${i}`).join(", ")} };`,
    `function gatewayIdentity(request) {`,
    `  const raw = request.headers.get("x-forgeron-user");`,
    `  if (!raw) return undefined;`,
    `  try { return JSON.parse(raw); } catch { return undefined; }`,
    `}`,
    `// What the platform adds to \`ctx\` (secrets, fetch, clock…) comes in through \`options\`: tests use it too.`,
    `export function createTool(options = {}) {`,
    `  return createRuntime({ manifest, actions, events, jobs, authenticate: gatewayIdentity, ...options });`,
    `}`,
    `export { manifest${schemaFile ? ", schema" : ""}${migrationsFile ? ", migrations" : ""}${seedFile ? ", seed" : ""} };`,
    `// The Worker's bindings arrive with each call: the database of the environment is \`env.DB\`.`,
    `let runtime;`,
    `const runtimeFor = (env) => (runtime ??= createTool(env?.DB ? { platform: { db: createDb(env.DB) } } : {}));`,
    `export default {`,
    `  fetch: (request, env) => runtimeFor(env).fetch(request),`,
    `  // Cloudflare cron triggers: the runtime decides which tasks are due, in their time zone.`,
    `  scheduled: (controller, env, ctx) => ctx.waitUntil(runtimeFor(env).scheduled(new Date(controller.scheduledTime))),`,
    `};`,
  ].join("\n");
}

// `.forgeron/generated/db.d.ts` gives `ctx.db` the types of the schema (docs/sdk.md §8). It is
// read by the tool's editor and `tsc`, not by the build, and is ignored by git.
async function writeGeneratedTypes(dir: string, hasSchema: boolean): Promise<void> {
  const file = join(dir, ".forgeron", "generated", "db.d.ts");
  if (!hasSchema) return void (await rm(file, { force: true }));
  await mkdir(join(dir, ".forgeron", "generated"), { recursive: true });
  await writeFile(
    file,
    `// Generated by \`forgeron build\`. Do not edit.
import type { Database } from "@forgeron/sdk/db";
import type schema from "../../db/schema";

declare module "@forgeron/sdk" {
  interface Register {
    db: Database<typeof schema>;
  }
}
`,
  );
}

/** Turns a tool folder into `.forgeron/build/`: the Worker, the manifest and the build record. */
export async function buildTool(folder: string): Promise<BuildResult> {
  const dir = resolve(folder);
  const outDir = join(dir, ...BUILD_DIR);
  const scratch = join(outDir, ".tmp");
  await rm(outDir, { recursive: true, force: true });
  await mkdir(scratch, { recursive: true });

  const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8")) as { version?: string };
  if (!pkg.version)
    throw new Error(`${dir}/package.json has no version: it carries the tool's version.`);

  const loaded = await loadTool(dir, scratch);
  const manifest = buildManifest(loaded, pkg.version);
  await checkResources(dir, loaded.modules, manifest);
  const manifestFile = join(outDir, "manifest.json");
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  // The schema must not have moved since the last migration (sdk.md §14): `forgeron db generate` first.
  if (loaded.schema !== undefined) {
    const current = snapshotOf(loaded.schema as Parameters<typeof snapshotOf>[0]);
    if (!sameSnapshot(await readSnapshot(dir), current)) {
      throw new Error(
        "db/schema.ts has changed since the last migration (db/migrations/meta/snapshot.json): run `forgeron db generate`.",
      );
    }
  }
  const migrations = await builtMigrations(dir, loaded.migrations);
  const migrationsFile = join(outDir, "migrations.json");
  if (migrations.length > 0)
    await writeFile(migrationsFile, `${JSON.stringify(migrations, null, 2)}\n`);

  // The changelog of this version, structured, for the console, the MCP and dependent tools (sdk.md §16).
  await writeFile(
    join(outDir, "changelog.json"),
    `${JSON.stringify(await changelogOf(dir, manifest, migrations), null, 2)}\n`,
  );

  const { actions, events, jobs } = await sourcesOf(dir);
  const runtimePath = createRequire(import.meta.url).resolve("@forgeron/runtime");
  const input = join(scratch, "worker.ts");
  await writeFile(
    input,
    workerEntry(
      runtimePath,
      manifestFile,
      actions,
      events,
      jobs,
      await schemaFileOf(dir),
      migrations.length > 0 ? migrationsFile : undefined,
      await seedFileOf(dir),
    ),
  );
  const bundle = await rolldown({ input, platform: "neutral", logLevel: "silent" });
  await bundle.write({ file: join(outDir, "worker.js"), format: "esm" });
  await bundle.close();
  await rm(scratch, { recursive: true, force: true });

  await writeGeneratedTypes(dir, loaded.schema !== undefined);

  const fingerprint = await fingerprintSources(dir);
  const files = {
    "worker.js": sha256(await readFile(join(outDir, "worker.js"))),
    "manifest.json": sha256(await readFile(manifestFile)),
  };
  await writeFile(
    join(outDir, "build.json"),
    `${JSON.stringify({ name: manifest.name, version: manifest.version, fingerprint, files }, null, 2)}\n`,
  );
  return { dir, name: manifest.name, version: manifest.version, fingerprint, outDir };
}

/** Builds every tool under `root`. Two tools of a repository cannot share a name (D-006). */
export async function buildAll(root: string): Promise<BuildResult[]> {
  const results: BuildResult[] = [];
  const byName = new Map<string, string>();
  for (const dir of await discoverTools(root)) {
    const result = await buildTool(dir);
    const first = byName.get(result.name);
    if (first) throw new Error(`Two tools are named "${result.name}": ${first} and ${dir}.`);
    byName.set(result.name, dir);
    results.push(result);
  }
  return results;
}
