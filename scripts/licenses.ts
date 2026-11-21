// Fails when an installed dependency carries a licence outside the allowlist. Reads the
// `package.json` of every package in node_modules (bun's store and any hoisted copy) and checks
// its `license` against permissive licences only: no copyleft, no source-available terms, no
// package without a stated licence. Workspace packages must be Apache-2.0, like the repository.
//
// `bun run licenses` after `bun install`; part of `bun run check`.
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** SPDX identifiers a dependency may carry. MPL-2.0 is left out: nothing installed needs it. */
export const ALLOWED: ReadonlySet<string> = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "BlueOak-1.0.0",
  "Python-2.0",
  "CC0-1.0",
  "Unlicense",
]);

/** The licence of the workspace's own packages. */
export const WORKSPACE_LICENSE = "Apache-2.0";

/**
 * Packages allowed although their licence is not in the list, each with the reason. Keyed by
 * `name` (every version), `name@version`, or a name ending in `*` (platform builds of a native
 * package differ per OS: `-darwin-arm64` here, `-linux-x64` in CI). Adding one needs a licence
 * read by a person.
 */
export const EXCEPTIONS: Readonly<Record<string, string>> = {
  // MIT-0 is MIT without the attribution clause: more permissive than MIT. Pulled in by jsdom
  // (tests only).
  "@csstools/color-helpers": "MIT-0, MIT without attribution; test environment only",
  "@csstools/css-syntax-patches-for-csstree":
    "MIT-0, MIT without attribution; test environment only",
  // The prebuilt libvips of sharp (through astro and miniflare) is LGPL-3.0-or-later, a separate
  // shared library that is never modified or bundled into our code. Tooling only, not shipped.
  "@img/sharp-libvips-*":
    "LGPL-3.0-or-later prebuilt libvips used by sharp at build time; unmodified, not linked into our code",
  // lightningcss (through vite) is MPL-2.0: file-level copyleft, used unmodified as a build tool;
  // nothing of it is shipped or edited.
  lightningcss: "MPL-2.0 CSS tool used unmodified at build time",
  "lightningcss-*": "MPL-2.0 native builds of lightningcss, used unmodified at build time",
};

const exception = (id: string, name: string): boolean =>
  Object.keys(EXCEPTIONS).some((key) =>
    key.endsWith("*") ? name.startsWith(key.slice(0, -1)) : key === id || key === name,
  );

interface Manifest {
  name?: string;
  version?: string;
  private?: boolean;
  license?: string | { type?: string };
  licenses?: Array<{ type?: string }>;
}

/** The SPDX expression of a manifest, or `undefined` when it states none. */
export function licenseOf(manifest: Manifest): string | undefined {
  const { license, licenses } = manifest;
  if (typeof license === "string") return license.trim() || undefined;
  if (license && typeof license === "object" && license.type) return license.type;
  if (Array.isArray(licenses) && licenses.length > 0) {
    const types = licenses.map((l) => l.type).filter((t): t is string => !!t);
    return types.length ? `(${types.join(" OR ")})` : undefined;
  }
  return undefined;
}

/**
 * Whether an SPDX expression is covered by `allowed`: `A OR B` needs one side, `A AND B` both,
 * parentheses group, and a `WITH` exception on an allowed licence is not accepted.
 */
export function isAllowed(expression: string, allowed: ReadonlySet<string> = ALLOWED): boolean {
  const tokens = expression.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
  let at = 0;
  const parseOr = (): boolean => {
    let ok = parseAnd();
    while (tokens[at] === "OR") {
      at++;
      const next = parseAnd();
      ok = ok || next;
    }
    return ok;
  };
  const parseAnd = (): boolean => {
    let ok = parseAtom();
    while (tokens[at] === "AND") {
      at++;
      const next = parseAtom();
      ok = ok && next;
    }
    return ok;
  };
  const parseAtom = (): boolean => {
    const token = tokens[at++];
    if (token === "(") {
      const ok = parseOr();
      at++; // the closing parenthesis
      return ok;
    }
    if (!token) return false;
    if (tokens[at] === "WITH") {
      at += 2;
      return false;
    }
    return allowed.has(token.replace(/\+$/, ""));
  };
  const result = parseOr();
  return result && at >= tokens.length;
}

function readManifest(dir: string): Manifest | undefined {
  const file = join(dir, "package.json");
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Manifest;
  } catch {
    return undefined;
  }
}

/** Every installed package directory under a `node_modules`, scopes included. */
function packagesIn(modules: string): string[] {
  if (!existsSync(modules)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(modules, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const path = join(modules, entry.name);
    if (entry.name.startsWith("@")) {
      for (const scoped of readdirSync(path)) out.push(join(path, scoped));
    } else out.push(path);
  }
  return out;
}

export function installedPackages(base: string = root): Map<string, Manifest> {
  const found = new Map<string, Manifest>();
  const add = (dir: string) => {
    const manifest = readManifest(dir);
    if (!manifest?.name) return;
    found.set(`${manifest.name}@${manifest.version ?? "?"}`, manifest);
  };
  const store = join(base, "node_modules", ".bun");
  if (existsSync(store)) {
    for (const entry of readdirSync(store)) {
      if (entry === "node_modules") continue;
      for (const dir of packagesIn(join(store, entry, "node_modules"))) add(dir);
    }
  }
  for (const dir of packagesIn(join(base, "node_modules"))) {
    try {
      add(realpathSync(dir));
    } catch {
      // A dangling link: nothing installed there.
    }
  }
  return found;
}

export function problemsOf(packages: Map<string, Manifest>): string[] {
  const problems: string[] = [];
  for (const [id, manifest] of [...packages].sort(([a], [b]) => a.localeCompare(b))) {
    const name = manifest.name ?? id;
    if (exception(id, name)) continue;
    const license = licenseOf(manifest);
    if (name.startsWith("@forgeron/")) {
      if (license !== WORKSPACE_LICENSE) {
        problems.push(
          `${id}: a workspace package must be ${WORKSPACE_LICENSE}, found ${license ?? "none"}`,
        );
      }
      continue;
    }
    if (!license) problems.push(`${id}: no licence stated`);
    else if (!isAllowed(license)) problems.push(`${id}: ${license}`);
  }
  return problems;
}

if (import.meta.main) {
  const packages = installedPackages();
  if (packages.size === 0) {
    console.error("No installed package found: run `bun install` first.");
    process.exit(1);
  }
  const problems = problemsOf(packages);
  if (problems.length > 0) {
    console.error(`${problems.length} package(s) with a licence outside the allowlist:`);
    for (const p of problems) console.error(`  ${p}`);
    console.error(
      "Allowed: " +
        [...ALLOWED].join(", ") +
        ". An exception goes in EXCEPTIONS (scripts/licenses.ts) with its reason.",
    );
    process.exit(1);
  }
  console.log(`${packages.size} installed packages, every licence is in the allowlist.`);
}
