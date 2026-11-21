// The block catalog, composed from the plugins: every kind of block a page can hold, with what the
// slash menu shows and matches. Data only; the editor and the menu both read it, so one list names
// the blocks. Each plugin brings its own entries (`CorePlugin.blocks`).

import { corePresets } from "../plugins/index";
import { registryOf } from "./defaults";
import type { BlockDef, Plugins } from "./plugin";
import type { ReferenceItem } from "./references";

export type { BlockDef, BlockGroup } from "./plugin";

/** The id of a catalog entry: `heading-1`, `callout`. */
export type BlockId = string;

/** A preset: a named list of plugins. `full` is a page, `minimal` marks, lists and mentions. */
export type RichTextVariant = "full" | "minimal";

/** The slash catalog of the `full` preset. */
export const BLOCKS: ReadonlyArray<BlockDef> = registryOf().blocks;

/** A catalog entry of the full preset. */
export function getBlock(id: BlockId): BlockDef {
  const block = BLOCKS.find((b) => b.id === id);
  if (!block) throw new Error(`Unknown block: ${id}`);
  return block;
}

/** The entries a preset or a plugin list offers, in plugin order. Default: the `full` preset. */
export function blocksFor(source: RichTextVariant | Plugins = "full"): BlockDef[] {
  const plugins = typeof source === "string" ? corePresets[source] : source;
  return [...registryOf(plugins).blocks];
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
export type MentionItem = ReferenceItem;

/** Keeps the items that match the typed text (label, then hint), at most `limit`. */
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
