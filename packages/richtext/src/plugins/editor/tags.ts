// Tags, editor half: `#` opens the tags the app provides, and, when the app allows it, offers to
// create the one being typed. Picking inserts a chip of the kind `tag`.

import type { ReferenceItem } from "../../core/references";
import { tagsPlugin, type TagsCoreOptions } from "../tags";
import { defineEditorPlugin, defineSuggestion } from "../../tiptap/plugin";
import { allowChips, insertReference } from "./references-kit";

export interface TagsOptions extends TagsCoreOptions {
  /** The tags that match what was typed after `#`. Without it only creation is offered. */
  search?: (query: string) => ReferenceItem[] | Promise<ReferenceItem[]>;
  /**
   * Makes a new tag from the typed text and gives it back (`{ id, label }`): the app saves it.
   * Without it, no tag can be created from the editor. `null` cancels: the typed text stays.
   */
  onCreate?: (label: string) => ReferenceItem | null | Promise<ReferenceItem | null>;
  /** The menu's accessible name. Default `Tag`. */
  label?: string;
  /** What the menu says when nothing matches. Default `No tag matches`. */
  empty?: string;
}

/** A candidate of the tag menu: an existing tag, or the one the typed text would create. */
export interface TagItem extends ReferenceItem {
  create?: boolean;
}

/** The editor half of the tags plugin. */
export function tagsEditor(options: TagsOptions = {}) {
  return defineEditorPlugin({
    core: tagsPlugin(options.href ? { href: options.href } : {}),
    suggestions: () => [
      defineSuggestion<TagItem>({
        id: "reference-tag",
        char: "#",
        label: options.label ?? "Tag",
        empty: options.empty ?? "No tag matches",
        items: async (query) => {
          const found: TagItem[] = [...((await options.search?.(query)) ?? [])];
          const typed = query.trim();
          const exists = found.some((t) => t.label.toLowerCase() === typed.toLowerCase());
          if (options.onCreate && typed && !exists) {
            found.push({ id: `create:${typed}`, label: typed, hint: "New tag", create: true });
          }
          return found;
        },
        present: (item) => ({
          key: item.id,
          label: item.create ? `Create #${item.label}` : `#${item.label}`,
          ...(item.hint ? { hint: item.hint } : {}),
        }),
        allow: allowChips,
        command: ({ editor, range, item }) => {
          if (!item.create || !options.onCreate) {
            insertReference(editor, range, { kind: "tag", id: item.id, label: item.label });
            return;
          }
          const made = options.onCreate(item.label);
          const place = (tag: ReferenceItem | null) => {
            if (!tag || editor.isDestroyed) return;
            const ref = { kind: "tag", id: tag.id, label: tag.label };
            // Still where it was typed: replace the text. Edited meanwhile: insert at the cursor.
            const size = editor.state.doc.content.size;
            const typed = editor.state.doc.textBetween(range.from, Math.min(range.to, size));
            const here = typed === `#${item.label}` ? range : editor.state.selection;
            insertReference(editor, { from: here.from, to: here.to }, ref);
          };
          if (made instanceof Promise) void made.then(place, () => undefined);
          else place(made);
        },
      }),
    ],
  });
}
