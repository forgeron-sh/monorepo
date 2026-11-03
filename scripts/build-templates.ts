// Vitest global setup: builds every template, as `forgeron test` builds a tool before its tests.
// `createTestTool` runs the built Worker (`.forgeron/build/worker.js`).
//
// A template is rebuilt only when its sources or the toolchain that builds it changed: the key of
// the last build sits next to it, so a run with nothing new skips the bundler.
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildTool, discoverTools, fingerprintSources } from "../packages/compiler/src/index";

const TOOLCHAIN = ["compiler", "sdk", "runtime", "manifest", "ui"].map((p) => `packages/${p}/src`);

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries
    .filter((e) => e.isFile() && !e.name.endsWith(".test.ts"))
    .map((e) => join(e.parentPath, e.name))
    .sort();
}

/** What the build of a template depends on besides its own sources: the packages that build it. */
async function toolchainKey(): Promise<string> {
  const hash = createHash("sha256");
  for (const dir of TOOLCHAIN) {
    for (const file of await filesUnder(dir)) hash.update(file).update(await readFile(file));
  }
  hash.update(await readFile("bun.lock").catch(() => ""));
  return hash.digest("hex");
}

export default async function setup(): Promise<void> {
  const toolchain = await toolchainKey();
  for (const dir of await discoverTools("templates")) {
    const keyFile = join(dir, ".forgeron/build/setup-key");
    const key = `${toolchain}:${await fingerprintSources(dir)}`;
    const built = await readFile(keyFile, "utf8").catch(() => "");
    const worker = await readFile(join(dir, ".forgeron/build/worker.js")).catch(() => undefined);
    if (built === key && worker) continue;
    await buildTool(dir);
    await writeFile(keyFile, key);
  }
}
