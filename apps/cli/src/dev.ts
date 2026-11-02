import { buildTool } from "@forgeron/compiler";
import type { Manifest } from "@forgeron/manifest";
import { createLocalHosting } from "@forgeron/hosting/local";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// `forgeron dev`: builds the tool, runs it in workerd through the local hosting, and serves its
// interfaces on a local URL. A rebuild replaces the running build and keeps the URL.

export interface DevSession {
  name: string;
  /** Where the tool answers: `<url>/mcp`, `<url>/api/<action>`, `<url>/cli`. */
  url: string;
  /** Builds again and replaces the running build. */
  reload(): Promise<void>;
  stop(): Promise<void>;
}

export interface DevOptions {
  port?: number;
}

async function builtFiles(outDir: string) {
  const [worker, manifest, record] = await Promise.all([
    readFile(join(outDir, "worker.js"), "utf8"),
    readFile(join(outDir, "manifest.json"), "utf8"),
    readFile(join(outDir, "build.json"), "utf8"),
  ]);
  return {
    worker,
    manifest: JSON.parse(manifest) as Manifest,
    fingerprint: (JSON.parse(record) as { fingerprint: string }).fingerprint,
  };
}

export async function startDev(dir: string, options: DevOptions = {}): Promise<DevSession> {
  const hosting = createLocalHosting(options.port === undefined ? {} : { port: options.port });

  async function deploy(): Promise<{ name: string; url: string }> {
    const { outDir } = await buildTool(dir);
    const build = await builtFiles(outDir);
    const environment = { tool: build.manifest.name, name: "local" as const };
    const provisioned = await hosting.provision(environment, build.manifest);
    const { url } = await hosting.activate(await hosting.upload(provisioned, build));
    return { name: build.manifest.name, url };
  }

  const { name, url } = await deploy();
  return {
    name,
    url,
    reload: async () => void (await deploy()),
    stop: () => hosting.close(),
  };
}
