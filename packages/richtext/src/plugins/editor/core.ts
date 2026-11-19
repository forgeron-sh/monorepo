// The editor half of the core: the document, paragraph, text, hard break, history, the cursors that
// make blocks reachable, and the placeholder for what the document holds but the plugins do not
// know. Always present.

import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { Dropcursor, Gapcursor, TrailingNode, UndoRedo } from "@tiptap/extensions";
import { core } from "../core";
import { defineEditorPlugin, type EditorPlugin } from "../../tiptap/plugin";
import { UnknownBlock, UnknownInline } from "../../tiptap/unknown";
import { startChain } from "./kit";

export const coreEditor = defineEditorPlugin({
  core,
  extensions: (ctx) => [
    Document,
    Text,
    Paragraph,
    HardBreak,
    Dropcursor.configure({ color: "var(--accent)", width: 2 }),
    Gapcursor,
    TrailingNode,
    // The shared document keeps its own history (Yjs's undo manager is not used: one editor's
    // undo must not undo another's typing), so ProseMirror's history is dropped.
    ...(ctx.collaborative ? [] : [UndoRedo]),
    UnknownBlock,
    UnknownInline,
  ],
  blocks: {
    paragraph: {
      apply: ({ editor, range }) => {
        startChain(editor, range).clearNodes().run();
      },
    },
  },
  turnable: ["paragraph"],
});

/** The plugin list with the core in front: the core is always there, whatever the list says. */
export const withCoreEditor = (list: ReadonlyArray<EditorPlugin>): ReadonlyArray<EditorPlugin> =>
  list.some((p) => p.core.id === coreEditor.core.id) ? list : [coreEditor, ...list];
