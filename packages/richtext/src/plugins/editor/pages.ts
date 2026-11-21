// Pages, editor half: `[[` opens a search over the pages the app provides; picking one inserts a
// chip of the kind `page`. The editor knows no page: the app gives the search and the addresses.

import type { ReferenceItem } from "../../core/references";
import { pagesPlugin, type PagesCoreOptions } from "../pages";
import { defineEditorPlugin, defineSuggestion } from "../../tiptap/plugin";
import { allowChips, insertReference } from "./references-kit";

export interface PagesOptions extends PagesCoreOptions {
  /** The pages that match what was typed after `[[`: a fixed list, or a search on a server. */
  search: (query: string) => ReferenceItem[] | Promise<ReferenceItem[]>;
  /** The menu's accessible name. Default `Link a page`. */
  label?: string;
  /** What the menu says when nothing matches. Default `No page matches`. */
  empty?: string;
}

/**
 * The editor half of the pages plugin. Give it to the editor next to `references`, and the same
 * `href` to the core half the static view uses (`pagesPlugin({ href })`, or `pages.core`).
 */
export function pagesEditor(options: PagesOptions) {
  return defineEditorPlugin({
    core: pagesPlugin(options.href ? { href: options.href } : {}),
    suggestions: () => [
      defineSuggestion<ReferenceItem>({
        id: "reference-page",
        char: "[[",
        label: options.label ?? "Link a page",
        empty: options.empty ?? "No page matches",
        // A title has spaces: the menu stays open until Escape or a pick.
        allowSpaces: true,
        items: (query) => options.search(query),
        present: (item) => ({
          key: item.id,
          label: item.label,
          ...(item.hint ? { hint: item.hint } : {}),
        }),
        allow: allowChips,
        command: ({ editor, range, item }) =>
          insertReference(editor, range, { kind: "page", id: item.id, label: item.label }),
      }),
    ],
  });
}
