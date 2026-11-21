// The core is framework-free. dependency-cruiser does not follow third-party packages (they are
// excluded from its graph), so the half of the rule about React, Tiptap, ProseMirror and Yjs is
// checked here, on the import specifiers themselves.
//
// "The core" is everything a read-only place loads: `src/core/`, `src/index.ts` and the core halves
// of the plugins (`src/plugins/*.ts`, not `src/plugins/editor/`). The editor halves may import
// Tiptap, but only the interface plugins (`plugins/editor/ui.tsx`) and the `react/` layer import
// React at run time: `/collab` and the schema must load on a server without it.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "richtext", "src");

function files(dir: string, ext = /\.tsx?$/): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name), ext) : ext.test(e.name) ? [join(dir, e.name)] : [],
  );
}

const notTest = (f: string) => !/\.test\.tsx?$/.test(f);

/** Run-time import specifiers: a type-only import is erased, so it is not a dependency. */
const specifiers = (file: string) => {
  const source = readFileSync(file, "utf8").replace(
    /import type[^;]*?from\s*["'][^"']+["'];?/gs,
    "",
  );
  return [...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map(
    (m) => m[1] as string,
  );
};

const offenders = (list: string[], allowed: (spec: string) => boolean) =>
  list.flatMap((file) =>
    specifiers(file)
      .filter((spec) => !allowed(spec))
      .map((spec) => `${relative(src, file)}: ${spec}`),
  );

describe("the core of richtext", () => {
  const core = [
    ...files(join(src, "core")),
    join(src, "index.ts"),
    ...readdirSync(join(src, "plugins"))
      .filter((f) => f.endsWith(".ts"))
      .map((f) => join(src, "plugins", f)),
  ].filter(notTest);

  it("imports nothing but its own files", () => {
    expect(core.length).toBeGreaterThan(14);
    expect(
      offenders(
        core,
        (spec) => spec.startsWith(".") && !/\/(react|tiptap|collab)\/|plugins\/editor/.test(spec),
      ),
    ).toEqual([]);
  });

  it("includes the core half of every bundled plugin", () => {
    const names = core.map((f) => relative(src, f));
    for (const family of ["marks", "heading", "lists", "table", "image", "references", "ui"]) {
      expect(names).toContain(join("plugins", `${family}.ts`));
    }
  });
});

describe("the schema side of richtext", () => {
  const server = [
    ...files(join(src, "collab")),
    ...files(join(src, "tiptap")),
    // `ui.tsx` is the interface; `index.ts` and `presets.ts` list it, so they load it too.
    ...files(join(src, "plugins", "editor")).filter(
      (f) => !/\/(ui\.tsx|index\.ts|presets\.ts)$/.test(f),
    ),
  ].filter(notTest);

  it("loads no React and no ui at run time, so a server can build the schema", () => {
    expect(server.length).toBeGreaterThan(14);
    // The icons are data; `react/icons.ts` only imports them, `react/cx` is not needed either.
    expect(
      offenders(
        server,
        (spec) => !/^(react|react-dom|@tiptap\/react|@forgeron\/ui)(\/|$)/.test(spec),
      ),
    ).toEqual([]);
  });
});
