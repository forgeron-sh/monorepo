// The divider, editor half.

import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { horizontalRule as horizontalRuleCore } from "../divider";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

export const horizontalRule = defineEditorPlugin({
  core: horizontalRuleCore,
  extensions: [HorizontalRule],
  blocks: {
    divider: {
      apply: ({ editor, range }) => void startChain(editor, range).setHorizontalRule().run(),
    },
  },
});
