// The core of flow is framework-free. dependency-cruiser does not follow third-party packages
// (they are excluded from its graph), so the half of the rule about React is checked here, on the
// import specifiers themselves, and on what a read-only place really loads: the files reachable
// from the entry points of the core halves.
//
// "The core" is everything a read-only place loads: `src/core/`, `src/index.ts` and the core halves
// of the plugins (`src/plugins/*.ts`, not `src/plugins/editor/`). The editor halves and `react/`
// may import React and the canvas React layer; the plugin contract of the editor
// (`react/plugin.ts`) and the far view's primitives do not, at run time, so that a registry can be
// built, and a test can check one, without a renderer.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "packages", "flow", "src");

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
  const source = readFileSync(file, "utf8")
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

describe("the core of flow", () => {
  it("imports its own files and the core of canvas, nothing else", () => {
    const core = coreFiles();
    expect(core.length).toBeGreaterThan(15);
    expect(
      offenders(
        core,
        (spec) =>
          (spec.startsWith(".") && !/(^|\/)(react|editor)(\/|$)/.test(spec)) ||
          spec === "@forgeron/canvas",
      ),
    ).toEqual([]);
  });

  it("includes the core half of every bundled plugin", () => {
    const names = coreFiles().map((f) => relative(src, f));
    for (const family of [
      "clipboard",
      "connect",
      "edges",
      "groups",
      "layout",
      "run",
      "ui",
      "index",
    ]) {
      expect(names).toContain(join("plugins", `${family}.ts`));
    }
  });

  it("loads no React, no canvas React layer, no ui and no editor half, whatever it pulls in", () => {
    const { files: loaded, bare } = closure(coreFiles());
    expect(bare.filter((b) => b !== "vitest")).toEqual([]);
    expect(loaded.filter((f) => /flow\/src\/(react|plugins\/editor)\//.test(f))).toEqual([]);
    expect(loaded.filter((f) => /packages\/(ui|icons)\//.test(f))).toEqual([]);
    expect(loaded.filter((f) => /canvas\/src\/react\//.test(f))).toEqual([]);
  });
});

describe("the editor side of flow", () => {
  it("builds its registry without React: the contract and the far primitives load none", () => {
    const registry = [
      join(src, "react", "plugin.ts"),
      join(src, "plugins", "editor", "far-view.ts"),
      join(src, "plugins", "editor", "surface.ts"),
    ];
    const { bare } = closure(registry);
    expect(
      bare.filter((b) => /^(react|react-dom|@forgeron\/ui|@forgeron\/icons)(\/|$)/.test(b)),
    ).toEqual([]);
  });

  it("has an editor half for every bundled family", () => {
    const names = files(join(src, "plugins", "editor")).map((f) => relative(src, f));
    for (const family of ["clipboard", "connect", "edges", "groups", "layout", "nodes", "ui"]) {
      expect(names.some((n) => n.startsWith(join("plugins", "editor", family)))).toBe(true);
    }
  });
});
