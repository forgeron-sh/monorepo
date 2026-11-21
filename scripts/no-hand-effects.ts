// Effects live in @forgeron/shaders: a preset (blocks described as data) mounted by the package, not
// canvas code written in a page. This check fails when a site or a gallery draws on a canvas
// itself, except where a reason is written down below. Run: bun scripts/no-hand-effects.ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["apps/site/src", "apps/font/src", "apps/icon-gallery/src", "apps/ui-gallery/src"];
const DRAWS = /getContext\(\s*["'](2d|webgl2?|bitmaprenderer)["']/;

/**
 * Files that draw on a canvas, each with why, and what removes the entry. A new one needs a reason
 * here (and a plan to move it into the package) or, better, a preset.
 */
const ALLOWED: Record<string, string> = {
  "apps/site/src/illustrations/flat.ts":
    "Debt: the /wild-erp flat scenes (CPU, Bayer 4). Moves to the package with a scene source.",
  "apps/font/src/components/Hero.astro":
    "Debt: the specimen draws @forgeron/shaders' reveal (`revealFrame`) on one canvas per line of the title, which `mountReveal` cannot. Goes when `mountReveal` takes one canvas per line.",
  "apps/icon-gallery/src/lib/export.ts": "Not an effect: exports an icon to a PNG.",
};

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "node_modules" && name !== "dist") yield* files(path);
    } else if (/\.(ts|tsx|astro|js|mjs)$/.test(name) && !/\.test\./.test(name)) yield path;
  }
}

const found = new Set<string>();
for (const root of ROOTS)
  for (const file of files(root)) if (DRAWS.test(readFileSync(file, "utf8"))) found.add(file);

const fresh = [...found].filter((f) => !(f in ALLOWED));
const stale = Object.keys(ALLOWED).filter((f) => !found.has(f));
if (fresh.length || stale.length) {
  for (const f of fresh)
    console.error(
      `${f}: draws on a canvas. Make it a preset of @forgeron/shaders (or give a reason in scripts/no-hand-effects.ts).`,
    );
  for (const f of stale)
    console.error(
      `${f}: no longer draws on a canvas; remove its entry in scripts/no-hand-effects.ts.`,
    );
  process.exit(1);
}
console.log(`no-hand-effects: ${found.size} files draw on a canvas, all with a written reason.`);
