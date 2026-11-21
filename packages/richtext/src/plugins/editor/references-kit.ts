// What the reference kinds of this family (pages, tags, dates) share, editor half: inserting a
// chip where a trigger was typed, and a class on the chips of one kind.

import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { asReference, type Reference } from "../../core/references";
import type { Range } from "../../tiptap/plugin";

/** Replaces the trigger and what was typed after it (`range`) with a chip and a space. */
export function insertReference(editor: Editor, range: Range, ref: Reference): void {
  const next = { ...range };
  const after = editor.view.state.selection.$to.nodeAfter;
  if (after?.text?.startsWith(" ")) next.to += 1;
  editor
    .chain()
    .focus()
    .insertContentAt(next, [
      { type: "reference", attrs: { kind: ref.kind, id: ref.id, label: ref.label } },
      { type: "text", text: " " },
    ])
    .run();
  editor.view.dom.ownerDocument.defaultView?.getSelection()?.collapseToEnd();
}

/** Where a chip may be typed: not inside code. */
export const allowChips = ({ state, range }: { state: Editor["state"]; range: Range }): boolean =>
  !state.doc.resolve(range.from).parent.type.spec.code;

/**
 * Adds a class to every chip of one kind for which `classFor` answers (an overdue date). A
 * decoration only: the document is not touched, and it follows every edit.
 */
export function chipClasses(
  name: string,
  kind: string,
  classFor: (ref: Reference) => string | undefined,
) {
  const key = new PluginKey(`fgChips-${name}`);
  return Extension.create({
    name: `fgChips-${name}`,
    addProseMirrorPlugins: () => [
      new Plugin({
        key,
        props: {
          decorations: (state) => {
            const found: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== "reference") return;
              const ref = asReference({ type: "reference", attrs: node.attrs });
              const cls = ref?.kind === kind ? classFor(ref) : undefined;
              if (cls) found.push(Decoration.node(pos, pos + node.nodeSize, { class: cls }));
            });
            return DecorationSet.create(state.doc, found);
          },
        },
      }),
    ],
  });
}
