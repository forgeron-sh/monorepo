// Generates src/generated/ from data/hugeicons-names.json and the drawn icons of src/drawn/.
//
//   bun scripts/generate.ts            regenerate (offline, from the snapshot)
//   bun scripts/generate.ts --check    fail if src/generated/ is not what the generator writes
//   bun scripts/generate.ts --refresh  fetch the Iconify listing again, then regenerate
//
// It only writes under src/generated/: a drawn icon is never touched, and running it twice
// writes the same files.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generate, type DrawnInfo, type NameSnapshot } from "../src/generator/core";
import { SAME_AS } from "../src/generator/same-as";
import { hasDuotone } from "../src/render";
import type { IconDefinition } from "../src/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = join(root, "data/hugeicons-names.json");
const DRAWN = join(root, "src/drawn");
const OUT = join(root, "src/generated");
const SOURCE = "https://api.iconify.design/collection?prefix=hugeicons";

const args = new Set(process.argv.slice(2));

async function refresh(): Promise<void> {
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`${SOURCE} answered ${response.status}`);
  const body = (await response.json()) as Omit<NameSnapshot, "source" | "fetchedAt">;
  if (!Array.isArray(body.uncategorized) || body.prefix !== "hugeicons") {
    throw new Error(`${SOURCE} did not answer the expected listing.`);
  }
  const snapshot: NameSnapshot = {
    source: SOURCE,
    fetchedAt: new Date().toISOString(),
    prefix: body.prefix,
    total: body.total,
    title: body.title,
    uncategorized: [...body.uncategorized].sort(),
    hidden: [...(body.hidden ?? [])].sort(),
    aliases: Object.fromEntries(
      Object.entries(body.aliases ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
  writeFileSync(SNAPSHOT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Snapshot refreshed: ${snapshot.uncategorized.length} names, ${snapshot.fetchedAt}.`);
}

async function drawnIcons(): Promise<DrawnInfo[]> {
  const files = readdirSync(DRAWN).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
  const out: DrawnInfo[] = [];
  for (const file of files.sort()) {
    const name = file.slice(0, -3);
    const mod = (await import(join(DRAWN, file))) as { default?: IconDefinition };
    const icon = mod.default;
    if (!icon || !icon.implemented)
      throw new Error(`src/drawn/${file} has no drawn default export.`);
    if (icon.name !== name) throw new Error(`src/drawn/${file} is named "${icon.name}".`);
    out.push({ name, style: icon.style, duo: hasDuotone(icon), grid: icon.grid, rows: icon.rows });
  }
  return out;
}

if (args.has("--refresh")) await refresh();

for (const name of Object.keys(SAME_AS)) {
  if (existsSync(join(DRAWN, `${name}.ts`)))
    throw new Error(`"${name}" has its own drawing: remove it from src/generator/same-as.ts.`);
}

const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8")) as NameSnapshot;
const { manifest, files } = generate({ snapshot, drawn: await drawnIcons(), sameAs: SAME_AS });

if (args.has("--check")) {
  const stale = Object.entries(files).filter(
    ([path, content]) =>
      !existsSync(join(OUT, path)) || readFileSync(join(OUT, path), "utf8") !== content,
  );
  const extra = existsSync(OUT) ? readdirSync(OUT).filter((f) => !(f in files)) : [];
  if (stale.length > 0 || extra.length > 0) {
    console.error(
      `src/generated/ is out of date (${[...stale.map(([p]) => p), ...extra].join(", ")}): run \`bun run generate\` in packages/icons.`,
    );
    process.exit(1);
  }
  console.log("src/generated/ is up to date.");
} else {
  mkdirSync(OUT, { recursive: true });
  for (const file of readdirSync(OUT)) if (!(file in files)) rmSync(join(OUT, file));
  for (const [path, content] of Object.entries(files)) {
    const target = join(OUT, path);
    if (!existsSync(target) || readFileSync(target, "utf8") !== content)
      writeFileSync(target, content);
  }
  const done = manifest.filter((e) => e.implemented).length;
  console.log(
    `${manifest.length} icons (${done} drawn, ${manifest.length - done} stubs) in ${Object.keys(files).length} files.`,
  );
}
