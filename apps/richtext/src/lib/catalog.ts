// The catalog of plugins, from data: the docs of the bundled plugins (`builtin-docs.ts`) and every
// `PluginDoc[]` exported by a file of `packages/richtext/src/plugins/docs/`. A plugin that arrives
// with its docs file (`referencesDocs`, `attachmentsDocs`, ...) shows up here with no change to the
// site. A file that holds no `PluginDoc` (the types) is skipped, so is any export that is not an
// array of documents. Runs at build time and in the islands (it is plain data).

import type { PluginDoc } from "@forgeron/richtext/plugins/docs/types";
import { builtinDocs } from "./builtin-docs";

const modules = import.meta.glob<Record<string, unknown>>(
  "../../../../packages/richtext/src/plugins/docs/*.ts",
  { eager: true },
);

const isDoc = (v: unknown): v is PluginDoc => {
  if (typeof v !== "object" || v === null) return false;
  const d = v as Record<string, unknown>;
  return (
    typeof d["id"] === "string" &&
    typeof d["family"] === "string" &&
    typeof d["name"] === "string" &&
    typeof d["summary"] === "string" &&
    typeof d["core"] === "string" &&
    typeof d["editor"] === "string" &&
    typeof d["usage"] === "string"
  );
};

/** The families in the order the catalog shows them; any other family goes before the interface. */
const FAMILIES: ReadonlyArray<readonly [id: string, label: string, blurb: string]> = [
  ["core", "Core", "What every editor has: the document and the hint under the cursor."],
  ["text", "Text", "Marks on a piece of text: bold, links, code."],
  ["blocks", "Blocks", "Headings, lists, quote, code, divider, table."],
  ["media", "Media", "Pictures and what is drawn from a source."],
  ["references", "References", "Inline pointers to people, pages and tags of your app."],
  ["attachments", "Attachments", "Files and uploads."],
  ["layout", "Layout", "Blocks that hold blocks: columns, callouts, toggles."],
  ["advanced", "Advanced", "Embeds, maths and other things that need a source."],
  ["interface", "Interface", "The menus and toolbars: each draws a slot the plugins fill."],
];
const rank = (family: string): number => {
  const at = FAMILIES.findIndex(([id]) => id === family);
  if (at !== -1) return at === FAMILIES.length - 1 ? 1000 : at;
  return FAMILIES.length - 1 - 0.5; // unknown families: before the interface, in the order met
};

/** Where each doc came from: `builtin`, or the file of the package that exports it. */
const origin = new Map<string, string>();
const byId = new Map<string, PluginDoc>();
for (const doc of builtinDocs) {
  byId.set(doc.id, doc);
  origin.set(doc.id, "builtin");
}
for (const [path, mod] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
  if (path.endsWith("/types.ts")) continue;
  for (const value of Object.values(mod)) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      // A docs file wins over the builtin text for the same id: it is written by the plugin's author.
      if (isDoc(item)) {
        byId.set(item.id, item);
        origin.set(item.id, path.split("/").pop() ?? path);
      }
    }
  }
}

const position = new Map([...byId.keys()].map((id, i) => [id, i]));
export const catalog: ReadonlyArray<PluginDoc> = [...byId.values()].sort(
  (a, b) =>
    rank(a.family) - rank(b.family) || (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0),
);

export interface Family {
  id: string;
  label: string;
  blurb: string;
  docs: ReadonlyArray<PluginDoc>;
}

export const families: ReadonlyArray<Family> = [...new Set(catalog.map((d) => d.family))].map(
  (id) => {
    const known = FAMILIES.find(([f]) => f === id);
    return {
      id,
      label: known?.[1] ?? id.charAt(0).toUpperCase() + id.slice(1),
      blurb: known?.[2] ?? "",
      docs: catalog.filter((d) => d.family === id),
    };
  },
);

export const docOf = (id: string): PluginDoc | undefined => byId.get(id);
export const originOf = (id: string): string => origin.get(id) ?? "builtin";
export const familyLabel = (id: string): string => families.find((f) => f.id === id)?.label ?? id;

/** First sentence of a summary, for the cards of the index. */
export const firstSentence = (text: string): string => {
  const m = /^.*?[.!?](?=\s|$)/.exec(text);
  return m ? m[0] : text;
};

/**
 * The names a doc's usage snippet imports from `module`: the exact export names of a plugin (a factory
 * such as `pagesEditor` has no name one could guess from its id). Empty when it imports none from there.
 */
export function importedFrom(doc: PluginDoc, module: string): string[] {
  const names: string[] = [];
  for (const m of doc.usage.matchAll(/import\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)) {
    if (m[2] !== module) continue;
    for (const name of m[1]!.split(",")) {
      const clean = name.replace(/\btype\s+/, "").trim();
      if (clean) names.push(clean);
    }
  }
  return names;
}
