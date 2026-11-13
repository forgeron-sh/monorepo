import { buildTool } from "@forgeron/compiler";
import { defaultMapping, type Manifest } from "@forgeron/manifest";
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
  /** Run as a person who has only this role, to see what they would see. */
  role?: string;
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
  const { role } = options;
  const hosting = createLocalHosting({
    // The local database lives on disk: it is still there next time (.forgeron/local is ignored by git).
    persist: join(dir, ".forgeron", "local"),
    // The built views of the tool: served on the tool's own address, as the platform serves them.
    viewFile: (file) => readFile(join(dir, ".forgeron", "build", file)).catch(() => undefined),
    ...(options.port === undefined ? {} : { port: options.port }),
    // Who the developer is, and the people and teams a tool that asks for them may know (D-131).
    identity: (manifest) => developer(readDevDirectory(dir), manifest, options.user, role),
    directory: () => snapshotOf(readDevDirectory(dir)),
  });

  let current: Manifest | undefined;

  async function deploy(): Promise<{ name: string; url: string }> {
    const { outDir } = await buildTool(dir);
    const build = await builtFiles(outDir);
    // `--as` is a profile of the tool, or a workspace role read with the default mapping (D-127):
    // `admin` holds every permission, `member` the default profile.
    if (
      role &&
      !(role in build.manifest.roles) &&
      !(role in defaultMapping(build.manifest.roles))
    ) {
      const known = [
        ...Object.keys(build.manifest.roles),
        ...Object.keys(defaultMapping(build.manifest.roles)),
      ];
      throw new UsageError(
        `--as ${role}: the tool has no such profile, and it is not admin or member (choose: ${[...new Set(known)].join(", ")}).`,
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
