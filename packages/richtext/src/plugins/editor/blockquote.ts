// Quotes, editor half.

import { Blockquote } from "@tiptap/extension-blockquote";
import { blockquote as blockquoteCore } from "../blockquote";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

export const blockquote = defineEditorPlugin({
  core: blockquoteCore,
  extensions: [Blockquote],
  blocks: {
    quote: {
      apply: ({ editor, range }) =>
        void startChain(editor, range).clearNodes().setBlockquote().run(),
      isActive: (editor) => editor.isActive("blockquote"),
    },
  },
  turnable: ["blockquote"],
});
