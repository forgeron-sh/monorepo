import { createRequire } from "node:module";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { rolldown } from "rolldown";
import { checkResources } from "./check";
import { discoverTools } from "./discover";
import { fingerprintSources, sha256 } from "./fingerprint";
import { loadTool, sourcesOf } from "./load";
import { buildManifest } from "./manifest";

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
): string {
  const q = JSON.stringify;
  return [
    `import { createRuntime } from ${q(runtimePath)};`,
    `import manifest from ${q(manifestPath)};`,
    ...actions.map((a, i) => `import action${i} from ${q(a.file)};`),
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
    `export { manifest };`,
    `const runtime = createTool();`,
    `export default {`,
    `  fetch: (request) => runtime.fetch(request),`,
    `  // Cloudflare cron triggers: the runtime decides which tasks are due, in their time zone.`,
    `  scheduled: (controller, env, ctx) => ctx.waitUntil(runtime.scheduled(new Date(controller.scheduledTime))),`,
    `};`,
  ].join("\n");
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

  const { actions, events, jobs } = await sourcesOf(dir);
  const runtimePath = createRequire(import.meta.url).resolve("@forgeron/runtime");
  const input = join(scratch, "worker.ts");
  await writeFile(input, workerEntry(runtimePath, manifestFile, actions, events, jobs));
  const bundle = await rolldown({ input, platform: "neutral", logLevel: "silent" });
  await bundle.write({ file: join(outDir, "worker.js"), format: "esm" });
  await bundle.close();
  await rm(scratch, { recursive: true, force: true });

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
