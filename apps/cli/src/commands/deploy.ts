import { buildTool } from "@forgeron/compiler";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { readProject } from "../project";

const USAGE =
  "Usage: forgeron deploy [--env preview|production] [--branch <name>] [--allow-destructive]";
const ENVIRONMENTS = ["preview", "production"];

const exists = async (path: string) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
};

/** `1.5.0+a41f9e0` on production; a preview adds its branch (docs/sdk.md §16). */
function versionOf(version: string, fingerprint: string, env: string, branch: string | undefined) {
  const build = fingerprint.slice(0, 7);
  if (env !== "preview") return `${version}+${build}`;
  const slug = (branch ?? "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${version}-preview.${slug}+${build}`;
}

/**
 * The commit being deployed, for the console's list of branches: the sha CI gives (`GITHUB_SHA`) or
 * the checkout's, with its subject and author. Best effort: no git, no commit, the deploy goes on.
 */
async function commitOf(io: Io) {
  try {
    const out = io.capture
      ? await io.capture("git", ["log", "-1", "--format=%H%x1f%s%x1f%an"], io.cwd)
      : undefined;
    const [sha, message, author] = out?.code === 0 ? out.stdout.trim().split("\x1f") : [];
    const found = process.env.GITHUB_SHA || sha;
    if (!found || !/^[0-9a-f]{7,64}$/i.test(found)) return undefined;
    // The message and author are the checkout's, which is the commit only when it is the sha.
    const same = !sha || found === sha;
    return {
      sha: found,
      ...(same && message ? { message } : {}),
      ...(same && author ? { author } : {}),
    };
  } catch {
    return undefined;
  }
}

/**
 * `forgeron deploy`: builds the tool, uploads the build to the workspace's gateway with
 * `FORGERON_TOKEN`, and prints where it is served. Without `--env` it is a preview of the branch
 * (`--branch`, or the one GitHub gives CI). The platform builds nothing: this is the build.
 */
export async function deploy(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      env: { type: "string" },
      branch: { type: "string" },
      "allow-destructive": { type: "boolean" },
    },
  });
  if (positionals.length > 0) throw new UsageError(USAGE);
  const env = values.env ?? "preview";
  if (!ENVIRONMENTS.includes(env)) {
    throw new UsageError(`--env ${env}: one of ${ENVIRONMENTS.join(", ")}.`);
  }
  const branch = values.branch ?? process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME;
  if (env === "preview" && !branch) {
    throw new UsageError("A preview is tied to a branch: pass --branch <name>.");
  }
  const token = process.env.FORGERON_TOKEN;
  if (!token) {
    throw new UsageError(
      "FORGERON_TOKEN is not set: create a deployment token with `forgeron token create`.",
    );
  }
  const project = await readProject(io.cwd);
  if (!project?.endpoint) {
    throw new UsageError(
      "This tool is not linked to a workspace: run `forgeron link --workspace <name>` first.",
    );
  }

  const built = await buildTool(io.cwd);
  const read = async (file: string) => exists(join(built.outDir, file));
  const worker = await read("worker.js");
  const manifest = await read("manifest.json");
  if (worker === undefined || manifest === undefined) {
    throw new Error(`The build in ${built.outDir} has no worker.js or manifest.json.`);
  }
  const migrations = await read("migrations.json");
  const changelog = await read("changelog.json");
  const version = versionOf(built.version, built.fingerprint, env, branch);
  const commit = await commitOf(io);

  const response = await fetch(new URL("/deploy", project.endpoint), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      environment: env,
      ...(env === "preview" ? { branch } : {}),
      version,
      ...(commit ? { commit } : {}),
      ...(values["allow-destructive"] ? { allowDestructive: true } : {}),
      build: {
        manifest: JSON.parse(manifest),
        worker,
        fingerprint: built.fingerprint,
        ...(migrations ? { migrations: JSON.parse(migrations) } : {}),
        ...(changelog ? { changelog: JSON.parse(changelog) } : {}),
      },
    }),
  });
  const body = (await response.json().catch(() => undefined)) as
    | { url?: string; version?: string; applied?: string[]; error?: { message?: string } }
    | undefined;
  if (!response.ok) {
    io.error(body?.error?.message ?? `The workspace answered ${response.status}.`);
    return 1;
  }

  io.log(
    `Deployed ${built.name}@${body?.version ?? version} to ${env}${body?.url ? `: ${body.url}` : ""}`,
  );
  if (body?.applied?.length) io.log(`Migrations applied: ${body.applied.join(", ")}`);
  return 0;
}
