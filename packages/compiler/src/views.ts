import type { Manifest } from "@forgeron/manifest";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";

// A view reaches the tool through actions (sdk.md §11). The build reads the names the hooks are
// called with and refuses one that is not an action of the tool. Only a literal name can be read:
// `useAction(name)` with a variable is not seen, and fails at runtime.

const CALL = /\buse(?:Action|Mutation)\s*(?:<[^()]*>)?\s*\(\s*(["'`])([^"'`$\\]*)\1/g;

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** The messages for the actions `source` cites that the manifest does not declare. */
export function findUnknownActions(source: string, manifest: Manifest): string[] {
  const problems = new Set<string>();
  for (const [, , name = ""] of stripComments(source).matchAll(CALL)) {
    if (!(name in manifest.actions)) {
      problems.add(`cites the action "${name}", which does not exist in this tool.`);
    }
  }
  return [...problems];
}

export async function checkViewActions(
  dir: string,
  modules: string[],
  manifest: Manifest,
): Promise<void> {
  const problems: string[] = [];
  for (const file of modules) {
    for (const message of findUnknownActions(await readFile(file, "utf8"), manifest)) {
      problems.push(`${relative(dir, file)} ${message}`);
    }
  }
  if (problems.length) {
    throw new Error(`The views of "${manifest.name}" are wrong:\n  - ${problems.join("\n  - ")}`);
  }
}
