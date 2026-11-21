// A plugin of your own, in one file: a callout, a box that holds other blocks. It is the one the
// package's tests define (packages/richtext/src/fixtures/), with no help beyond the public API.
// This very file is shown on the "Use it" page and runs in the demo below it.

import { definePlugin, el } from "@forgeron/richtext";
import {
  Node,
  defineEditorPlugin,
  mergeAttributes,
  startChain,
} from "@forgeron/richtext/plugins/editor";

// 1. The core half: the JSON node, its slash entry, its Markdown and its static view. No React,
//    no Tiptap: a read-only place can load it alone.
const calloutCore = definePlugin({
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

// 2. The editor half: a Tiptap node, and how the slash entry wraps the selection in it.
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML: () => [{ tag: "aside[data-callout]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "aside",
    mergeAttributes({ "data-callout": "", class: "fg-rt-callout" }, HTMLAttributes),
    0,
  ],
});

export const callout = defineEditorPlugin({
  core: calloutCore,
  extensions: [Callout],
  blocks: {
    callout: {
      apply: ({ editor, range }) => void startChain(editor, range).wrapIn("callout").run(),
      isActive: (editor) => editor.isActive("callout"),
    },
  },
  turnable: ["callout"],
});
