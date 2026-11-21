// The editorial scenes: every scene a post, a story or a change names exists, and each of the
// blog's own scenes draws frames without throwing over a full cycle.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLOG_SCENES } from "./blog-scenes";
import { SCENES } from "./scenes";

const CONTENT = join(import.meta.dirname, "../content");

/** Every `scene:` of a front matter and every `scene="…"` of a Figure, with its file. */
function named(): { file: string; scene: string }[] {
  const found: { file: string; scene: string }[] = [];
  for (const dir of ["blog", "stories", "changelog"]) {
    const path = join(CONTENT, dir);
    for (const name of readdirSync(path).filter((f) => /\.mdx?$/.test(f))) {
      const text = readFileSync(join(path, name), "utf8");
      for (const m of text.matchAll(/^scene:\s*["']?([\w-]+)/gm))
        found.push({ file: `${dir}/${name}`, scene: m[1]! });
      for (const m of text.matchAll(/scene="([\w-]+)"/g))
        found.push({ file: `${dir}/${name}`, scene: m[1]! });
    }
  }
  return found;
}

describe("editorial scenes", () => {
  it("names only scenes that exist", () => {
    const missing = named().filter((n) => !(n.scene in SCENES));
    expect(missing).toEqual([]);
  });

  it.each(Object.keys(BLOG_SCENES))("draws %s over 30 seconds", (name) => {
    const scene = BLOG_SCENES[name]!;
    for (let t = 0; t < 30; t += 0.05) {
      const blocks = scene(t, -1);
      expect(blocks.length).toBeGreaterThan(0);
      for (const b of blocks) {
        const points = b.kind === "line" ? [b.a, b.b] : [b.at];
        for (const p of points) expect(p.every(Number.isFinite)).toBe(true);
      }
    }
  });
});
