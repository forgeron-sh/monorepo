import type { Build } from "@forgeron/hosting";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const read = async (path: string) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
};

/** The body of a deployment, read from a tool's `.forgeron/build/` (what `buildTool` wrote there). */
export async function readBuild(outDir: string, fingerprint: string): Promise<Build> {
  const worker = await read(join(outDir, "worker.js"));
  const manifest = await read(join(outDir, "manifest.json"));
  if (worker === undefined || manifest === undefined) {
    throw new Error(`The build in ${outDir} has no worker.js or manifest.json.`);
  }
  const migrations = await read(join(outDir, "migrations.json"));
  const changelog = await read(join(outDir, "changelog.json"));
  const docs = await read(join(outDir, "docs.json"));
  return {
    manifest: JSON.parse(manifest),
    worker,
    fingerprint,
    ...(migrations ? { migrations: JSON.parse(migrations) } : {}),
    ...(changelog ? { changelog: JSON.parse(changelog) } : {}),
    ...(docs ? { docs: JSON.parse(docs) } : {}),
  };
}
