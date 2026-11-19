// References: an inline pointer to a thing of the app, `{ kind, id, label }`. A person, a page, a
// tag are kinds; providers (editor half) offer the candidates when a trigger character is typed.
// The kind `user` is the old `mention`: old documents are read as such, and `[@Label](mention:id)`
// stays its Markdown form. Other kinds are written `[Label](ref:kind:id)`.

import { closingBracket, destination, unescapeMd } from "../core/markdown-kit";
import type { RichNode } from "../core/types";
import { definePlugin } from "../core/plugin";
import { asReference } from "../core/references";
import { el } from "../core/view";

const SIGILS: Record<string, string> = { user: "@" };

const display = (kind: string, label: string) => `${SIGILS[kind] ?? ""}${label}`;

/** `{ kind, id, label }`, always in this order, so equal references are equal JSON. */
export const referenceNode = (kind: string, id: string, label: string): RichNode => ({
  type: "reference",
  attrs: { kind, id, label },
});

const read = (node: RichNode) => asReference(node);

export const references = definePlugin({
  id: "references",
  name: "References",
  description:
    "Inline pointers to people, pages or tags: `@Ada`. The app provides the candidates per kind.",
  nodes: {
    reference: {
      inline: true,
      markdown: (node, w) => {
        const ref = read(node);
        if (!ref) return "";
        return ref.kind === "user"
          ? `[@${w.escape(ref.label)}](mention:${w.escapeUrl(ref.id)})`
          : `[${w.escape(ref.label)}](ref:${encodeURIComponent(ref.kind)}:${w.escapeUrl(ref.id)})`;
      },
      text: (node) => {
        const ref = read(node);
        return ref ? display(ref.kind, ref.label) : "";
      },
      render: (node) => {
        const ref = read(node);
        if (!ref) return [];
        return [
          el(
            "span",
            {
              class: "fg-rt-mention",
              "data-reference": ref.id,
              "data-reference-kind": ref.kind,
              ...(ref.kind === "user" ? { "data-mention": ref.id } : {}),
            },
            [display(ref.kind, ref.label)],
          ),
        ];
      },
    },
  },
  migrate: {
    mention: (node) => {
      const id = String(node.attrs?.["id"] ?? "");
      return referenceNode("user", id, String(node.attrs?.["label"] ?? id));
    },
  },
  markdown: {
    inline: [
      {
        chars: "[",
        priority: 10,
        read: (src, at) => {
          const close = closingBracket(src, at);
          const dest = close === -1 ? undefined : destination(src, close + 1);
          if (close === -1 || !dest) return undefined;
          const label = src.slice(at + 1, close);
          if (dest.url.startsWith("mention:") && label.startsWith("@")) {
            return {
              nodes: [referenceNode("user", dest.url.slice(8), unescapeMd(label.slice(1)))],
              end: dest.end,
            };
          }
          if (dest.url.startsWith("ref:")) {
            const rest = dest.url.slice(4);
            const cut = rest.indexOf(":");
            if (cut > 0) {
              const kind = safeDecode(rest.slice(0, cut));
              return {
                nodes: [referenceNode(kind, rest.slice(cut + 1), unescapeMd(label))],
                end: dest.end,
              };
            }
          }
          return undefined;
        },
      },
    ],
  },
});

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
