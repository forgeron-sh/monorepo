// The placeholder: a hint in the empty block under the cursor, the text given to the editor.

import Placeholder from "@tiptap/extension-placeholder";
import { placeholder as placeholderCore } from "../ui";
import { defineEditorPlugin } from "../../tiptap/plugin";

export const placeholder = defineEditorPlugin({
  core: placeholderCore,
  extensions: (ctx) => [
    Placeholder.configure({
      placeholder: () => ctx.placeholder,
      showOnlyCurrent: true,
      includeChildren: false,
    }),
  ],
});
