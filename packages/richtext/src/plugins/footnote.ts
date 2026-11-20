// Footnotes, core half: an inline `footnote` node `{ id }` that holds the text of its note, so the
// note travels with the reference (copy, paste, collaboration). Numbers are never stored: they are
// derived from the order of the references each time the document is written, read as text or
// rendered, so inserting a footnote renumbers the others. The static view gathers the notes in a
// list at the foot of the document; Markdown is `[^1]` and `[^1]: text`.

import type { DocumentHooks } from "../core/plugin";
import { definePlugin } from "../core/plugin";
import type { RichNode } from "../core/types";
import { el, str } from "../core/view";
import type { ViewNode } from "../core/view";

const DEF = /^ {0,3}\[\^([^\]\s]+)\]:[ \t]?(.*)$/;
const REF = /^\[\^([^\]\s]+)\]/;

/** The footnotes of a document in reading order (depth first), at any depth. */
export function footnotesOf(root: RichNode): RichNode[] {
  const out: RichNode[] = [];
  const walk = (node: RichNode) => {
    if (node.type === "footnote") {
      out.push(node);
      return;
    }
    for (const child of node.content ?? []) walk(child);
  };
  walk(root);
  return out;
}

/** The text of a note, one line, marks dropped. */
export const noteText = (node: RichNode): string =>
  (node.content ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .replace(/\s*\n\s*/g, " ");

const idOf = (node: RichNode) => str(node.attrs?.["id"]) ?? "";

// Numbers by node object, refreshed by `prepare` before each walk of a document.
const numbers = new WeakMap<RichNode, number>();
const numberOf = (node: RichNode) => numbers.get(node);

const hooks: DocumentHooks = {
  prepare: (root) => {
    footnotesOf(root).forEach((node, i) => numbers.set(node, i + 1));
  },
  markdown: (root, markdown, w) => {
    const notes = footnotesOf(root);
    if (!notes.length) return markdown;
    const defs = notes.map((n, i) => `[^${i + 1}]: ${w.inline(n.content ?? [])}`.trimEnd());
    return `${markdown}\n\n${defs.join("\n\n")}`;
  },
  text: (root, text, w) => {
    const notes = footnotesOf(root);
    if (!notes.length) return text;
    const lines = notes.map((n, i) => `[${i + 1}] ${noteText(n)}`.trimEnd());
    return `${text}${w.sep}${w.sep}${lines.join(w.sep)}`;
  },
  render: (root, tree, w) => {
    const notes = footnotesOf(root);
    if (!notes.length) return tree;
    const items: ViewNode[] = notes.map((n, i) =>
      el("li", { id: `fn-${i + 1}`, "data-footnote": idOf(n) }, [
        ...w.children(n),
        " ",
        el(
          "a",
          {
            href: `#fnref-${i + 1}`,
            class: "fg-rt-fn-back",
            "aria-label": "Back to the reference",
          },
          ["↩"],
        ),
      ]),
    );
    return [
      ...tree,
      el("section", { class: "fg-rt-footnotes", "aria-label": "Footnotes" }, [
        el("ol", undefined, items),
      ]),
    ];
  },
  fromMarkdown: (root) => {
    // Definitions come out of the top level; each reference takes the text of its definition.
    const defs = new Map<string, RichNode>();
    const rest: RichNode[] = [];
    for (const node of root.content ?? []) {
      if (node.type === "footnoteDef") {
        if (!defs.has(idOf(node))) defs.set(idOf(node), node);
      } else rest.push(node);
    }
    const used = new Set<string>();
    const resolve = (node: RichNode): RichNode[] => {
      if (node.type === "footnote") {
        const def = defs.get(idOf(node));
        if (!def) return [{ type: "text", text: `[^${idOf(node)}]` }];
        used.add(idOf(node));
        const text = (def.content ?? []).filter((c) => c.type === "text");
        return [
          {
            type: "footnote",
            attrs: { id: idOf(node) },
            ...(text.length ? { content: text } : {}),
          },
        ];
      }
      if (!node.content) return [node];
      return [{ ...node, content: node.content.flatMap(resolve) }];
    };
    const content = rest.flatMap(resolve);
    // A definition nothing points at is kept as a paragraph, so no text is lost.
    for (const [id, def] of defs) {
      if (used.has(id)) continue;
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: `[^${id}]: ` }, ...(def.content ?? [])],
      });
    }
    return { ...root, content };
  },
};

export const footnote = definePlugin({
  id: "footnote",
  name: "Footnote",
  description:
    "Footnotes with the note inside the reference, numbered from their order and listed at the foot of the page: `[^1]`.",
  nodes: {
    footnote: {
      inline: true,
      markdown: (node) => `[^${numberOf(node) ?? idOf(node)}]`,
      text: (node) => `[${numberOf(node) ?? idOf(node)}]`,
      render: (node) => [
        el("sup", { class: "fg-rt-fn-ref", id: `fnref-${numberOf(node) ?? idOf(node)}` }, [
          el("a", { href: `#fn-${numberOf(node) ?? idOf(node)}` }, [String(numberOf(node) ?? "*")]),
        ]),
      ],
    },
  },
  blocks: [
    {
      id: "footnote",
      label: "Footnote",
      keywords: ["note", "reference", "cite", "endnote", "source"],
      icon: "note",
      group: "insert",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "footnoteDef",
        priority: 80,
        interrupts: (line) => DEF.test(line),
        read: (lines, at, reader) => {
          const head = DEF.exec(lines[at] as string);
          if (!head) return undefined;
          const parts = [head[2] as string];
          let i = at + 1;
          // Indented lines continue the note.
          while (i < lines.length && /^( {2,}|\t)\S/.test(lines[i] as string)) {
            parts.push((lines[i] as string).trim());
            i++;
          }
          const content = reader.inline(parts.join(" ").trim());
          return {
            nodes: [
              {
                type: "footnoteDef",
                attrs: { id: head[1] as string },
                ...(content.length ? { content } : {}),
              },
            ],
            next: i,
          };
        },
      },
    ],
    inline: [
      {
        chars: "[",
        priority: 20,
        read: (src, at) => {
          const hit = REF.exec(src.slice(at));
          if (!hit) return undefined;
          // `[^1]:` at the start of a line is a definition, read by the block reader.
          return {
            nodes: [{ type: "footnote", attrs: { id: hit[1] as string } }],
            end: at + hit[0].length,
          };
        },
      },
    ],
  },
  document: hooks,
});
