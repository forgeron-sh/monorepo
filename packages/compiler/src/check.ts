import type { Manifest } from "@forgeron/manifest";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";

// A tool gets from `ctx` only what its config declares (sdk.md §3): `ctx.db` without
// `resources.db` is a build error, not a runtime surprise. The check reads the source of every
// file that went into the bundle, so it only sees `ctx.<member>`; code that renames `ctx` is not seen.

const USE = /\bctx\.(db|files|cache|secrets|userSecrets|connectors|tools)\b(?:\.([A-Za-z_]\w*))?/g;

// Members whose next name is a declared key: `ctx.secrets.API_KEY`.
const NAMED = new Set(["secrets", "userSecrets", "connectors", "tools"]);

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function declared(manifest: Manifest, member: string): Record<string, unknown> | boolean {
  const { resources } = manifest;
  switch (member) {
    case "db":
    case "files":
    case "cache":
      return Boolean(resources[member]);
    case "tools":
      return manifest.uses;
    default:
      return resources[member as "secrets" | "userSecrets" | "connectors"] ?? false;
  }
}

const where = (member: string) => (member === "tools" ? "uses" : `resources.${member}`);

/** The messages of what `source` reads from `ctx` without declaring it. */
export function findUndeclaredResources(source: string, manifest: Manifest): string[] {
  const problems = new Set<string>();
  for (const [, member = "", name] of stripComments(source).matchAll(USE)) {
    const known = declared(manifest, member);
    if (known === false) {
      problems.add(
        `ctx.${member} is used but ${where(member)} is not declared in forgeron.config.ts.`,
      );
    } else if (NAMED.has(member) && name && typeof known === "object" && !(name in known)) {
      problems.add(
        `ctx.${member}.${name} is used but "${name}" is not declared in ${where(member)}.`,
      );
    }
  }
  return [...problems];
}

export async function checkResources(
  dir: string,
  modules: string[],
  manifest: Manifest,
): Promise<void> {
  const problems: string[] = [];
  for (const file of modules) {
    for (const message of findUndeclaredResources(await readFile(file, "utf8"), manifest)) {
      problems.push(`${relative(dir, file)}: ${message}`);
    }
  }
  if (problems.length) {
    throw new Error(
      `"${manifest.name}" uses what it does not declare:\n  - ${problems.join("\n  - ")}`,
    );
  }
}
