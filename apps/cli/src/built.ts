import type { Build } from "@forgeron/hosting";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const read = async (path: string) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
};

/** The files of `views/`, path under the build folder to code (D-134); empty for a tool with no view. */
async function readViews(outDir: string): Promise<Record<string, string>> {
  const views: Record<string, string> = {};
  const walk = async (relative: string): Promise<void> => {
    let entries;
    try {
      entries = await readdir(join(outDir, relative), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith(".js")) views[path] = await readFile(join(outDir, path), "utf8");
    }
  };
  await walk("views");
  return views;
}

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
  const views = await readViews(outDir);
  return {
    manifest: JSON.parse(manifest),
    worker,
    fingerprint,
    ...(migrations ? { migrations: JSON.parse(migrations) } : {}),
    ...(changelog ? { changelog: JSON.parse(changelog) } : {}),
    ...(docs ? { docs: JSON.parse(docs) } : {}),
    ...(Object.keys(views).length > 0 ? { views } : {}),
  };
}
