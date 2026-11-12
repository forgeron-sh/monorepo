import { createRequire } from "node:module";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { rolldown } from "rolldown";
import { checkResources } from "./check";
import { discoverTools } from "./discover";
import { fingerprintSources, sha256 } from "./fingerprint";
import { resolveMigration, sameSnapshot, snapshotOf } from "@forgeron/sdk/db";
import { boundary, loadTool, schemaFileOf, seedFileOf, sourcesOf } from "./load";
import { checkViewActions } from "./views";
import { readSnapshot } from "./migrations/generate";
import { buildManifest } from "./manifest";
import { changelogOf } from "./changelog";
import { collectDocs, docsEntry } from "./docs";

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
  connectors: Array<{ name: string; file: string }>,
  sdkPath: string,
): string {
  const q = JSON.stringify;
  return [
    `import { createDb, createRuntime } from ${q(runtimePath)};`,
    ...(connectors.length > 0 ? [`import { createConnectorClient } from ${q(sdkPath)};`] : []),
    ...connectors.map((c, i) => `import connector${i} from ${q(c.file)};`),
    `import manifest from ${q(manifestPath)};`,
    ...actions.map((a, i) => `import action${i} from ${q(a.file)};`),
    ...(schemaFile ? [`import schema from ${q(schemaFile)};`] : []),
    ...(migrationsFile ? [`import migrations from ${q(migrationsFile)};`] : []),
    ...(seedFile ? [`import seed from ${q(seedFile)};`] : []),
    ...events.map((e, i) => `import event${i} from ${q(e.file)};`),
    ...jobs.map((j, i) => `import job${i} from ${q(j.file)};`),
    `const connectorDefinitions = { ${connectors.map((c, i) => `${q(c.name)}: connector${i}`).join(", ")} };`,
    `const actions = { ${actions.map((a, i) => `${q(a.name)}: action${i}`).join(", ")} };`,
    `const events = { ${events.map((e, i) => `${q(e.name)}: event${i}`).join(", ")} };`,
    `const jobs = { ${jobs.map((j, i) => `${q(j.name)}: job${i}`).join(", ")} };`,
    `function gatewayIdentity(request) {`,
    `  const raw = request.headers.get("x-forgeron-user");`,
    `  if (!raw) return undefined;`,
    `  try { return JSON.parse(raw); } catch { return undefined; }`,
    `}`,
    `// What the platform adds to \`ctx\` (secrets, fetch, clock…) comes in through \`options\`: tests use it too.`,
    `// A connector's client is built from the package the tool installed (D-048) and the session of the call.`,
    `const connectorClient = (name, session) => createConnectorClient(connectorDefinitions[name], manifest.resources.connectors[name], session);`,
    `export function createTool(options = {}) {`,
    `  const platform = { ...(${connectors.length > 0 ? "true" : "false"} ? { connectorClient } : {}), ...options.platform };`,
    `  return createRuntime({ manifest, actions, events, jobs, authenticate: gatewayIdentity, ...options, platform });`,
    `}`,
    `export { manifest${schemaFile ? ", schema" : ""}${migrationsFile ? ", migrations" : ""}${seedFile ? ", seed" : ""} };`,
    `// The Worker's bindings arrive with each call: the database of the environment is \`env.DB\`.`,
    `let runtime;`,
    `const runtimeFor = (env) => (runtime ??= createTool(env?.DB ? { platform: { db: createDb(env.DB) } } : {}));`,
    // A new preview's database is left a \`_forgeron_seed\` marker by the host (D-038): the first
    // request claims it and runs \`db/seed.ts\` here, where the code and the database are. A seed that
    // fails leaves the preview answering with the reason: it may have half filled the database.
    ...(seedFile
      ? [
          `let seeding;`,
          `async function seedPending(env) {`,
          `  const read = await env.DB.prepare('SELECT status, detail FROM "_forgeron_seed"').all().catch(() => undefined);`,
          `  const row = read?.results?.[0];`,
          `  if (!row || row.status === "done") return undefined;`,
          `  if (row.status === "failed") return row.detail;`,
          `  const claim = await env.DB.prepare('UPDATE "_forgeron_seed" SET status = ? WHERE status = ?').bind("running", "pending").all();`,
          `  if (!claim.meta?.changes) return undefined;`,
          `  try {`,
          `    await seed.run({ db: createDb(env.DB) });`,
          `    await env.DB.prepare('UPDATE "_forgeron_seed" SET status = ?').bind("done").all();`,
          `  } catch (error) {`,
          `    const detail = error instanceof Error ? error.message : String(error);`,
          `    await env.DB.prepare('UPDATE "_forgeron_seed" SET status = ?, detail = ?').bind("failed", detail).all();`,
          `    return detail;`,
          `  }`,
          `  return undefined;`,
          `}`,
          `const seedFailure = async (env) => {`,
          `  if (!env?.DB) return undefined;`,
          `  seeding ??= seedPending(env).then((detail) => { if (!detail) seeding = Promise.resolve(undefined); return detail; });`,
          `  return seeding;`,
          `};`,
        ]
      : []),
    `// Per-person secrets and consents: the gateway keeps them and hands a call the caller's own in headers only it`,
    `// can set (the access token of a delegated connector, never its refresh token), so a tool declaring`,
    `// some gets a runtime per request, whose stores hold that person's values alone.`,
    `const declaresUserSecrets = Object.keys(manifest.resources?.userSecrets ?? {}).length > 0;`,
    `const declaresSetup = Object.keys(manifest.setup?.fields ?? {}).length > 0;`,
    `const declaresDirectory = Boolean(manifest.resources?.directory);`,
    `const declaresDelegated = Object.values(manifest.resources?.connectors ?? {}).some((c) => c.mode === "delegated");`,
    `const headerJson = (request, name) => {`,
    `  try { return JSON.parse(request.headers.get(name) ?? "{}"); } catch { return {}; }`,
    `};`,
    `const runtimeOf = (request, env) => {`,
    `  if (!declaresUserSecrets && !declaresDelegated && !declaresSetup && !declaresDirectory) return runtimeFor(env);`,
    `  // The plain values of the person's setup (D-097): given by the gateway, never by the caller.`,
    `  const setupHeader = request.headers.get("x-forgeron-user-setup");`,
    `  const own = headerJson(request, "x-forgeron-user-secrets");`,
    `  const store = { read: async () => own, write: async () => { throw new Error("Per-person secrets are entered at the gateway."); } };`,
    `  const tokens = headerJson(request, "x-forgeron-connector-tokens");`,
    `  const links = headerJson(request, "x-forgeron-connector-consent");`,
    `  const connectorSessions = { tokens: async () => tokens, consentUrl: (name) => links[name] };`,
    `  return createTool({`,
    `    baseUrl: request.headers.get("x-forgeron-base-url") ?? "",`,
    `    platform: { ...(declaresUserSecrets ? { userSecretStore: store } : {}), ...(declaresSetup && setupHeader !== null ? { userSetup: headerJson(request, "x-forgeron-user-setup") } : {}), ...(declaresDelegated ? { connectorSessions } : {}), ...(declaresDirectory ? { directory: headerJson(request, "x-forgeron-directory") } : {}), ...(env?.DB ? { db: createDb(env.DB) } : {}) },`,
    `  });`,
    `};`,
    `export default {`,
    ...(seedFile
      ? [
          `  fetch: async (request, env) => {`,
          `    const failure = await seedFailure(env);`,
          `    if (failure) {`,
          `      return Response.json({ error: { code: "SEED_FAILED", message: \`The seed of this preview failed: \${failure}. Remove the preview and deploy the branch again.\` } }, { status: 500 });`,
          `    }`,
          `    return runtimeOf(request, env).fetch(request);`,
          `  },`,
        ]
      : [`  fetch: (request, env) => runtimeOf(request, env).fetch(request),`]),
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

// The views run in the browser: one module per view. Each is built from a generated entry that
// mounts the view itself: the page the platform serves carries the bootstrap (person, token, base) in
// `#forgeron-bootstrap`, and this script renders the view with it. The view, the hooks and React are
// in the same bundle, so there is one copy of React. The default export stays the `defineView` object.
const MOUNT = "\0forgeron-mount:";

const mountSource = (file: string) => `
import view from ${JSON.stringify(file)};
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { ViewHost, createHttpRuntime, createMemoryParams } from "@forgeron/sdk/react";

const holder = typeof document === "undefined" ? null : document.getElementById("forgeron-bootstrap");
if (holder) {
  const bootstrap = JSON.parse(holder.textContent || "{}");
  const memory = createMemoryParams(Object.fromEntries(new URLSearchParams(location.search)));
  // The URL carries the parameters (a link shares them); a sandboxed page may refuse to write it.
  const params = {
    get: memory.get,
    subscribe: memory.subscribe,
    set(next) {
      memory.set(next);
      try {
        const search = new URLSearchParams(next).toString();
        history.replaceState(null, "", location.pathname + (search ? "?" + search : ""));
      } catch {}
    },
  };
  const runtime = createHttpRuntime(bootstrap, { params });
  createRoot(document.getElementById("root")).render(createElement(ViewHost, { view, runtime }));
}
export default view;
`;

const mounting = (views: Array<{ name: string; file: string }>) => ({
  name: "forgeron-mount",
  resolveId(
    this: { resolve: (s: string, i?: string, o?: object) => Promise<{ id: string } | null> },
    source: string,
    importer?: string,
  ) {
    if (source.startsWith(MOUNT)) return source;
    if (importer?.startsWith(MOUNT)) {
      const view = views.find((v) => `${MOUNT}${v.name}` === importer);
      // The generated entry resolves what it imports from the view's own folder.
      return view ? this.resolve(source, view.file, { skipSelf: true }) : null;
    }
    return null;
  },
  load(id: string) {
    if (!id.startsWith(MOUNT)) return null;
    const view = views.find((v) => `${MOUNT}${v.name}` === id);
    return view ? mountSource(view.file) : null;
  },
});

async function buildViews(
  dir: string,
  outDir: string,
  views: Array<{ name: string; file: string }>,
): Promise<Record<string, string>> {
  if (views.length === 0) return {};
  const bundle = await rolldown({
    input: Object.fromEntries(views.map((v) => [v.name, `${MOUNT}${v.name}`])),
    platform: "browser",
    logLevel: "silent",
    plugins: [mounting(views), boundary(dir)],
    transform: { jsx: "react-jsx", define: { "process.env.NODE_ENV": '"production"' } },
  });
  const { output } = await bundle.write({
    dir: join(outDir, "views"),
    format: "esm",
    entryFileNames: "[name].js",
    chunkFileNames: "chunks/[name]-[hash].js",
  });
  await bundle.close();
  const hashes: Record<string, string> = {};
  for (const chunk of output) {
    const name = `views/${chunk.fileName}`;
    hashes[name] = sha256(await readFile(join(outDir, name)));
  }
  return hashes;
}

// A tool that declares `connector("<type>", ...)` installs `@forgeron/connector-<type>`, whose default
// export is its `defineConnector(...)` definition: the build bundles it so `ctx.connectors.<name>`
// is built in the deployed Worker. A declared connector whose package is missing is a build error.
function connectorPackages(
  dir: string,
  manifest: { resources?: { connectors?: Record<string, { type: string }> } },
): Array<{ name: string; file: string }> {
  const require = createRequire(join(dir, "package.json"));
  return Object.entries(manifest.resources?.connectors ?? {}).map(([name, { type }]) => {
    const pkg = `@forgeron/connector-${type}`;
    try {
      return { name, file: require.resolve(pkg) };
    } catch {
      throw new Error(
        `The connector "${name}" is of type "${type}", but ${pkg} is not installed: add it to the tool's dependencies.`,
      );
    }
  });
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
  // The README and its images go to the catalog (D-061): the manifest keeps their hashes, `docs.json`
  // the content, which `forgeron deploy` sends with the build.
  const docs = await collectDocs(dir, loaded.config.icon);
  const docsFile = join(outDir, "docs.json");
  const docsEntries = docsEntry(docs);
  const manifest = buildManifest(loaded, pkg.version, {
    ...(docsEntries ? { docs: docsEntries } : {}),
    ...(docs.icon ? { icon: docs.icon } : {}),
  });
  if (docsEntries) await writeFile(docsFile, `${JSON.stringify(docs)}\n`);
  await checkResources(dir, loaded.modules, manifest);
  await checkViewActions(dir, loaded.modules, manifest);
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

  const { actions, events, jobs, views } = await sourcesOf(dir);
  const runtimePath = createRequire(import.meta.url).resolve("@forgeron/runtime");
  const sdkPath = createRequire(import.meta.url).resolve("@forgeron/sdk");
  const connectors = connectorPackages(dir, manifest);
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
      connectors,
      sdkPath,
    ),
  );
  const bundle = await rolldown({ input, platform: "neutral", logLevel: "silent" });
  await bundle.write({ file: join(outDir, "worker.js"), format: "esm" });
  await bundle.close();
  const viewFiles = await buildViews(dir, outDir, views);
  await rm(scratch, { recursive: true, force: true });

  await writeGeneratedTypes(dir, loaded.schema !== undefined);

  const fingerprint = await fingerprintSources(dir);
  const files = {
    "worker.js": sha256(await readFile(join(outDir, "worker.js"))),
    "manifest.json": sha256(await readFile(manifestFile)),
    ...(docsEntries ? { "docs.json": sha256(await readFile(docsFile)) } : {}),
    ...viewFiles,
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
