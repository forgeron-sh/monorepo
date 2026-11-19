// @forgeron/richtext/plugins/editor: the editor halves of the bundled plugins (Tiptap extensions,
// commands, React interface) and the preset lists. Import the core halves from
// `@forgeron/richtext/plugins`; an editor takes these. Each family is also a subpath of its own.

// What a plugin of your own is made of: the Tiptap pieces, at the version this package uses.
export { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
export { blockquote } from "./blockquote";
export { codeBlock } from "./code-block";
export { contentPlugins } from "./content";
export { coreEditor, withCoreEditor } from "./core";
export { horizontalRule } from "./divider";
export { heading } from "./heading";
export { image } from "./image";
export { startChain } from "./kit";
export { bulletList, listItem, listPlugins, orderedList, taskList } from "./lists";
export { bold, code, italic, link, markPlugins, strike, underline } from "./marks";
export { placeholder } from "./placeholder";
export { editorPresets, fullEditorPlugins, minimalEditorPlugins } from "./presets";
export { ReferenceNode, references } from "./references";
export { table } from "./table";
export { blockHandle, blockToolbar, bubble, slash } from "./ui";
export { defineEditorPlugin, defineSuggestion } from "../../tiptap/plugin";
export type {
  BlockAction,
  BlockToolbar,
  EditorContext,
  EditorPlugin,
  FieldPanel,
  HandleAction,
  ImageRequest,
  ResolvedBlock,
  Slots,
  SuggestionSpec,
  ToolbarItem,
  UiComponent,
  UiProps,
} from "../../tiptap/plugin";
