import { type CorePlugin, definePlugin, el } from "@forgeron/richtext";
import {
  Node,
  defineEditorPlugin,
  mergeAttributes,
  startChain,
} from "@forgeron/richtext/plugins/editor";

// A plugin the gallery defines itself: a callout, in one file, with no help from the package beyond
// its public contract. The core half says what it is in the document (its JSON node, its slash
// entry, its Markdown fence, its static view); the editor half is the Tiptap node and the action.

const calloutCore: CorePlugin = definePlugin({
  id: "callout",
  name: "Callout",
  description: "A highlighted box holding other blocks: :::callout ... :::",
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
