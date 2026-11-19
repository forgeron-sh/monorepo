// What `variant` means for the editor: a named list of plugins.

import type { EditorPlugin } from "../../tiptap/plugin";
import { blockquote } from "./blockquote";
import { codeBlock } from "./code-block";
import { horizontalRule } from "./divider";
import { heading } from "./heading";
import { image } from "./image";
import { bulletList, listItem, orderedList, taskList } from "./lists";
import { bold, code, italic, link, strike, underline } from "./marks";
import { placeholder } from "./placeholder";
import { references } from "./references";
import { table } from "./table";
import { blockHandle, blockToolbar, bubble, slash } from "./ui";

/** Marks, lists and mentions: for a comment or a description. */
export const minimalEditorPlugins: ReadonlyArray<EditorPlugin> = [
  placeholder,
  link,
  bold,
  italic,
  strike,
  underline,
  code,
  listItem,
  bulletList,
  orderedList,
  taskList,
  references,
  slash,
  bubble,
];

/** A page: every bundled plugin, in the order of the slash menu. */
export const fullEditorPlugins: ReadonlyArray<EditorPlugin> = [
  placeholder,
  link,
  bold,
  italic,
  strike,
  underline,
  code,
  heading,
  listItem,
  bulletList,
  orderedList,
  taskList,
  blockquote,
  codeBlock,
  horizontalRule,
  table,
  image,
  references,
  slash,
  bubble,
  blockHandle,
  blockToolbar,
];

export const editorPresets = { full: fullEditorPlugins, minimal: minimalEditorPlugins } as const;
