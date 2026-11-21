// @forgeron/richtext/react: the editor and its read-only view. Import the styles once, after those
// of ui: `import "@forgeron/richtext/styles.css"`. The Yjs helpers are also exported from here. The
// plugins (core and editor halves) are in `@forgeron/richtext/plugins` and `.../plugins/editor`.

export { RichTextEditor } from "./editor";
export type { RichTextEditorProps } from "./editor";
export { RichTextView } from "./view";
export type { RichTextViewProps } from "./view";
export { BubbleToolbar, normalizeLink } from "./bubble-toolbar";
export type { BubbleToolbarProps } from "./bubble-toolbar";
export { BlockHandle } from "./block-handle";
export type { BlockHandleProps } from "./block-handle";
export { BlockToolbars } from "./block-toolbar";
export type { BlockToolbarsProps } from "./block-toolbar";
export { SuggestionMenu } from "./suggestion-menu";
export type { SuggestionMenuProps } from "./suggestion-menu";
export { createSuggestionStore } from "./suggestion-store";
export type { SuggestionState, SuggestionStore } from "./suggestion-store";
export { createLocalSync, createYDoc, fromYDoc, toYDoc } from "../collab/index";
export type { LocalPeer, LocalSync } from "../collab/index";
export type { CollaborationOptions } from "../tiptap/host";
export { applyBlock, currentBlock } from "../tiptap/commands";
export { datesPanel } from "./date-panel";
