import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

export const CONFIG_FILE = "forgeron.config.ts";

const SKIPPED = new Set(["node_modules", ".git", ".forgeron"]);

/**
 * Every folder (as an absolute path) that carries a `forgeron.config.ts`, at any depth, is a tool (D-006).
 * `node_modules`, `.git` and `.forgeron` (the build output) are not searched.
 */
export async function discoverTools(root: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    if (entries.some((entry) => entry.isFile() && entry.name === CONFIG_FILE)) found.push(dir);
    for (const entry of entries) {
      if (entry.isDirectory() && !SKIPPED.has(entry.name)) await walk(join(dir, entry.name));
    }
  }
  await walk(resolve(root));
  return found.sort();
}
