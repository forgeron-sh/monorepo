// Emoji, core half. The plugin owns no node: an emoji is a Unicode character in a plain text run,
// picked from a menu that a `:` opens (the editor half). What is here is the data a picker needs
// (`emojiPicker`: names, keywords, a ranked search), which an app also uses to let someone choose
// the icon of a callout or a page. The table lives in `emoji-data.ts`, so only an app that uses
// this plugin or the helper loads it.

import { definePlugin } from "../core/plugin";
import { EMOJI, type EmojiEntry } from "./emoji-data";

export type { EmojiEntry } from "./emoji-data";

/** The emoji a picker offers before anything is typed. */
const COMMON = [
  "thumbs_up",
  "heart",
  "tada",
  "smile",
  "joy",
  "fire",
  "eyes",
  "white_check_mark",
  "pray",
  "rocket",
  "sparkles",
  "thinking",
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/^:+|:+$/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim();

const BY_NAME = new Map(EMOJI.map((e) => [e.name, e]));

/** How well an entry answers one word: lower is better, `undefined` when it does not. */
function rank(entry: EmojiEntry, word: string): number | undefined {
  const name = entry.name.replace(/_/g, " ");
  if (name === word) return 0;
  if (name.startsWith(word)) return 1;
  if (name.split(" ").some((w) => w.startsWith(word))) return 2;
  if (entry.keywords.some((k) => k === word)) return 3;
  if (entry.keywords.some((k) => k.startsWith(word))) return 4;
  if (name.includes(word)) return 5;
  return entry.keywords.some((k) => k.includes(word)) ? 6 : undefined;
}

/**
 * The emoji data, for the `:` menu and for any picker of an app (a callout or page icon). Every
 * function is pure; the table is the one in `emoji-data.ts`.
 */
export const emojiPicker = {
  /** Every emoji, in the order of its groups. */
  all: EMOJI,
  /** The groups, in order (`faces`, `people`, `nature`...). */
  groups: [...new Set(EMOJI.map((e) => e.group))] as ReadonlyArray<string>,
  /** The entries of one group. */
  group: (name: string): EmojiEntry[] => EMOJI.filter((e) => e.group === name),
  /** An entry by its name (`thumbs_up`, `:thumbs_up:`) or by its character. */
  find: (nameOrChar: string): EmojiEntry | undefined =>
    BY_NAME.get(normalize(nameOrChar).replace(/ /g, "_")) ??
    EMOJI.find((e) => e.char === nameOrChar.trim()),
  /** What to show before anything is typed. */
  common: (): EmojiEntry[] =>
    COMMON.flatMap((name) => {
      const entry = BY_NAME.get(name);
      return entry ? [entry] : [];
    }),
  /**
   * The entries that match a query, best first: every word of the query must match the name or a
   * keyword (`face smile`, `thumbs`). An empty query gives `common()`.
   */
  search(query: string, limit = 30): EmojiEntry[] {
    const words = normalize(query).split(" ").filter(Boolean);
    if (!words.length) return emojiPicker.common().slice(0, limit);
    const scored: Array<{ entry: EmojiEntry; score: number; index: number }> = [];
    EMOJI.forEach((entry, index) => {
      let score = 0;
      for (const word of words) {
        const r = rank(entry, word);
        if (r === undefined) return;
        score += r;
      }
      scored.push({ entry, score, index });
    });
    return scored
      .sort((a, b) => a.score - b.score || a.index - b.index)
      .slice(0, limit)
      .map((s) => s.entry);
  },
};

export const emoji = definePlugin({
  id: "emoji",
  name: "Emoji",
  description:
    "Type `:` and a name to insert an emoji as plain text (`:thumbs`); the data is `emojiPicker`.",
});
