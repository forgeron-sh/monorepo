// Every bundled plugin that holds content, editor halves, with no interface in it and no React: what
// the schema is built from on a server (`@forgeron/richtext/collab`).

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

/** The `full` preset without its interface plugins. */
export const contentPlugins: ReadonlyArray<EditorPlugin> = [
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
];
