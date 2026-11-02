import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const SKIPPED = new Set(["node_modules", ".git", ".forgeron", "dist"]);

export const sha256 = (content: string | Uint8Array): string =>
  createHash("sha256").update(content).digest("hex");

async function sourceFiles(root: string, dir = root): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIPPED.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(root, path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

/**
 * A hash of what the developer wrote: every source file of the tool, by relative path and
 * content, in a fixed order. The same code gives the same fingerprint on any machine.
 */
export async function fingerprintSources(root: string): Promise<string> {
  const lines: string[] = [];
  for (const file of (await sourceFiles(root)).sort()) {
    const path = relative(root, file).split("\\").join("/");
    lines.push(`${path} ${sha256(await readFile(file))}`);
  }
  return sha256(lines.join("\n"));
}
