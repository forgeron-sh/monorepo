// @forgeron/richtext: the rich text editor's core. No React, no ProseMirror, no DOM: the document
// as JSON, the block catalog, Markdown in and out, plain text and a static renderer. The editor
// is in `@forgeron/richtext/react`, the Yjs helpers in `@forgeron/richtext/collab`.

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
export type { MarkType, NodeType, RichDoc, RichMark, RichNode } from "./core/model";
export { BLOCKS, blocksFor, filterBlocks, filterMentions, getBlock } from "./core/blocks";
export type { BlockDef, BlockGroup, BlockId, MentionItem, RichTextVariant } from "./core/blocks";
export { fromMarkdown, toMarkdown } from "./core/markdown";
export { toPlainText } from "./core/text";
export type { PlainTextOptions } from "./core/text";
export { escapeHtml, safeUrl, toHtml, toTree } from "./core/render";
export type { ViewAttrs, ViewElement, ViewNode } from "./core/render";
