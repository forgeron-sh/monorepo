// @forgeron/richtext: the rich text editor's core. No React, no ProseMirror, no DOM: the document
// as JSON, the plugin contract (core half), the block catalog, Markdown in and out, plain text,
// references and a static renderer. Every function takes the list of plugins it works with and
// defaults to the `full` preset. The bundled plugins are in `@forgeron/richtext/plugins`, the
// editor in `@forgeron/richtext/react`, the Yjs helpers in `@forgeron/richtext/collab`.

export {
  doc,
  emptyDoc,
  heading,
  isEmptyDoc,
  link,
  MARK_TYPES,
  normalizeDoc,
  paragraph,
  parseDoc,
  sameDoc,
  text,
} from "./core/model";
export type { MarkType, NodeType, ParseOptions, RichDoc, RichMark, RichNode } from "./core/model";
export { BLOCKS, blocksFor, filterBlocks, filterMentions, getBlock } from "./core/blocks";
export type { BlockDef, BlockGroup, BlockId, MentionItem, RichTextVariant } from "./core/blocks";
export { createRegistry, definePlugin, PluginError, resolvePlugins } from "./core/plugin";
export type {
  BlockReader,
  CorePlugin,
  InlineReader,
  MarkdownReader,
  MarkdownWriter,
  MarkSpec,
  NodeSpec,
  Plugins,
  Registry,
  TextWriter,
  ViewWriter,
} from "./core/plugin";
export { DEFAULT_REGISTRY, registryOf, withCore } from "./core/defaults";
export { fromMarkdown, toMarkdown } from "./core/markdown";
export * as markdownKit from "./core/markdown-kit";
export { toPlainText } from "./core/text";
export type { PlainTextOptions } from "./core/text";
export { escapeHtml, safeUrl, toHtml, toTree } from "./core/render";
export type { ViewAttrs, ViewElement, ViewNode } from "./core/render";
export { el, normalizeLink } from "./core/view";
export { asReference, diffReferences, referencesOf } from "./core/references";
export type {
  Reference,
  ReferenceItem,
  ReferenceProvider,
  ReferencesChange,
} from "./core/references";
