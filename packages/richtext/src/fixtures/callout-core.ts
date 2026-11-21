// A third-party plugin as the tests define it: a callout, in its own file, with no help from the
// package beyond the public contract. Core half: the JSON node, its slash entry, its Markdown
// (`:::callout` ... `:::`) and its static view.

import { definePlugin, el } from "../index";

export const callout = definePlugin({
  id: "callout",
  name: "Callout",
  description: "A highlighted box holding other blocks.",
  nodes: {
    callout: {
      markdown: (node, w) => `:::callout\n${w.blocks(node.content ?? [])}\n:::`,
      render: (node, w) => [el("aside", { class: "fg-rt-callout" }, w.children(node))],
    },
  },
  blocks: [
    {
      id: "callout",
      label: "Callout",
      keywords: ["note", "info", "aside", "box"],
      icon: "quote",
      group: "text",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "callout",
        priority: 95,
        interrupts: (line) => line.trim() === ":::callout",
        read: (lines, at, reader) => {
          if (lines[at]?.trim() !== ":::callout") return undefined;
          const inner: string[] = [];
          let i = at + 1;
          while (i < lines.length && lines[i]?.trim() !== ":::") {
            inner.push(lines[i] as string);
            i++;
          }
          return { nodes: [{ type: "callout", content: reader.blocks(inner) }], next: i + 1 };
        },
      },
    ],
  },
});
