// The registry served under `/r/` (D-156): the package sources read at build time by Vite, the gallery
// entries, the icon catalog. Only the `/r/` endpoints import this module, so none of it reaches a page.
// Vitest caches this module with its globs expanded: a new file of packages/ui may be missing from the
// registry test until the cache is reset, by editing this file (touched after wave 4 removed groups).
import * as icons from "@forgeron/icons";
import { entries as marketing } from "../../entries/marketing";
import { atoms, blocks, charts, groupOf, hooks } from "../../registry";
import { buildRegistry, shadcnImports, type Entry, type Registry } from "./build";

const raw = import.meta.glob<string>(
  [
    "../../../../../packages/ui/src/**/*.{ts,tsx,css}",
    "!../../../../../packages/ui/src/**/*.test.{ts,tsx}",
    "../../../../../packages/ui/tokens/tokens.css",
    "../../../../../packages/font/src/**/*.ts",
    "!../../../../../packages/font/src/**/*.test.ts",
    "../../../../../packages/shaders/src/**/*.ts",
    "!../../../../../packages/shaders/src/**/*.test.ts",
    "../../../../../packages/shaders/schema/*.json",
    "../../../../../packages/icons/src/{types,render}.ts",
    "../../../../../packages/icons/src/react.tsx",
  ],
  { query: "?raw", import: "default", eager: true },
);

const fontFiles = import.meta.glob<string>("../../../../../packages/ui/tokens/fonts/*.otf", {
  query: "?inline",
  import: "default",
  eager: true,
});

const PACKAGES = "../../../../../packages/";
/** Paths relative to `packages/`. Exported so the test can give the CSS Vitest blanks. */
export const sources = new Map(
  Object.entries(raw).map(([path, code]) => [path.slice(PACKAGES.length), code]),
);
export const fonts: Record<string, string> = Object.fromEntries(
  Object.entries(fontFiles).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1), url]),
);

const manifests = import.meta.glob<string>(
  "../../../../../packages/{ui,font,shaders,icons}/package.json",
  { query: "?raw", import: "default", eager: true },
);

const versions: Record<string, string> = {};
for (const text of Object.values(manifests)) {
  const deps = (JSON.parse(text) as { dependencies?: Record<string, string> }).dependencies ?? {};
  for (const [name, version] of Object.entries(deps)) {
    if (!version.startsWith("workspace:")) versions[name] = version;
  }
}

export const entries: ReadonlyArray<Entry> = [
  ...[...atoms, ...charts, ...blocks, ...hooks].map((a) => ({
    ...a,
    kind: (groupOf(a.slug) === "Hooks"
      ? "hook"
      : groupOf(a.slug) === "Blocks"
        ? "block"
        : "atom") as Entry["kind"],
  })),
  ...marketing.map((a) => ({ ...a, kind: "block" as const })),
];

const cache = new Map<string, Registry>();

/** The registry, its URLs under `site` (the gallery's origin, `https://ui.forgeron.sh`). */
export function registryFor(site: URL | undefined): Registry {
  const base = new URL("/r/", site ?? "https://ui.forgeron.sh").href;
  let registry = cache.get(base);
  if (!registry) {
    registry = buildRegistry({ sources, entries, icons, versions, fonts, base });
    cache.set(base, registry);
  }
  return registry;
}

/** The import lines of an entry installed with shadcn. */
export const shadcnImportsOf = (imports: ReadonlyArray<string>) => shadcnImports(sources, imports);
