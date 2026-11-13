import { buildTool } from "@forgeron/compiler";
import type { Manifest } from "@forgeron/manifest";
import { isTeamId } from "@forgeron/permissions";
import { createLocalHosting } from "@forgeron/hosting/local";
import { readFile } from "node:fs/promises";
import type { BuildMigration } from "@forgeron/hosting";
import { join } from "node:path";
import { developer, readDevDirectory, snapshotOf } from "./dev-directory";
import { UsageError } from "./io";

// `forgeron dev`: builds the tool, runs it in workerd through the local hosting, and serves its
// interfaces on a local URL. A rebuild replaces the running build and keeps the URL.

export interface DevSession {
  name: string;
  /** The manifest of the build being served. */
  manifest(): Manifest;
  /** Where the tool answers: `<url>/mcp`, `<url>/api/<action>`, `<url>/cli`, and its views. */
  url: string;
  /** Builds again and replaces the running build. */
  reload(): Promise<void>;
  stop(): Promise<void>;
}

export interface DevOptions {
  port?: number;
  /** Run as a person given only this profile of the tool (or `all`: every permission), to see what they would see. */
  as?: string;
  /** The teams of the person who runs, instead of those of the directory (D-137). */
  teams?: string[];
  /** Run as this person of `.forgeron/local/directory.json` (D-131). */
  user?: string;
}

async function builtFiles(outDir: string) {
  const [worker, manifest, record, migrations] = await Promise.all([
    readFile(join(outDir, "worker.js"), "utf8"),
    readFile(join(outDir, "manifest.json"), "utf8"),
    readFile(join(outDir, "build.json"), "utf8"),
    // Only a tool with a database has migrations.
    readFile(join(outDir, "migrations.json"), "utf8").catch(() => undefined),
  ]);
  return {
    worker,
    manifest: JSON.parse(manifest) as Manifest,
    fingerprint: (JSON.parse(record) as { fingerprint: string }).fingerprint,
    ...(migrations ? { migrations: JSON.parse(migrations) as BuildMigration[] } : {}),
  };
}

export async function startDev(dir: string, options: DevOptions = {}): Promise<DevSession> {
  const { as, teams } = options;
  for (const team of teams ?? []) {
    if (!isTeamId(team))
      throw new UsageError(`--team ${team}: not a team id (lower case letters, digits and "-").`);
  }
  const hosting = createLocalHosting({
    // The local database lives on disk: it is still there next time (.forgeron/local is ignored by git).
    persist: join(dir, ".forgeron", "local"),
    // The built views of the tool: served on the tool's own address, as the platform serves them.
    viewFile: (file) => readFile(join(dir, ".forgeron", "build", file)).catch(() => undefined),
    ...(options.port === undefined ? {} : { port: options.port }),
    // Who the developer is, and the people and teams a tool that asks for them may know (D-131).
    identity: (manifest) =>
      developer(readDevDirectory(dir), manifest, { user: options.user, as, teams }),
    directory: () => snapshotOf(readDevDirectory(dir)),
    // Another person of the directory, for a page opened with `?as=<email>` (D-135): two people at once.
    identityFor: (manifest, email) => {
      try {
        return developer(readDevDirectory(dir), manifest, { user: email, as, teams });
      } catch {
        return undefined;
      }
    },
  });

  let current: Manifest | undefined;

  async function deploy(): Promise<{ name: string; url: string }> {
    const { outDir } = await buildTool(dir);
    const build = await builtFiles(outDir);
    // `--as` is a profile of the tool, or `all` (D-137).
    if (as && as !== "all" && !(as in build.manifest.profiles)) {
      const known = [...Object.keys(build.manifest.profiles), "all"];
      throw new UsageError(
        `--as ${as}: the tool has no such profile (choose: ${known.join(", ")}).`,
      );
    }
    current = build.manifest;
    const environment = { tool: build.manifest.name, name: "local" as const };
    const provisioned = await hosting.provision(environment, build.manifest);
    const uploaded = await hosting.upload(provisioned, build);
    // Before traffic switches: if a migration fails, the previous build keeps serving.
    await hosting.migrate(uploaded);
    const { url } = await hosting.activate(uploaded);
    return { name: build.manifest.name, url };
  }

  const { name, url } = await deploy();
  return {
    name,
    manifest: () => current!,
    url,
    reload: async () => void (await deploy()),
    stop: () => hosting.close(),
  };
}
