// Quotes: blocks that hold other blocks, `> quoted` in Markdown.

import { definePlugin } from "../core/plugin";
import { el } from "../core/view";

const QUOTE = /^ {0,3}>/;

export const blockquote = definePlugin({
  id: "blockquote",
  name: "Quote",
  description: "A quotation holding other blocks: `> quoted`.",
  nodes: {
    blockquote: {
      markdown: (node, w) =>
        w
          .blocks(node.content ?? [])
          .split("\n")
          .map((l) => (l ? `> ${l}` : ">"))
          .join("\n"),
      render: (node, w) => [el("blockquote", undefined, w.children(node))],
    },
  },
  blocks: [
    {
      id: "quote",
      label: "Quote",
      keywords: ["blockquote", "citation"],
      icon: "quote",
      group: "text",
      shortcut: ">",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "blockquote",
        priority: 70,
        interrupts: (line) => QUOTE.test(line),
        read: (lines, at, reader) => {
          if (!QUOTE.test(lines[at] as string)) return undefined;
          const inner: string[] = [];
          let i = at;
          while (i < lines.length && QUOTE.test(lines[i] as string)) {
            inner.push((lines[i] as string).replace(/^ {0,3}> ?/, ""));
            i++;
          }
          const content = reader.blocks(inner);
          return {
            nodes: [
              { type: "blockquote", content: content.length ? content : [{ type: "paragraph" }] },
            ],
            next: i,
          };
        },
      },
    ],
  },
});
