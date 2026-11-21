// The plugin contract, core half. A plugin of the editor has two halves in two entry points:
// this one, framework-free (it imports no React, Tiptap, ProseMirror, Yjs or ui, so a read-only
// place loads it without loading an editor), and an editor half (`../tiptap/plugin.ts`) with the
// Tiptap extensions, commands and React interface.
//
// The core half says what the plugin owns in the JSON document (node and mark types), what it adds
// to the slash menu, and how those types go to Markdown, plain text and the static view. The
// registry composes a list of core halves: every function of the core takes that list.

import type { RichMark, RichNode } from "./types";
import type { ViewElement, ViewNode } from "./view";

/* ================================================================== The slash catalog */

export type BlockGroup = "text" | "list" | "insert";

/** A kind of block a page can hold, with what the slash menu shows and matches. Data only. */
export interface BlockDef {
  /** Unique across the plugins: `heading-1`, `callout`. */
  id: string;
  label: string;
  /** Extra words the slash menu matches: `/h1`, `/todo`, `/hr`. */
  keywords: readonly string[];
  /** A name of `@forgeron/icons` (`heading-01`); the React layer draws it. */
  icon: string;
  group: BlockGroup;
  /** The Markdown shortcut typed at the start of a line, when there is one. */
  shortcut?: string;
}

/* ================================================================== Markdown */

/** What a node or mark rule can call while writing Markdown. */
export interface MarkdownWriter {
  /** Blocks separated by one blank line. */
  blocks(nodes: ReadonlyArray<RichNode>): string;
  block(node: RichNode): string;
  /** Inline content, opening and closing marks across neighbours. */
  inline(nodes: ReadonlyArray<RichNode>, inTable?: boolean): string;
  escape(text: string, inTable?: boolean): string;
  escapeUrl(url: string): string;
  /** `true` for a node of a plugin that declared it `list`: lists nest tightly. */
  isList(node: RichNode): boolean;
}

/** What a rule can call while reading Markdown. */
export interface MarkdownReader {
  /** Whether a plugin is part of the list being read with (a list reads `[ ]` only with `taskList`). */
  has(pluginId: string): boolean;
  /** Parses lines as blocks. */
  blocks(lines: string[]): RichNode[];
  /** Parses inline Markdown with these marks already open. */
  inline(src: string, marks?: ReadonlyArray<RichMark>): RichNode[];
}

/** Reads a block that starts at `lines[at]`; `next` is the first line it did not use. */
export interface BlockReader {
  /** Readers with the same id count once, so several plugins can share one reader. */
  id: string;
  /** Higher first. Default 0. */
  priority?: number;
  /** Does this line end a paragraph (a heading, a fence, a list...)? */
  interrupts?(line: string, next: string | undefined, reader: MarkdownReader): boolean;
  read(
    lines: string[],
    at: number,
    reader: MarkdownReader,
  ): { nodes: RichNode[]; next: number } | undefined;
}

/** Reads inline syntax that starts at `src[at]`, a character of `chars`; `end` is where it stops. */
export interface InlineReader {
  chars: string;
  /** Higher first. Default 0. */
  priority?: number;
  read(
    src: string,
    at: number,
    marks: ReadonlyArray<RichMark>,
    reader: MarkdownReader,
  ): { nodes: RichNode[]; end: number } | undefined;
}

/* ================================================================== Node and mark rules */

export interface TextWriter {
  /** The text of a node, its blocks separated by `sep`. */
  text(node: RichNode, sep?: string): string;
  sep: string;
}

export interface ViewWriter {
  children(node: RichNode): ViewNode[];
}

/** What a plugin says about one JSON node type it owns. */
export interface NodeSpec {
  /** Lives inside a text block (a mention) rather than being a block. Default `false`. */
  inline?: boolean;
  /** A list: it nests tightly in the Markdown of a list item. */
  list?: boolean;
  /** An empty node of this type gets one empty paragraph when normalised (a list item). */
  fillEmpty?: boolean;
  /** Markdown of the node: a block, or an inline leaf. Without it the node writes nothing. */
  markdown?: (node: RichNode, writer: MarkdownWriter, inTable: boolean) => string;
  /** Plain text of the node. Without it: its children, blocks one per line. */
  text?: (node: RichNode, writer: TextWriter) => string;
  /** The static view. Without it the node is shown as a placeholder. */
  render?: (node: RichNode, writer: ViewWriter) => ViewNode[];
}

/**
 * How a plugin changes what another plugin's node writes: the `reference` node is owned by the
 * references plugin, and a plugin of one kind (a page, a date) says how its own references look.
 * `next` gives what the rules before it (the owner's, then earlier decorations) would have written.
 */
export interface NodeDecoration {
  markdown?: (
    node: RichNode,
    writer: MarkdownWriter,
    inTable: boolean,
    next: () => string,
  ) => string;
  text?: (node: RichNode, writer: TextWriter, next: () => string) => string;
  render?: (node: RichNode, writer: ViewWriter, next: () => ViewNode[]) => ViewNode[];
}

export interface MarkSpec {
  /**
   * Where the mark sits among the marks of a text: lower is outermost (`link` 0, `bold` 1...).
   * Default 100; marks with the same rank keep the order of their plugins.
   */
  rank?: number;
  markdown?: {
    open?: (mark: RichMark) => string;
    close?: (mark: RichMark) => string;
    /** Writes the text itself instead of delimiters (inline code). Other marks stay outside it. */
    literal?: (text: string) => string;
    /** Emphasis characters that read as this mark: `["*", 2]` is `**`. */
    read?: ReadonlyArray<readonly [char: string, size: number]>;
  };
  render?: (mark: RichMark, children: ViewNode[]) => ViewElement;
}

/**
 * What a plugin does to a whole document, as opposed to one node: numbering, a section appended at
 * the end (footnotes), a pass over the finished static tree (syntax colouring). Each hook runs
 * only when the root being written, read or rendered is a `doc`.
 */
export interface DocumentHooks {
  /**
   * Called first on the root before Markdown, plain text or the static view is made, so the node
   * rules can look up what they need (the number of a footnote). Keep the result in a `WeakMap`
   * keyed by the node objects: the walk hands the same objects to the rules.
   */
  prepare?(root: RichNode): void;
  /** Markdown of the whole document, after its blocks are written. */
  markdown?(root: RichNode, markdown: string, writer: MarkdownWriter): string;
  /** Plain text of the whole document, after its blocks are written. */
  text?(root: RichNode, text: string, writer: TextWriter): string;
  /** The static tree of the whole document, after its blocks are rendered. */
  render?(root: RichNode, tree: ViewNode[], writer: ViewWriter): ViewNode[];
  /** The document read from Markdown, before it is normalised: resolves what refers forward. */
  fromMarkdown?(root: RichNode): RichNode;
}

/* ================================================================== The plugin */

export interface CorePlugin {
  /** Unique, stable, short: `bold`, `callout`. */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Ids of plugins that must be in the list too (and come first). */
  readonly requires?: readonly string[];
  /** The JSON node types it owns. */
  readonly nodes?: Readonly<Record<string, NodeSpec>>;
  /** The JSON mark types it owns. */
  readonly marks?: Readonly<Record<string, MarkSpec>>;
  /**
   * Rules layered over a node type another plugin owns (list that plugin in `requires`), applied in
   * plugin order on top of the owner's. Each rule decides whether the node is its business.
   */
  readonly decorate?: Readonly<Record<string, NodeDecoration>>;
  /** Old node types it still reads, turned into the current ones when a document is normalised. */
  readonly migrate?: Readonly<Record<string, (node: RichNode) => RichNode>>;
  /** Entries it adds to the slash menu (and to the block handle's "turn into"). */
  readonly blocks?: ReadonlyArray<BlockDef>;
  readonly markdown?: {
    blocks?: ReadonlyArray<BlockReader>;
    inline?: ReadonlyArray<InlineReader>;
  };
  /** Passes over the whole document (numbering, an appended section, a tree transform). */
  readonly document?: DocumentHooks;
}

/** Typed identity: `definePlugin({ id: ... })` checks the shape and returns it. */
export function definePlugin<const P extends CorePlugin>(plugin: P): P {
  return plugin;
}

/** A broken plugin list: a duplicate id, a missing dependency, a cycle, two owners of a type. */
export class PluginError extends Error {
  override name = "PluginError";
}

/** A list of core halves, or the registry already built from it. */
export type Plugins = ReadonlyArray<CorePlugin> | Registry;

/* ================================================================== The registry */

export interface Registry {
  /** The plugins in dependency order. */
  readonly plugins: ReadonlyArray<CorePlugin>;
  has(pluginId: string): boolean;
  /** The rules of a node type, when a plugin owns it. */
  node(type: string): NodeSpec | undefined;
  mark(type: string): MarkSpec | undefined;
  /** A node or mark type a plugin owns (or `text`, `doc`). */
  knows(type: string): boolean;
  hasMark(type: string): boolean;
  /** The position of a mark among the marks of a text. */
  markRank(type: string): number;
  /** The slash catalog, in plugin order. */
  readonly blocks: ReadonlyArray<BlockDef>;
  /** Turns a legacy node into its current form (`mention` into a `reference`). */
  migrate(node: RichNode): RichNode;
  readonly blockReaders: ReadonlyArray<BlockReader>;
  inlineReaders(char: string): ReadonlyArray<InlineReader>;
  /** The mark an emphasis run reads as. */
  emphasis(char: string, size: number): string | undefined;
  /** Largest emphasis size declared for a character, `0` when it is not a delimiter. */
  emphasisMax(char: string): number;
  /** The document hooks of the plugins, in plugin order. */
  readonly documentHooks: ReadonlyArray<DocumentHooks>;
}

/** Orders a plugin list by dependency and checks it. Throws `PluginError`. */
export function resolvePlugins(list: ReadonlyArray<CorePlugin>): CorePlugin[] {
  const byId = new Map<string, CorePlugin>();
  for (const plugin of list) {
    if (byId.has(plugin.id)) throw new PluginError(`Duplicate plugin id "${plugin.id}"`);
    byId.set(plugin.id, plugin);
  }
  const out: CorePlugin[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (plugin: CorePlugin, trail: string[]) => {
    const seen = state.get(plugin.id);
    if (seen === "done") return;
    if (seen === "visiting") {
      throw new PluginError(`Plugin dependency cycle: ${[...trail, plugin.id].join(" -> ")}`);
    }
    state.set(plugin.id, "visiting");
    for (const need of plugin.requires ?? []) {
      const dep = byId.get(need);
      if (!dep) throw new PluginError(`Plugin "${plugin.id}" requires "${need}", which is missing`);
      visit(dep, [...trail, plugin.id]);
    }
    state.set(plugin.id, "done");
    out.push(plugin);
  };
  for (const plugin of list) visit(plugin, []);
  return out;
}

const RESERVED = new Set(["doc", "text"]);

function decorateSpec(spec: NodeSpec, rules: NodeDecoration): NodeSpec {
  const next: NodeSpec = { ...spec };
  const { markdown, text, render } = rules;
  if (markdown) {
    next.markdown = (node, w, inTable) =>
      markdown(node, w, inTable, () => spec.markdown?.(node, w, inTable) ?? "");
  }
  if (text) {
    next.text = (node, w) =>
      text(node, w, () =>
        spec.text ? spec.text(node, w) : (node.content ?? []).map((c) => w.text(c)).join(""),
      );
  }
  if (render) {
    next.render = (node, w) =>
      render(node, w, () => (spec.render ? spec.render(node, w) : w.children(node)));
  }
  return next;
}

/** Composes a plugin list into the lookups every function of the core uses. Throws `PluginError`. */
export function createRegistry(list: ReadonlyArray<CorePlugin>): Registry {
  const plugins = resolvePlugins(list);
  const ids = new Set(plugins.map((p) => p.id));
  const nodes = new Map<string, { spec: NodeSpec; owner: string }>();
  const marks = new Map<string, { spec: MarkSpec; owner: string; index: number }>();
  const blocks: BlockDef[] = [];
  const blockIds = new Map<string, string>();
  const migrations = new Map<string, (node: RichNode) => RichNode>();
  const blockReaders: BlockReader[] = [];
  const readerIds = new Set<string>();
  const inline = new Map<string, InlineReader[]>();
  const emphasis = new Map<string, string>();
  const emphasisMax = new Map<string, number>();
  const documentHooks: DocumentHooks[] = [];

  for (const plugin of plugins) {
    if (plugin.document) documentHooks.push(plugin.document);
    for (const [type, spec] of Object.entries(plugin.nodes ?? {})) {
      const taken = nodes.get(type);
      if (RESERVED.has(type) || taken) {
        throw new PluginError(
          `Node type "${type}" of plugin "${plugin.id}" is already owned by "${taken?.owner ?? "the editor"}"`,
        );
      }
      nodes.set(type, { spec, owner: plugin.id });
    }
    for (const [type, rules] of Object.entries(plugin.decorate ?? {})) {
      const owner = nodes.get(type);
      if (!owner) {
        throw new PluginError(
          `Plugin "${plugin.id}" decorates node type "${type}", which no plugin before it owns`,
        );
      }
      owner.spec = decorateSpec(owner.spec, rules);
    }
    for (const [type, spec] of Object.entries(plugin.marks ?? {})) {
      const taken = marks.get(type);
      if (taken) {
        throw new PluginError(
          `Mark type "${type}" of plugin "${plugin.id}" is already owned by "${taken.owner}"`,
        );
      }
      marks.set(type, { spec, owner: plugin.id, index: marks.size });
      for (const [char, size] of spec.markdown?.read ?? []) {
        emphasis.set(`${char}${size}`, type);
        emphasisMax.set(char, Math.max(emphasisMax.get(char) ?? 0, size));
      }
    }
    for (const block of plugin.blocks ?? []) {
      const taken = blockIds.get(block.id);
      if (taken) {
        throw new PluginError(
          `Block "${block.id}" of plugin "${plugin.id}" is already offered by "${taken}"`,
        );
      }
      blockIds.set(block.id, plugin.id);
      blocks.push(block);
    }
    for (const [type, fn] of Object.entries(plugin.migrate ?? {})) migrations.set(type, fn);
    for (const reader of plugin.markdown?.blocks ?? []) {
      if (readerIds.has(reader.id)) continue;
      readerIds.add(reader.id);
      blockReaders.push(reader);
    }
    for (const reader of plugin.markdown?.inline ?? []) {
      for (const char of reader.chars) inline.set(char, [...(inline.get(char) ?? []), reader]);
    }
  }
  blockReaders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const readers of inline.values()) {
    readers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }
  const legacy = new Set(migrations.keys());

  const migrate = (node: RichNode): RichNode => {
    const fn = migrations.get(node.type);
    return fn ? fn(node) : node;
  };
  return {
    plugins,
    has: (id) => ids.has(id),
    node: (type) => nodes.get(type)?.spec,
    mark: (type) => marks.get(type)?.spec,
    knows: (type) => RESERVED.has(type) || nodes.has(type) || legacy.has(type),
    hasMark: (type) => marks.has(type),
    markRank: (type) => {
      const mark = marks.get(type);
      return mark ? (mark.spec.rank ?? 100) * 1000 + mark.index : Number.MAX_SAFE_INTEGER;
    },
    blocks,
    migrate,
    blockReaders,
    inlineReaders: (char) => inline.get(char) ?? [],
    emphasis: (char, size) => emphasis.get(`${char}${size}`),
    emphasisMax: (char) => emphasisMax.get(char) ?? 0,
    documentHooks,
  };
}
