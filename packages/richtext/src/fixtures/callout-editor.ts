// The editor half of the test callout: a Tiptap node and how its slash entry wraps the selection.

import { Node, mergeAttributes } from "@tiptap/core";
import { defineEditorPlugin, startChain } from "../plugins/editor/index";
import { callout as calloutCore } from "./callout-core";

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
