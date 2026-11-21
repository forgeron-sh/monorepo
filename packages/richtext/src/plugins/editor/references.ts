// References, editor half: the inline `reference` node and one suggestion menu per provider (its
// trigger character, its candidates). The legacy `@` mention is the provider of the kind `user`.

import { Node, mergeAttributes } from "@tiptap/core";
import type { ReferenceItem } from "../../core/references";
import { references as referencesCore } from "../references";
import { defineEditorPlugin, defineSuggestion } from "../../tiptap/plugin";

const SIGILS: Record<string, string> = { user: "@" };
const display = (kind: string, label: string) => `${SIGILS[kind] ?? ""}${label}`;

/** `{ kind, id, label }`: what the document stores for a reference. */
export const ReferenceNode = Node.create({
  name: "reference",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  addAttributes: () => ({
    kind: {
      default: "user",
      parseHTML: (el) => el.getAttribute("data-kind") ?? "user",
      renderHTML: (attrs) => ({ "data-kind": attrs["kind"] }),
    },
    id: {
      default: null,
      parseHTML: (el) => el.getAttribute("data-id"),
      renderHTML: (attrs) => (attrs["id"] ? { "data-id": attrs["id"] } : {}),
    },
    label: {
      default: null,
      parseHTML: (el) => el.getAttribute("data-label"),
      renderHTML: (attrs) => (attrs["label"] ? { "data-label": attrs["label"] } : {}),
    },
  }),
  parseHTML: () => [{ tag: 'span[data-type="reference"]' }, { tag: 'span[data-type="mention"]' }],
  renderHTML: ({ node, HTMLAttributes }) => [
    "span",
    mergeAttributes({ "data-type": "reference", class: "fg-rt-mention" }, HTMLAttributes),
    display(String(node.attrs["kind"]), String(node.attrs["label"] ?? node.attrs["id"])),
  ],
  renderText: ({ node }) =>
    display(String(node.attrs["kind"]), String(node.attrs["label"] ?? node.attrs["id"])),
});

export const references = defineEditorPlugin({
  core: referencesCore,
  extensions: [ReferenceNode],
  suggestions: (ctx) =>
    ctx.references.map((provider) =>
      defineSuggestion<ReferenceItem>({
        id: `reference-${provider.kind}`,
        char: provider.char ?? "@",
        label: provider.label ?? provider.kind,
        empty: provider.empty ?? "No match",
        // Read the provider again at each call: its candidates may change without a rebuild.
        items: (query) => ctx.references.find((p) => p.kind === provider.kind)?.items(query) ?? [],
        present: (item) => ({
          key: item.id,
          label: item.label,
          ...(item.hint ? { hint: item.hint } : {}),
        }),
        command: ({ editor, range, item }) => {
          const next = { ...range };
          const after = editor.view.state.selection.$to.nodeAfter;
          if (after?.text?.startsWith(" ")) next.to += 1;
          editor
            .chain()
            .focus()
            .insertContentAt(next, [
              { type: "reference", attrs: { kind: provider.kind, id: item.id, label: item.label } },
              { type: "text", text: " " },
            ])
            .run();
          editor.view.dom.ownerDocument.defaultView?.getSelection()?.collapseToEnd();
        },
      }),
    ),
});
