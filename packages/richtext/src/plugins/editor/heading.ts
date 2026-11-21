// Headings, editor half: the Tiptap heading and its three slash entries.

import { Heading } from "@tiptap/extension-heading";
import { heading as headingCore } from "../heading";
import { type BlockAction, defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

const level = (id: 1 | 2 | 3): BlockAction => ({
  apply: ({ editor, range }) =>
    void startChain(editor, range).clearNodes().setHeading({ level: id }).run(),
  isActive: (editor) => editor.isActive("heading", { level: id }),
});

export const heading = defineEditorPlugin({
  core: headingCore,
  extensions: [Heading.configure({ levels: [1, 2, 3] })],
  blocks: { "heading-1": level(1), "heading-2": level(2), "heading-3": level(3) },
  turnable: ["heading"],
});
