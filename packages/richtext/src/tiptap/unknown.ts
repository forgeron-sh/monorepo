// Graceful degradation inside the editor. ProseMirror refuses a node its schema does not have (and
// Tiptap answers by emptying the document), so a document that holds a type no plugin of this
// editor knows would be lost. Instead each such node is wrapped, whole, in a placeholder atom that
// remembers it, and put back as it was when the JSON is read out: nothing is dropped, the user sees
// "Unsupported block", and the rest of the page stays editable.

import { Node } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";
import type { RichNode } from "../core/model";
import type { Registry } from "../core/plugin";

const UNKNOWN_BLOCK = "fgUnknownBlock";
const UNKNOWN_INLINE = "fgUnknownInline";

const original = (node: { attrs: Record<string, unknown> }) =>
  (node.attrs["original"] ?? {}) as RichNode;

export const UnknownBlock = Node.create({
  name: UNKNOWN_BLOCK,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: () => ({ original: { default: null, rendered: false } }),
  renderHTML: ({ node }) => [
    "div",
    {
      class: "fg-rt-unknown",
      "data-unknown": original(node).type ?? "",
      contenteditable: "false",
    },
    `Unsupported block (${original(node).type ?? "unknown"})`,
  ],
  renderText: ({ node }) => String(original(node).type ?? ""),
});

export const UnknownInline = Node.create({
  name: UNKNOWN_INLINE,
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({ original: { default: null, rendered: false } }),
  renderHTML: ({ node }) => [
    "span",
    {
      class: "fg-rt-unknown",
      "data-unknown": original(node).type ?? "",
      contenteditable: "false",
    },
    String(original(node).attrs?.["label"] ?? `(${original(node).type ?? "unknown"})`),
  ],
});

/** Wraps every node the schema does not have in a placeholder that holds it; drops unknown marks. */
function wrapUnknown(node: RichNode, schema: Schema): RichNode {
  if (!node.content && !node.marks) return node;
  const parent = schema.nodes[node.type];
  const out: RichNode = { ...node };
  if (node.marks) {
    const marks = node.marks.filter((m) => schema.marks[m.type]);
    if (marks.length) out.marks = marks;
    else delete out.marks;
  }
  if (node.content) {
    out.content = node.content.map((child) => {
      if (child.type === "text" || schema.nodes[child.type]) return wrapUnknown(child, schema);
      const inline = parent?.inlineContent === true;
      return { type: inline ? UNKNOWN_INLINE : UNKNOWN_BLOCK, attrs: { original: child } };
    });
  }
  return out;
}

/** Puts the wrapped nodes back as they were. */
export function restoreUnknown(node: RichNode): RichNode {
  if (node.type === UNKNOWN_BLOCK || node.type === UNKNOWN_INLINE) {
    return (node.attrs?.["original"] ?? { type: "paragraph" }) as RichNode;
  }
  if (!node.content) return node;
  return { ...node, content: node.content.map(restoreUnknown) };
}

/** Reads a document into the editor: legacy nodes migrated, unknown ones wrapped. */
export function prepareContent(node: RichNode, registry: Registry, schema: Schema): RichNode {
  const migrate = (n: RichNode): RichNode => {
    const next = registry.migrate(n);
    return next.content ? { ...next, content: next.content.map(migrate) } : next;
  };
  return wrapUnknown(migrate(node), schema);
}
