// What the editor halves of the layout plugins share. No React.

import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

/** The nearest ancestor of the selection named `name`: the node, where it starts, its depth. */
export function ancestor(
  editor: Editor,
  name: string,
): { node: PMNode; pos: number; depth: number } | undefined {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === name) return { node, pos: $from.before(depth), depth };
  }
  return undefined;
}

/** Sets attributes on the nearest ancestor named `name` of the transaction's selection. */
export function setAncestorAttrs(
  tr: Transaction,
  name: string,
  attrs: Record<string, unknown>,
): boolean {
  const { $from } = tr.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name !== name) continue;
    tr.setNodeMarkup($from.before(depth), undefined, { ...node.attrs, ...attrs });
    return true;
  }
  return false;
}
