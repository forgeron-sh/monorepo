// The editor halves, found rather than listed: every file of `packages/richtext/src/plugins/editor/`
// is read, and any export that has a `core` with an `id` is a plugin. A plugin added to that folder
// (an attachments plugin, a layout plugin) is in the demos with no change here. Browser only: it
// loads Tiptap and the interface.

import { createRegistry } from "@forgeron/richtext";
import type { EditorPlugin } from "@forgeron/richtext/plugins/editor";
import { catalog, docOf } from "./catalog";
import { factoryOptions } from "./demo-options";

const modules = import.meta.glob<Record<string, unknown>>(
  [
    "../../../../packages/richtext/src/plugins/editor/*.ts*",
    "!../../../../packages/richtext/src/plugins/editor/*.test.*",
  ],
  { eager: true },
);

const isPlugin = (v: unknown): v is EditorPlugin => {
  if (typeof v !== "object" || v === null) return false;
  const core = (v as { core?: unknown }).core;
  return (
    typeof core === "object" && core !== null && typeof (core as { id?: unknown }).id === "string"
  );
};

export interface Registered {
  plugin: EditorPlugin;
  /** The name it is exported under, to write the import line. */
  exportName: string;
  /** The file it was found in. */
  file: string;
}

export const registry = new Map<string, Registered>();
// The index re-exports everything: read it last, so a plugin names the file it is written in.
const files = Object.entries(modules).sort(([a], [b]) => {
  const ai = a.endsWith("/index.ts") ? 1 : 0;
  const bi = b.endsWith("/index.ts") ? 1 : 0;
  return ai - bi || a.localeCompare(b);
});
const register = (plugin: EditorPlugin, exportName: string, path: string) => {
  const id = plugin.core.id;
  if (!registry.has(id))
    registry.set(id, { plugin, exportName, file: path.split("/").pop() ?? path });
};
for (const [path, mod] of files) {
  for (const [exportName, value] of Object.entries(mod)) {
    if (isPlugin(value)) register(value, exportName, path);
  }
}
// A plugin that takes options is a factory by convention: `pagesEditor(options)` makes the editor half
// of the plugin `pages`. It is made once, with fake providers read from the options its docs list.
for (const [path, mod] of files) {
  for (const [exportName, value] of Object.entries(mod)) {
    if (typeof value !== "function" || !/^[a-z]\w*Editor$/.test(exportName)) continue;
    const id = exportName.replace(/Editor$/, "");
    if (registry.has(id)) continue;
    try {
      const made = (value as (options: Record<string, unknown>) => unknown)(
        factoryOptions(docOf(id)),
      );
      if (isPlugin(made)) register(made, exportName, path);
    } catch {
      // Not a factory of a plugin (a helper that happens to end in "Editor"): ignored.
    }
  }
}

/** The ids of the interface plugins: drawn last, after the plugins whose slots they show. */
const INTERFACE_LAST = (id: string) => docOf(id)?.family === "interface";

const order = new Map(catalog.map((d, i) => [d.id, i]));
const rankOf = (id: string) =>
  id === "placeholder"
    ? -1
    : INTERFACE_LAST(id)
      ? 10_000 + (order.get(id) ?? 0)
      : (order.get(id) ?? 5_000);

/** `ids` and everything they require, once each, by id (an unknown id is dropped). */
export function withRequires(ids: Iterable<string>): string[] {
  const out = new Set<string>();
  const visit = (id: string, trail: string[]) => {
    if (out.has(id) || trail.includes(id)) return;
    const found = registry.get(id);
    if (!found) return;
    for (const dep of found.plugin.core.requires ?? []) visit(dep, [...trail, id]);
    out.add(id);
  };
  for (const id of ids) visit(id, []);
  return [...out];
}

/** The plugins to hand to an editor for these ids, requirements included, in menu order. `core` is always added by the editor. */
export function pluginsFor(ids: Iterable<string>): EditorPlugin[] {
  return withRequires(ids)
    .filter((id) => id !== "core")
    .sort((a, b) => rankOf(a) - rankOf(b))
    .map((id) => (registry.get(id) as Registered).plugin);
}

/** Which of `selected` still stand once `id` is taken out: whatever required it goes too. */
export function without(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  next.delete(id);
  let changed = true;
  while (changed) {
    changed = false;
    for (const other of next) {
      const needs = registry.get(other)?.plugin.core.requires ?? [];
      if (needs.some((dep) => !next.has(dep))) {
        next.delete(other);
        changed = true;
      }
    }
  }
  return next;
}

/** `selected` with `id` and what it requires added. */
export function withAdded(selected: ReadonlySet<string>, id: string): Set<string> {
  return new Set([...selected, ...withRequires([id])]);
}

/** `undefined` when the plugins of `ids` make a valid list, else what is wrong with it (two owners of a node type...). */
export function problemWith(ids: Iterable<string>): string | undefined {
  try {
    createRegistry(pluginsFor(ids).map((p) => p.core));
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** As many of `ids` as go together, in order: a plugin that would break the list (two owners of a node type) is left out. */
export function compatible(ids: Iterable<string>): Set<string> {
  let chosen = new Set<string>();
  for (const id of ids) {
    const next = withAdded(chosen, id);
    if (problemWith(next) === undefined) chosen = next;
  }
  return chosen;
}
