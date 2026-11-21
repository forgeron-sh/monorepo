// The core of draw is framework-free. dependency-cruiser does not follow third-party packages
// (they are excluded from its graph), so the half of the rule about React is checked here, on the
// import specifiers themselves, and on what a read-only place really loads: the files reachable
// from the entry points of the core halves (the SVG export at build time, a board preview in a
// Worker).
//
// "The core" is everything a read-only place loads: `src/core/`, `src/index.ts`, the core halves
// of the plugins (`src/plugins/*.ts`, not `src/plugins/editor/`) and their docs. The editor halves
// and `react/` may import React, ui and the canvas React layer; the plugin contract of the editor
// (`react/plugin.ts`) does not, at run time, so a registry can be built without a renderer.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createRegistry, parseBoard } from "../packages/draw/src/index";
import { pluginDocs } from "../packages/draw/src/plugins/docs/index";
import { corePresets, fullCorePlugins } from "../packages/draw/src/plugins/index";
import { editorPresets } from "../packages/draw/src/plugins/editor/presets";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "packages", "draw", "src");

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? files(join(dir, e.name))
      : /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  );
}

/** Run-time import specifiers: a type-only import is erased, so it is not a dependency. */
const specifiers = (file: string) => {
  let text = readFileSync(file, "utf8");
  // The docs are data: their snippets hold imports as text, the code above the first one is real.
  if (/\/plugins\/docs\//.test(file))
    text = text.slice(0, Math.max(0, text.indexOf("`")) || text.length);
  const source = text
    .replace(/import type[^;]*?from\s*["'][^"']+["'];?/gs, "")
    .replace(/export type[^;]*?from\s*["'][^"']+["'];?/gs, "");
  return [
    ...source.matchAll(/^\s*(?:import|export)\s[^;]*?\sfrom\s*["']([^"']+)["']/gm),
    ...source.matchAll(/^\s*import\s*["']([^"']+)["']/gm),
    ...source.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1] as string);
};

const offenders = (list: string[], allowed: (spec: string) => boolean) =>
  list.flatMap((file) =>
    specifiers(file)
      .filter((spec) => !allowed(spec))
      .map((spec) => `${relative(src, file)}: ${spec}`),
  );

const coreFiles = () =>
  [
    ...files(join(src, "core")),
    ...files(join(src, "plugins", "docs")),
    join(src, "index.ts"),
    ...readdirSync(join(src, "plugins"))
      .filter((f) => f.endsWith(".ts"))
      .map((f) => join(src, "plugins", f)),
  ].filter((f) => !/\.test\.tsx?$/.test(f));

/** The workspace package a bare specifier names, resolved to its source entry point. */
function workspaceEntry(spec: string): string | undefined {
  const m = /^@forgeron\/([^/]+)(\/.*)?$/.exec(spec);
  if (!m) return undefined;
  const pkg = JSON.parse(readFileSync(join(root, "packages", m[1]!, "package.json"), "utf8")) as {
    exports?: Record<string, string>;
  };
  const target = pkg.exports?.[m[2] ? `.${m[2]}` : "."];
  return target ? resolve(root, "packages", m[1]!, target) : undefined;
}

function resolveFile(from: string, spec: string): string | undefined {
  const base = spec.startsWith(".") ? resolve(dirname(from), spec) : workspaceEntry(spec);
  if (!base) return undefined;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
    if (/\.tsx?$/.test(candidate) && existsSync(candidate)) return candidate;
  }
  return undefined;
}

/** Every file, and every package, a set of entry points loads at run time. */
function closure(entries: string[]) {
  const seen = new Set<string>();
  const bare = new Set<string>();
  const stack = [...entries];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of specifiers(file)) {
      const next = resolveFile(file, spec);
      if (next) stack.push(next);
      else if (!spec.startsWith(".")) bare.add(spec);
    }
  }
  return { files: [...seen].map((f) => relative(root, f)), bare: [...bare] };
}

describe("the core of draw", () => {
  it("imports its own files and the core of canvas, nothing else", () => {
    const core = coreFiles();
    expect(core.length).toBeGreaterThan(30);
    expect(
      offenders(
        core,
        (spec) =>
          (spec.startsWith(".") && !/(^|\/)(react|editor)(\/|$)/.test(spec)) ||
          spec === "@forgeron/canvas",
      ),
    ).toEqual([]);
  });

  it("includes the core half of every bundled plugin family", () => {
    const names = coreFiles().map((f) => relative(src, f));
    for (const family of ["shapes", "notes", "lines", "layout", "media", "export", "ui", "index"]) {
      expect(names).toContain(join("plugins", `${family}.ts`));
    }
  });

  it("loads no React, no canvas React layer, no ui and no editor half, whatever it pulls in", () => {
    const { files: loaded, bare } = closure(coreFiles());
    expect(bare.filter((b) => b !== "vitest")).toEqual([]);
    expect(loaded.filter((f) => /draw\/src\/(react|plugins\/editor)\//.test(f))).toEqual([]);
    expect(loaded.filter((f) => /packages\/(ui|icons)\//.test(f))).toEqual([]);
    expect(loaded.filter((f) => /canvas\/src\/react\//.test(f))).toEqual([]);
  });
});

describe("the editor side of draw", () => {
  it("builds its registry without React: the contract loads neither React, ui nor icons", () => {
    const { bare } = closure([join(src, "react", "plugin.ts"), join(src, "react", "signal.ts")]);
    expect(bare.filter((b) => /^(react-dom|@forgeron\/ui|@forgeron\/icons)(\/|$)/.test(b))).toEqual(
      [],
    );
    expect(closure([join(src, "react", "plugin.ts")]).bare.filter((b) => /^react/.test(b))).toEqual(
      [],
    );
  });

  it("has an editor half for every bundled plugin, in the same lists", () => {
    for (const name of ["full", "sketch", "minimal"] as const) {
      expect(editorPresets[name].map((p) => p.core.id)).toEqual(corePresets[name].map((p) => p.id));
    }
  });
});

describe("the documentation of the plugins", () => {
  const pkg = JSON.parse(readFileSync(join(root, "packages", "draw", "package.json"), "utf8")) as {
    exports: Record<string, string>;
  };
  const subpath = (spec: string) => pkg.exports[spec.replace("@forgeron/draw", ".")];

  it("has a doc for each plugin of the full preset, and none for others", () => {
    expect(pluginDocs.map((d) => d.id).sort()).toEqual(fullCorePlugins.map((p) => p.id).sort());
  });

  it("names subpaths that exist, each with a usage snippet", () => {
    for (const doc of pluginDocs) {
      const core = subpath(doc.core);
      const editor = subpath(doc.editor);
      expect([doc.id, core !== undefined]).toEqual([doc.id, true]);
      expect([doc.id, editor !== undefined]).toEqual([doc.id, true]);
      expect(existsSync(join(root, "packages", "draw", core!))).toBe(true);
      expect(existsSync(join(root, "packages", "draw", editor!))).toBe(true);
      expect(doc.usage.length).toBeGreaterThan(20);
      expect(doc.summary.length).toBeGreaterThan(10);
    }
  });

  it("gives a JSON sample that parses for each kind it owns", () => {
    for (const doc of pluginDocs.filter((d) => d.json?.includes('"kind"'))) {
      const item = JSON.parse(doc.json!) as { kind: string; id: string };
      const { items } = parseBoard(JSON.stringify({ version: 1, items: [item] }));
      expect([doc.id, items[0]!.kind]).toEqual([doc.id, item.kind]);
    }
    // Every kind of the bundled plugins has a sample.
    const sampled = new Set(
      pluginDocs.flatMap((d) =>
        d.json?.includes('"kind"') ? [JSON.parse(d.json).kind as string] : [],
      ),
    );
    for (const kind of createRegistry(fullCorePlugins).kindIds)
      expect(sampled.has(kind)).toBe(true);
  });

  it("requires only plugins that exist", () => {
    const ids = new Set(pluginDocs.map((d) => d.id));
    for (const doc of pluginDocs) for (const r of doc.requires ?? []) expect(ids.has(r)).toBe(true);
  });
});
