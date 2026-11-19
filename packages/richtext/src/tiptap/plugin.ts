// The plugin contract, editor half. Where the core half (`../core/plugin.ts`) says what a plugin
// is in the JSON document, this one says how it behaves in the editor: its Tiptap extensions, how
// its slash entries are applied, and what it adds to the slots of the interface. Slots are named
// places the interface reads: the content plugins contribute, the interface plugins (slash,
// bubble, blockHandle, blockToolbar) draw them.
//
// This file and the plugins' editor halves import no React at run time, so `@forgeron/richtext/
// collab` can build the schema on a server. The React components of the interface plugins are in
// `../plugins/editor/ui.tsx` and the `ui` slot holds them.

import type { AnyExtension, Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { ComponentType, RefObject } from "react";
import type { IconDefinition } from "@forgeron/icons";
import type { BlockDef, CorePlugin } from "../core/plugin";
import type { ReferenceProvider } from "../core/references";

/** A way to ask the app for an image (a file picker, an upload); `null` cancels. */
export type ImageRequest = () => Promise<{ src: string; alt?: string } | null>;

/** Where the plugins' block actions live on the Tiptap editor (`applyBlock`, `currentBlock`). */
export const HOST_STORAGE = "fgHost";

export interface HostStorage {
  actions: ReadonlyMap<string, BlockAction>;
  /** Action ids, those with the highest `precedence` first. */
  order: ReadonlyArray<string>;
  ctx: EditorContext;
}

/** What a plugin can read about the editor it lives in, always current (read it when you need it). */
export interface EditorContext {
  /** A shared document is in use: history is not the editor's, Yjs has its own. */
  readonly collaborative: boolean;
  /** The text shown in the empty block under the cursor. */
  readonly placeholder: string;
  readonly requestImage: ImageRequest | undefined;
  /** The providers of references (the app's people, pages, tags), by kind. */
  readonly references: ReadonlyArray<ReferenceProvider>;
  /** Options of one plugin, given to the editor as `pluginOptions[id]`. */
  option<T = unknown>(pluginId: string): T | undefined;
}

export interface Range {
  from: number;
  to: number;
}

/** How a slash entry (a `BlockDef` of the core half) acts on the document. */
export interface BlockAction {
  /** Turns the block under the cursor into this block, or inserts it. `range` is the `/query` to remove first. */
  apply(args: {
    editor: Editor;
    range: Range | undefined;
    ctx: EditorContext;
    /** The image request in force: the one the caller of `applyBlock` passed, else the editor's. */
    requestImage: ImageRequest | undefined;
  }): void;
  /** Is the cursor in this kind of block? Drives the "turn into" label. */
  isActive?(editor: Editor): boolean;
  /** Checked first when several are active (a bullet list inside a to-do). Default 0. */
  precedence?: number;
  /** `false` hides the entry (an image block without a way to ask for an image). */
  available?(ctx: EditorContext): boolean;
}

/** A button of a toolbar slot (`bubble`, a `blockToolbar`). */
export interface ToolbarItem {
  id: string;
  label: string;
  icon?: IconDefinition;
  /** Left to right, lower first. Default 100. */
  order?: number;
  separatorBefore?: boolean;
  active?(editor: Editor): boolean;
  disabled?(editor: Editor): boolean;
  /** `mod+k`: pressed with the editor focused, it acts as a click. */
  shortcut?: string;
  /** Acts when clicked (unless `field` is set). */
  run?(editor: Editor): void;
  /** Opens a single-field panel in place of the toolbar (a link's address). */
  field?: FieldPanel;
}

export interface FieldPanel {
  /** Names the field for assistive technology. */
  label: string;
  placeholder: string;
  /** What the field starts with: the current link's address. */
  initial(editor: Editor): string;
  /** Checks and cleans the typed value; `undefined` refuses it (Apply stays off). */
  parse(input: string): string | undefined;
  apply(editor: Editor, value: string): void;
  /** Present when there is something to remove: shows a Remove button while `isActive`. */
  remove?(editor: Editor): void;
  isActive?(editor: Editor): boolean;
}

/** An action of the block handle's menu. */
export interface HandleAction {
  id: string;
  label: string;
  icon?: IconDefinition;
  order?: number;
  danger?: boolean;
  run(editor: Editor, at: { pos: number; node: PMNode }): void;
}

/** A toolbar over the block the cursor is in (the nearest ancestor named `node`). */
export interface BlockToolbar {
  id: string;
  label: string;
  node: string;
  items: ReadonlyArray<ToolbarItem>;
}

/** What a trigger character opens: a menu of candidates, and what picking one does. */
export interface SuggestionSpec<T = unknown> {
  id: string;
  /** The character that opens the menu. */
  char: string;
  /** The menu's accessible name. */
  label: string;
  /** What the menu says when nothing matches. */
  empty: string;
  items(query: string): T[] | Promise<T[]>;
  /** How a candidate looks in the menu; `icon` is a catalog icon name. */
  present(item: T): { key: string; label: string; icon?: string; hint?: string };
  command(args: { editor: Editor; range: Range; item: T }): void;
  /** Where the menu may open. Default: anywhere after a space or at a line start. */
  allow?(args: { editor: Editor; state: Editor["state"]; range: Range }): boolean;
  allowSpaces?: boolean;
}

/** What the host gives a plugin that builds suggestions from other plugins' contributions. */
interface HostView {
  /** The slash entries of every plugin, with their actions, in order. */
  blocks(): ReadonlyArray<ResolvedBlock>;
}

export interface ResolvedBlock extends BlockDef {
  action: BlockAction;
}

/** What a React component of the interface receives. */
export interface UiProps {
  editor: Editor;
  /** The element that wraps the editor and is `position: relative`. */
  host: RefObject<HTMLElement | null>;
  slots: Slots;
  ctx: EditorContext;
}

export interface UiComponent {
  id: string;
  Component: ComponentType<UiProps>;
}

/** The contributions of all the plugins, by slot. */
export interface Slots {
  blocks: ReadonlyArray<ResolvedBlock>;
  bubble: ReadonlyArray<ToolbarItem>;
  handle: ReadonlyArray<HandleAction>;
  blockToolbar: ReadonlyArray<BlockToolbar>;
  /** Node names the block handle can turn into another block. */
  turnable: ReadonlySet<string>;
}

export interface EditorPlugin {
  /** The framework-free half: ids, JSON types, slash entries, Markdown, plain text, static view. */
  core: CorePlugin;
  /** Tiptap extensions: nodes, marks, commands, shortcuts, input rules. */
  extensions?: ReadonlyArray<AnyExtension> | ((ctx: EditorContext) => ReadonlyArray<AnyExtension>);
  /** Slot `slash`: how each entry of `core.blocks` acts, by entry id. */
  blocks?: Readonly<Record<string, BlockAction>>;
  /** Node names the block handle's "turn into" can replace. */
  turnable?: ReadonlyArray<string>;
  /** Slot `bubble`: buttons above a text selection. */
  bubble?: ReadonlyArray<ToolbarItem>;
  /** Slot `handle`: actions of the block handle's menu. */
  handle?: ReadonlyArray<HandleAction>;
  /** Slot `blockToolbar`: a toolbar over a node. */
  blockToolbar?: ReadonlyArray<BlockToolbar>;
  /** Slot `suggestion`: a trigger character and its provider. */
  suggestions?: (ctx: EditorContext, host: HostView) => ReadonlyArray<SuggestionSpec>;
  /** Slot `ui`: React components the editor draws next to the writing area. */
  ui?: ReadonlyArray<UiComponent>;
}

/** Typed identity for an editor half. */
export function defineEditorPlugin<const P extends EditorPlugin>(plugin: P): P {
  return plugin;
}

/** Types a suggestion for its own candidates, and stores it with the others. */
export function defineSuggestion<T>(spec: SuggestionSpec<T>): SuggestionSpec {
  return spec as unknown as SuggestionSpec;
}
