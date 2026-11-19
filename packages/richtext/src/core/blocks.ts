// The block catalog: every kind of block a page can hold, with what the slash menu shows and
// matches. Data only; the editor and the menu both read it, so one list names the blocks.

export type BlockId =
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "bullet-list"
  | "ordered-list"
  | "task-list"
  | "quote"
  | "code-block"
  | "divider"
  | "table"
  | "image";

/** `full`: a page (every block). `minimal`: marks, lists and mentions, for comments and descriptions. */
export type RichTextVariant = "full" | "minimal";

export type BlockGroup = "text" | "list" | "insert";

export interface BlockDef {
  id: BlockId;
  label: string;
  /** Extra words the slash menu matches: `/h1`, `/todo`, `/hr`. */
  keywords: readonly string[];
  /** A name of `@forgeron/icons` (`heading-01`); the React layer draws it. */
  icon: string;
  group: BlockGroup;
  /** The Markdown shortcut typed at the start of a line, when there is one. */
  shortcut?: string;
  /** The variants that offer this block. */
  variants: readonly RichTextVariant[];
}

const BOTH = ["full", "minimal"] as const;
const FULL = ["full"] as const;

export const BLOCKS: ReadonlyArray<BlockDef> = [
  {
    id: "paragraph",
    label: "Text",
    keywords: ["paragraph", "plain", "p", "text"],
    icon: "type",
    group: "text",
    variants: BOTH,
  },
  {
    id: "heading-1",
    label: "Heading 1",
    keywords: ["h1", "title", "heading", "big"],
    icon: "heading-01",
    group: "text",
    shortcut: "#",
    variants: FULL,
  },
  {
    id: "heading-2",
    label: "Heading 2",
    keywords: ["h2", "subtitle", "heading", "medium"],
    icon: "heading-02",
    group: "text",
    shortcut: "##",
    variants: FULL,
  },
  {
    id: "heading-3",
    label: "Heading 3",
    keywords: ["h3", "heading", "small"],
    icon: "heading-03",
    group: "text",
    shortcut: "###",
    variants: FULL,
  },
  {
    id: "bullet-list",
    label: "Bulleted list",
    keywords: ["ul", "unordered", "bullets", "list"],
    icon: "left-to-right-list-bullet",
    group: "list",
    shortcut: "-",
    variants: BOTH,
  },
  {
    id: "ordered-list",
    label: "Numbered list",
    keywords: ["ol", "ordered", "numbers", "list"],
    icon: "list-ordered",
    group: "list",
    shortcut: "1.",
    variants: BOTH,
  },
  {
    id: "task-list",
    label: "To-do list",
    keywords: ["todo", "task", "checkbox", "checklist", "check"],
    icon: "check-list",
    group: "list",
    shortcut: "[ ]",
    variants: BOTH,
  },
  {
    id: "quote",
    label: "Quote",
    keywords: ["blockquote", "citation"],
    icon: "quote",
    group: "text",
    shortcut: ">",
    variants: FULL,
  },
  {
    id: "code-block",
    label: "Code",
    keywords: ["pre", "snippet", "source", "fence"],
    icon: "code-xml",
    group: "text",
    shortcut: "```",
    variants: FULL,
  },
  {
    id: "divider",
    label: "Divider",
    keywords: ["hr", "rule", "line", "separator"],
    icon: "minus",
    group: "insert",
    shortcut: "---",
    variants: FULL,
  },
  {
    id: "table",
    label: "Table",
    keywords: ["grid", "rows", "columns", "cells"],
    icon: "table-01",
    group: "insert",
    variants: FULL,
  },
  {
    id: "image",
    label: "Image",
    keywords: ["picture", "photo", "img", "media"],
    icon: "image-03",
    group: "insert",
    variants: FULL,
  },
];

export function getBlock(id: BlockId): BlockDef {
  const block = BLOCKS.find((b) => b.id === id);
  if (!block) throw new Error(`Unknown block: ${id}`);
  return block;
}

/** The blocks a variant offers, in catalog order. */
export function blocksFor(variant: RichTextVariant): BlockDef[] {
  return BLOCKS.filter((b) => b.variants.includes(variant));
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/**
 * The slash menu's filter: what the text after `/` keeps and in which order. A label that starts
 * with the query first, then a label that contains it, then a keyword that starts with it, then one
 * that contains it. An empty query keeps everything in catalog order. Accents and case are ignored.
 */
export function filterBlocks<T extends Pick<BlockDef, "label" | "keywords">>(
  blocks: ReadonlyArray<T>,
  query: string,
): T[] {
  const q = fold(query);
  if (!q) return [...blocks];
  const scored: Array<{ block: T; score: number; index: number }> = [];
  blocks.forEach((block, index) => {
    const label = fold(block.label);
    const words = block.keywords.map(fold);
    let score = 0;
    if (label.startsWith(q)) score = 4;
    else if (label.includes(q)) score = 3;
    else if (words.some((w) => w.startsWith(q))) score = 2;
    else if (words.some((w) => w.includes(q))) score = 1;
    if (score) scored.push({ block, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((s) => s.block);
}

/** One person, channel or record a mention can point at. The caller provides the list. */
export interface MentionItem {
  id: string;
  label: string;
  /** A second line: an email, a role. */
  hint?: string;
}

/** Keeps the mention items that match the typed text (label, then hint), at most `limit`. */
export function filterMentions(
  items: ReadonlyArray<MentionItem>,
  query: string,
  limit = 8,
): MentionItem[] {
  const q = fold(query);
  const keep = q
    ? items.filter((i) => fold(i.label).includes(q) || fold(i.hint ?? "").includes(q))
    : [...items];
  return keep
    .sort((a, b) => Number(fold(b.label).startsWith(q)) - Number(fold(a.label).startsWith(q)))
    .slice(0, limit);
}
