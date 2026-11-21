// Code blocks, editor half.

import { CodeBlock } from "@tiptap/extension-code-block";
import { codeBlock as codeBlockCore } from "../code-block";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

export const codeBlock = defineEditorPlugin({
  core: codeBlockCore,
  extensions: [CodeBlock],
  blocks: {
    "code-block": {
      apply: ({ editor, range }) =>
        void startChain(editor, range).clearNodes().setCodeBlock().run(),
      isActive: (editor) => editor.isActive("codeBlock"),
    },
  },
  turnable: ["codeBlock"],
});
