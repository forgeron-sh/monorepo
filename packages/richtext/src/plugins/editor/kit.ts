// Small helpers the editor halves of the bundled plugins share. No React.

import type { Editor } from "@tiptap/core";
import type { Range } from "../../tiptap/plugin";

/** A focused command chain that first removes the `/query` the slash menu was typed with. */
export function startChain(editor: Editor, range: Range | undefined) {
  const chain = editor.chain().focus();
  return range ? chain.deleteRange(range) : chain;
}
