// @forgeron/richtext/plugins: the core halves of the bundled plugins and the preset lists. No
// React, no Tiptap, no ProseMirror, no Yjs: a read-only place imports this and the core, nothing
// more. The editor halves are in `@forgeron/richtext/plugins/editor`. Each family is also a
// subpath of its own (`.../plugins/marks`, `.../plugins/lists`) for the plugins an app picks one by
// one.

import type { CorePlugin } from "../core/plugin";
import { blockquote } from "./blockquote";
import { codeBlock } from "./code-block";
import { core } from "./core";
import { horizontalRule } from "./divider";
import { heading } from "./heading";
import { image } from "./image";
import { bulletList, listItem, orderedList, taskList } from "./lists";
import { bold, code, italic, link, strike, underline } from "./marks";
import { references } from "./references";
import { table } from "./table";
import { blockHandle, blockToolbar, bubble, placeholder, slash } from "./ui";

export { blockquote, codeBlock, core, heading, horizontalRule, image, references, table };
export { bold, code, italic, link, strike, underline } from "./marks";
export { bulletList, listItem, orderedList, taskList } from "./lists";
export { blockHandle, blockToolbar, bubble, placeholder, slash } from "./ui";

/** The marks, lists and mentions of a comment or a description. */
export const minimalCorePlugins: ReadonlyArray<CorePlugin> = [
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
export const fullCorePlugins: ReadonlyArray<CorePlugin> = [
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

/** What `variant` means: a named list of plugins. */
export const corePresets = { full: fullCorePlugins, minimal: minimalCorePlugins } as const;
