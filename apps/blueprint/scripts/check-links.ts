// Checks the built site (dist/): every internal link and asset (`href`, `src`) resolves to a
// file, every anchor (`#id`, `/page#id`) to an id of its page, and the schema is served where
// every `.bp` file says it is. External links are listed, not fetched.
// Run after `astro build`: bun scripts/check-links.ts [dist]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const dist = process.argv[2] ?? join(import.meta.dirname, "..", "dist");
const SITE = "https://blueprint.forgeron.sh";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** The file a site path is served from, as Workers static assets resolve it; null when none. */
function fileOf(pathname: string): string | null {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  const candidates =
    clean === "" || clean.endsWith("/")
      ? [join(dist, clean, "index.html")]
      : [join(dist, clean), join(dist, `${clean}.html`), join(dist, clean, "index.html")];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const ids = new Map<string, Set<string>>();
function idsOf(file: string): Set<string> {
  let set = ids.get(file);
  if (!set) {
    set = new Set([...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!));
    ids.set(file, set);
  }
  return set;
}

const pages = walk(dist).filter((f) => f.endsWith(".html"));
const broken: string[] = [];
const external = new Set<string>();
let checked = 0;

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const path = `/${relative(dist, page)
    .replace(/index\.html$/, "")
    .replace(/\.html$/, "")}`;
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const raw = m[1]!.replace(/&amp;/g, "&");
    if (/^(mailto:|data:|javascript:)/.test(raw)) continue;
    const url = new URL(raw, `${SITE}${path}`);
    if (url.origin !== SITE) {
      external.add(url.href);
      continue;
    }
    checked++;
    const target = fileOf(url.pathname);
    if (!target) {
      broken.push(`${path}: ${raw} (no file)`);
      continue;
    }
    if (
      url.hash &&
      target.endsWith(".html") &&
      !idsOf(target).has(decodeURIComponent(url.hash.slice(1)))
    )
      broken.push(`${path}: ${raw} (no id ${url.hash})`);
  }
}

const schemaFile = fileOf("/schema/v1.json");
if (!schemaFile) broken.push("/schema/v1.json is not built");
else {
  const schema = JSON.parse(readFileSync(schemaFile, "utf8")) as { $id?: string };
  if (schema.$id !== `${SITE}/schema/v1.json`) broken.push(`/schema/v1.json: $id is ${schema.$id}`);
}

console.log(
  `${pages.length} pages, ${checked} internal links and assets, ${external.size} external links (not fetched)`,
);
for (const href of [...external].sort()) console.log(`  external ${href}`);
if (broken.length) {
  console.error(`${broken.length} broken:`);
  for (const b of broken) console.error(`  ${b}`);
  process.exit(1);
}
console.log("no broken link");
