// The data and the pure helpers under the "conversation" blocks: messages grouped by author and day,
// the position of the "new messages" divider, mentions found, inserted and read back, markdown
// markers toggled around a selection, reactions, emoji search, recipients parsed from a paste.
// Nothing here touches the DOM, so every rule is tested without a browser.

import type { ReactNode } from "react";

/* ---------------------------------------------------------------- data */

/** Whoever writes: a person, a customer, a bot. Only `id` and `name` are needed. */
export interface ConversationAuthor {
  id: string;
  name: string;
  /** Picture; the initials otherwise. */
  avatar?: string;
  /** A line under the name: a role, "Support", "Customer". */
  role?: string;
}

export interface ConversationUser {
  id: string;
  name: string;
}

export interface ConversationReaction {
  emoji: string;
  /** Who reacted, in order; the count is its length. */
  users: ReadonlyArray<ConversationUser>;
}

export interface ConversationAttachment {
  id: string;
  name: string;
  /** Bytes. */
  size?: number;
  /** MIME type: `image/png`. */
  type?: string;
  /** Where the file can be read or downloaded. */
  url?: string;
  /** A small picture, for an image. */
  thumbnail?: string;
  /** 0 to 1 while it uploads; absent once done. */
  progress?: number;
  /** A word for what went wrong; the file is marked failed. */
  error?: string;
}

export interface ConversationQuote {
  /** The message quoted, so the quote can jump to it. */
  id?: string;
  author: string;
  text: string;
}

export type ConversationMessageStatus = "sending" | "failed";

export interface ConversationMessage {
  id: string;
  /** ISO 8601. */
  at: string;
  /** Absent on a `system` message. */
  author?: ConversationAuthor;
  /** `system`: a line of the log ("Léa joined"), not a message. */
  kind?: "message" | "system";
  /**
   * The text. A string is read for `**bold**`, `*italic*`, `` `code` ``, links and mentions
   * (`@[Léa](lea)`); any other node is shown as it is.
   */
  body?: string | ReactNode;
  /** Edited after it was sent. */
  edited?: boolean;
  /** Removed: only a line saying so stays. */
  deleted?: boolean;
  status?: ConversationMessageStatus;
  /** The message this one answers, quoted above. */
  replyTo?: ConversationQuote;
  reactions?: ReadonlyArray<ConversationReaction>;
  attachments?: ReadonlyArray<ConversationAttachment>;
  /** Replies in the thread opened from this message. */
  replyCount?: number;
  /** ISO 8601 of the last reply. */
  lastReplyAt?: string;
}

/* ---------------------------------------------------------------- time */

const parts = (iso: string, timeZone: string | undefined, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { ...(timeZone ? { timeZone } : {}), ...options }).format(
    new Date(iso),
  );

/** `2026-11-19`: the calendar day of an instant, in `timeZone` (the device's by default). */
export function conversationDayKey(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    ...(timeZone ? { timeZone } : {}),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** `09:41`, 24 hours. */
export function conversationTime(iso: string, timeZone?: string): string {
  return parts(iso, timeZone, { hour: "2-digit", minute: "2-digit", hour12: false });
}

const dayNumber = (key: string) =>
  Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10));

/** `Today`, `Yesterday`, `Mon 16 Nov`, and the year when it is not this one. */
export function conversationDayLabel(iso: string, now: string, timeZone?: string): string {
  const key = conversationDayKey(iso, timeZone);
  const today = conversationDayKey(now, timeZone);
  const diff = Math.round((dayNumber(today) - dayNumber(key)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return parts(iso, timeZone, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).replace(",", "");
}

/** The time a row of a list shows: `09:41` today, `Yesterday`, `Mon`, `16 Nov`, `16 Nov 2025`. */
export function conversationListTime(iso: string, now: string, timeZone?: string): string {
  const key = conversationDayKey(iso, timeZone);
  const today = conversationDayKey(now, timeZone);
  const diff = Math.round((dayNumber(today) - dayNumber(key)) / 86_400_000);
  if (diff <= 0) return conversationTime(iso, timeZone);
  if (diff === 1) return "Yesterday";
  if (diff < 7) return parts(iso, timeZone, { weekday: "short" });
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return parts(iso, timeZone, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/* ---------------------------------------------------------------- grouping */

export type ConversationRow =
  | { type: "day"; key: string; day: string; at: string }
  | { type: "unread"; key: string; messageId: string }
  | { type: "system"; key: string; message: ConversationMessage }
  | {
      type: "message";
      key: string;
      message: ConversationMessage;
      /** First of a run by the same author: shows the name and the avatar. */
      head: boolean;
    };

export interface ConversationGrouping {
  timeZone?: string;
  /** Minutes of silence that start a new run, even by the same author. Default 5. */
  gapMinutes?: number;
  /** The first message the person has not read: a divider goes before it. */
  unreadFromId?: string | null;
}

/**
 * The flat rows of a conversation: a separator at each new day, the "new messages" divider, then the
 * messages, a message showing its author only when the run changes (another author, another day, a
 * pause longer than `gapMinutes`, a system line, the divider, a reply quote). Flat on purpose: a
 * windowed list renders any slice of it.
 */
export function buildConversationRows(
  messages: ReadonlyArray<ConversationMessage>,
  { timeZone, gapMinutes = 5, unreadFromId = null }: ConversationGrouping = {},
): ConversationRow[] {
  const rows: ConversationRow[] = [];
  let previous: ConversationMessage | null = null;
  let day = "";
  for (const message of messages) {
    const key = conversationDayKey(message.at, timeZone);
    let broken = false;
    if (key !== day) {
      day = key;
      broken = true;
      rows.push({ type: "day", key: `day-${key}`, day: key, at: message.at });
    }
    if (unreadFromId !== null && message.id === unreadFromId) {
      broken = true;
      rows.push({ type: "unread", key: "unread", messageId: message.id });
    }
    if (message.kind === "system") {
      rows.push({ type: "system", key: message.id, message });
      previous = null;
      continue;
    }
    const gap = previous ? Date.parse(message.at) - Date.parse(previous.at) : Infinity;
    const head =
      broken ||
      !previous ||
      previous.author?.id !== message.author?.id ||
      gap > gapMinutes * 60_000 ||
      message.replyTo !== undefined;
    rows.push({ type: "message", key: message.id, message, head });
    previous = message;
  }
  return rows;
}

/** The id of the first message after the last one read that someone else wrote, or null. */
export function conversationFirstUnread(
  messages: ReadonlyArray<ConversationMessage>,
  currentUserId: string,
  lastRead: { id?: string | null; at?: string | null },
): string | null {
  let from = 0;
  if (lastRead.id) {
    const at = messages.findIndex((m) => m.id === lastRead.id);
    from = at < 0 ? 0 : at + 1;
  } else if (lastRead.at) {
    const cut = Date.parse(lastRead.at);
    const at = messages.findIndex((m) => Date.parse(m.at) > cut);
    from = at < 0 ? messages.length : at;
  }
  const first = messages
    .slice(from)
    .find((m) => m.kind !== "system" && m.author?.id !== currentUserId && !m.deleted);
  return first?.id ?? null;
}

/** How many messages from others come after the id (all of them when the id is unknown). */
export function conversationUnreadCount(
  messages: ReadonlyArray<ConversationMessage>,
  currentUserId: string,
  lastReadId: string | null,
): number {
  const from = lastReadId ? messages.findIndex((m) => m.id === lastReadId) + 1 : 0;
  return messages.slice(from).filter((m) => m.kind !== "system" && m.author?.id !== currentUserId)
    .length;
}

/* ---------------------------------------------------------------- inline text */

export type ConversationInline =
  | { kind: "text"; text: string }
  | { kind: "bold" | "italic"; children: ConversationInline[] }
  | { kind: "code"; text: string }
  | { kind: "link"; href: string; text: string }
  | { kind: "mention"; char: string; label: string; id: string };

const INLINE =
  /(?<mention>([@#])\[(?<mlabel>[^\]]+)\]\((?<mid>[^)\s]+)\))|(?<code>`(?<ctext>[^`\n]+)`)|(?<bold>\*\*(?<btext>[^*\n]+?)\*\*)|(?<italic>(?<![*\w])\*(?<itext>[^*\n]+?)\*(?![*\w]))|(?<link>https?:\/\/[^\s<>]+)/g;

/** Splits message text into plain runs, bold, italic, code, links and mentions. No HTML is read. */
export function parseConversationInline(text: string): ConversationInline[] {
  const out: ConversationInline[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    const g = match.groups!;
    const index = match.index!;
    if (index > at) out.push({ kind: "text", text: text.slice(at, index) });
    let length = match[0].length;
    if (g.mention) {
      out.push({ kind: "mention", char: match[2]!, label: g.mlabel!, id: g.mid! });
    } else if (g.code) out.push({ kind: "code", text: g.ctext! });
    else if (g.bold) out.push({ kind: "bold", children: parseConversationInline(g.btext!) });
    else if (g.italic) out.push({ kind: "italic", children: parseConversationInline(g.itext!) });
    else if (g.link) {
      // Punctuation that ends a sentence is not part of the address.
      const href = g.link.replace(/[.,;:!?)\]]+$/, "");
      length = href.length;
      out.push({ kind: "link", href, text: href });
    }
    at = index + length;
  }
  if (at < text.length) out.push({ kind: "text", text: text.slice(at) });
  return out;
}

/* ---------------------------------------------------------------- mentions */

export interface MentionOption {
  /** What is stored in the text: `@[Léa Martin](lea)`. */
  id: string;
  label: string;
  /** Mono text at the end of the row: an address, a team. */
  hint?: string;
  /** A picture or initials come from `label`; set this for a person's picture. */
  avatar?: string;
  /** What goes into the text instead of the token (a slash command's text). */
  insert?: string;
  /** Extra words the search also reads. */
  keywords?: ReadonlyArray<string>;
}

export interface MentionTrigger {
  /** The character that opens the picker: `@`, `#`, `/`. */
  char: string;
  /** Only at the start of a line (a slash command). */
  atLineStart?: boolean;
}

export interface ActiveTrigger {
  char: string;
  /** What was typed after the character. */
  query: string;
  /** Index of the character. */
  start: number;
  /** Index after the query: the caret. */
  end: number;
}

/**
 * The trigger the caret is in: a trigger character at the start of the text or after a space, then
 * letters up to the caret, with no space between. Null when the caret is anywhere else (or in an
 * already inserted mention).
 */
export function findMentionTrigger(
  text: string,
  caret: number,
  triggers: ReadonlyArray<MentionTrigger>,
): ActiveTrigger | null {
  let i = caret - 1;
  while (i >= 0 && !/\s/.test(text[i]!)) {
    const trigger = triggers.find((t) => t.char === text[i]);
    if (trigger) {
      const before = i === 0 ? "" : text[i - 1]!;
      const ok = trigger.atLineStart ? i === 0 || before === "\n" : i === 0 || /\s/.test(before);
      const query = text.slice(i + 1, caret);
      if (!ok || query.startsWith("[")) return null;
      return { char: trigger.char, query, start: i, end: caret };
    }
    i--;
  }
  return null;
}

/** `@[Léa Martin](lea)`. */
export function conversationMentionToken(
  char: string,
  option: Pick<MentionOption, "id" | "label">,
) {
  return `${char}[${option.label.replace(/[\]\n]/g, " ")}](${option.id.replace(/[)\s]/g, "")})`;
}

/**
 * Replaces the trigger and what was typed after it by the mention (or the option's own text) and a
 * space; returns the new text and where the caret goes.
 */
export function insertMention(
  text: string,
  trigger: Pick<ActiveTrigger, "char" | "start" | "end">,
  option: MentionOption,
): { text: string; caret: number } {
  const raw = option.insert ?? conversationMentionToken(trigger.char, option);
  const token = /\s$/.test(raw) ? raw : `${raw} `;
  const rest = text.slice(trigger.end).replace(/^ /, "");
  return {
    text: text.slice(0, trigger.start) + token + rest,
    caret: trigger.start + token.length,
  };
}

export interface ParsedMention {
  char: string;
  label: string;
  id: string;
  start: number;
  end: number;
}

/** Every mention in a text, in order: who was named, and where. */
export function parseMentions(text: string): ParsedMention[] {
  return [...text.matchAll(/([@#])\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({
    char: m[1]!,
    label: m[2]!,
    id: m[3]!,
    start: m.index!,
    end: m.index! + m[0].length,
  }));
}

/** The text a person reads: mentions as `@Léa Martin`. For previews and quotes. */
export function conversationPlainText(text: string): string {
  return text.replace(/([@#])\[([^\]]+)\]\([^)\s]+\)/g, "$1$2");
}

/** The text for a markdown renderer: mentions in bold. */
export function conversationMentionsToMarkdown(text: string): string {
  return text.replace(/([@#])\[([^\]]+)\]\([^)\s]+\)/g, "**$1$2**");
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** The options that match, best first: label starts with it, a word does, the label holds it, a hint does. */
export function filterMentionOptions(
  options: ReadonlyArray<MentionOption>,
  query: string,
  limit = 8,
): MentionOption[] {
  const q = fold(query.trim());
  if (q === "") return options.slice(0, limit);
  const scored: Array<[number, number, MentionOption]> = [];
  options.forEach((option, index) => {
    const label = fold(option.label);
    let rank = -1;
    if (label.startsWith(q)) rank = 0;
    else if (label.split(/[\s._-]+/).some((w) => w.startsWith(q))) rank = 1;
    else if (label.includes(q)) rank = 2;
    else if (
      fold(option.hint ?? "").includes(q) ||
      (option.keywords ?? []).some((k) => fold(k).includes(q))
    )
      rank = 3;
    if (rank >= 0) scored.push([rank, index, option]);
  });
  return scored
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .slice(0, limit)
    .map((s) => s[2]);
}

/* ---------------------------------------------------------------- formatting */

export type ConversationFormat = "bold" | "italic" | "code" | "list" | "quote";

export interface TextEdit {
  text: string;
  /** Selection after the edit. */
  start: number;
  end: number;
}

const MARKERS = { bold: "**", italic: "*", code: "`" } as const;
const PREFIXES = { list: "- ", quote: "> " } as const;

/**
 * Applies a markdown marker to the selection: wraps it, or removes the marker when it is already
 * there; an empty selection gets a pair with the caret between. A list or a quote toggles its
 * prefix on every line the selection touches.
 */
export function applyConversationFormat(
  text: string,
  start: number,
  end: number,
  format: ConversationFormat,
): TextEdit {
  if (format === "list" || format === "quote") {
    const prefix = PREFIXES[format];
    const from = text.lastIndexOf("\n", start - 1) + 1;
    const to = text.indexOf("\n", end) === -1 ? text.length : text.indexOf("\n", end);
    const lines = text.slice(from, to).split("\n");
    const all = lines.every((l) => l.startsWith(prefix));
    const next = lines.map((l) =>
      all ? l.slice(prefix.length) : l.startsWith(prefix) ? l : prefix + l,
    );
    const body = next.join("\n");
    return {
      text: text.slice(0, from) + body + text.slice(to),
      start: from,
      end: from + body.length,
    };
  }
  const mark = MARKERS[format];
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  if (
    before.endsWith(mark) &&
    after.startsWith(mark) &&
    (format !== "italic" || !before.endsWith("**"))
  ) {
    return {
      text: before.slice(0, -mark.length) + selected + after.slice(mark.length),
      start: start - mark.length,
      end: end - mark.length,
    };
  }
  if (selected.startsWith(mark) && selected.endsWith(mark) && selected.length > 2 * mark.length) {
    const inner = selected.slice(mark.length, -mark.length);
    return { text: before + inner + after, start, end: start + inner.length };
  }
  return {
    text: before + mark + selected + mark + after,
    start: start + mark.length,
    end: end + mark.length,
  };
}

/* ---------------------------------------------------------------- reactions */

/** Adds the person's reaction, or removes it when it is there; an emoji nobody uses is dropped. */
export function toggleConversationReaction(
  reactions: ReadonlyArray<ConversationReaction>,
  emoji: string,
  user: ConversationUser,
): ConversationReaction[] {
  const found = reactions.find((r) => r.emoji === emoji);
  if (!found) return [...reactions, { emoji, users: [user] }];
  const has = found.users.some((u) => u.id === user.id);
  const users = has ? found.users.filter((u) => u.id !== user.id) : [...found.users, user];
  return reactions
    .map((r) => (r.emoji === emoji ? { emoji, users } : r))
    .filter((r) => r.users.length > 0);
}

/** "You, Léa and 2 others reacted with :thumbs up:" for a tooltip and a screen reader. */
export function conversationReactionLabel(
  reaction: ConversationReaction,
  currentUserId: string,
  name = reaction.emoji,
): string {
  const mine = reaction.users.some((u) => u.id === currentUserId);
  const others = reaction.users.filter((u) => u.id !== currentUserId).map((u) => u.name);
  const names = mine ? ["You", ...others] : others;
  const shown = names.slice(0, 3);
  const rest = names.length - shown.length;
  const who =
    rest > 0
      ? `${shown.join(", ")} and ${rest} other${rest === 1 ? "" : "s"}`
      : shown.length > 1
        ? `${shown.slice(0, -1).join(", ")} and ${shown.at(-1)}`
        : (shown[0] ?? "");
  return `${who} reacted with ${name}`;
}

/* ---------------------------------------------------------------- typing */

/** "Léa is typing…", "Léa and Karim are typing…", "Léa, Karim and 2 others are typing…". */
export function conversationTypingLabel(names: ReadonlyArray<string>, shown = 2): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length <= shown) {
    return `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are typing…`;
  }
  const rest = names.length - shown;
  return `${names.slice(0, shown).join(", ")} and ${rest} other${rest === 1 ? "" : "s"} are typing…`;
}

/* ---------------------------------------------------------------- emoji */

export interface EmojiEntry {
  char: string;
  name: string;
  keywords?: string;
}
export interface EmojiCategory {
  id: string;
  label: string;
  /** Shown on the category button. */
  mark: string;
  emoji: ReadonlyArray<EmojiEntry>;
}

// Emoji glyphs are allowed here and nowhere else in the library: a reaction is something a person
// writes, like the text of a message, not an icon of the interface (which stay pixel icons). A small
// set stands in for the whole list; pass `categories` to `EmojiPicker` to bring your own.
export const CONVERSATION_EMOJI: ReadonlyArray<EmojiCategory> = [
  {
    id: "faces",
    label: "Faces",
    mark: "🙂",
    emoji: [
      { char: "🙂", name: "smile", keywords: "happy slight" },
      { char: "😀", name: "grin", keywords: "happy" },
      { char: "😂", name: "joy", keywords: "laugh lol tears" },
      { char: "😉", name: "wink" },
      { char: "😍", name: "heart eyes", keywords: "love" },
      { char: "😎", name: "cool", keywords: "sunglasses" },
      { char: "🤔", name: "thinking", keywords: "hmm" },
      { char: "😅", name: "sweat smile", keywords: "relief" },
      { char: "😢", name: "cry", keywords: "sad" },
      { char: "😮", name: "surprised", keywords: "wow open mouth" },
      { char: "😴", name: "sleeping", keywords: "tired" },
      { char: "😡", name: "angry", keywords: "mad" },
      { char: "🥳", name: "party", keywords: "celebrate" },
      { char: "🙃", name: "upside down" },
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    mark: "👍",
    emoji: [
      { char: "👍", name: "thumbs up", keywords: "yes ok approve +1" },
      { char: "👎", name: "thumbs down", keywords: "no -1" },
      { char: "👏", name: "clap", keywords: "bravo" },
      { char: "🙌", name: "raised hands", keywords: "hooray" },
      { char: "🙏", name: "pray", keywords: "thanks please" },
      { char: "👋", name: "wave", keywords: "hello bye" },
      { char: "💪", name: "strong", keywords: "muscle" },
      { char: "👀", name: "eyes", keywords: "look seen" },
      { char: "🤝", name: "handshake", keywords: "deal" },
      { char: "✌️", name: "victory", keywords: "peace" },
      { char: "👌", name: "ok hand" },
      { char: "🤞", name: "fingers crossed", keywords: "luck" },
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    mark: "❤️",
    emoji: [
      { char: "❤️", name: "heart", keywords: "love red" },
      { char: "🔥", name: "fire", keywords: "hot lit" },
      { char: "✅", name: "check", keywords: "done yes" },
      { char: "❌", name: "cross", keywords: "no wrong" },
      { char: "⚠️", name: "warning", keywords: "careful" },
      { char: "❓", name: "question" },
      { char: "❗", name: "exclamation", keywords: "important" },
      { char: "💯", name: "hundred", keywords: "perfect" },
      { char: "⭐", name: "star" },
      { char: "✨", name: "sparkles", keywords: "new" },
      { char: "🎉", name: "tada", keywords: "party congrats" },
      { char: "🚀", name: "rocket", keywords: "ship launch" },
    ],
  },
  {
    id: "objects",
    label: "Objects",
    mark: "💡",
    emoji: [
      { char: "💡", name: "idea", keywords: "light bulb" },
      { char: "📌", name: "pin", keywords: "pushpin" },
      { char: "📎", name: "paperclip", keywords: "attachment" },
      { char: "📝", name: "memo", keywords: "note write" },
      { char: "📅", name: "calendar", keywords: "date" },
      { char: "🔒", name: "lock", keywords: "secure" },
      { char: "🔑", name: "key" },
      { char: "🐛", name: "bug", keywords: "defect" },
      { char: "🔧", name: "wrench", keywords: "fix tool" },
      { char: "📦", name: "package", keywords: "box release" },
      { char: "💬", name: "speech", keywords: "comment chat" },
      { char: "⏰", name: "alarm", keywords: "clock time" },
    ],
  },
  {
    id: "nature",
    label: "Nature and food",
    mark: "☕",
    emoji: [
      { char: "☕", name: "coffee", keywords: "tea break" },
      { char: "🍕", name: "pizza", keywords: "lunch" },
      { char: "🍪", name: "cookie" },
      { char: "🍺", name: "beer", keywords: "drink" },
      { char: "🌱", name: "seedling", keywords: "grow plant" },
      { char: "🌞", name: "sun", keywords: "sunny" },
      { char: "🌧️", name: "rain" },
      { char: "🐢", name: "turtle", keywords: "slow" },
      { char: "🦄", name: "unicorn" },
      { char: "🐱", name: "cat" },
    ],
  },
];

/** Entries whose name or keywords hold the query, names that start with it first. */
export function searchConversationEmoji(
  query: string,
  categories: ReadonlyArray<EmojiCategory> = CONVERSATION_EMOJI,
): EmojiEntry[] {
  const q = fold(query.trim());
  if (q === "") return [];
  const hits: Array<[number, EmojiEntry]> = [];
  for (const category of categories) {
    for (const entry of category.emoji) {
      const name = fold(entry.name);
      if (name.startsWith(q)) hits.push([0, entry]);
      else if (name.includes(q)) hits.push([1, entry]);
      else if (fold(entry.keywords ?? "").includes(q)) hits.push([2, entry]);
    }
  }
  return hits.sort((a, b) => a[0] - b[0]).map((h) => h[1]);
}

/** The recents with `emoji` first and no repeat, kept to `max`. */
export function pushRecentEmoji(recents: ReadonlyArray<string>, emoji: string, max = 16): string[] {
  return [emoji, ...recents.filter((e) => e !== emoji)].slice(0, max);
}

/** The name of a character in a category set, or the character itself. */
export function conversationEmojiName(
  emoji: string,
  categories: ReadonlyArray<EmojiCategory> = CONVERSATION_EMOJI,
): string {
  for (const category of categories) {
    const found = category.emoji.find((e) => e.char === emoji);
    if (found) return found.name;
  }
  return emoji;
}

/* ---------------------------------------------------------------- recipients */

export interface ConversationContact {
  id: string;
  name: string;
  /** A person's address. */
  email?: string;
  /** A group: choosing it adds each of these addresses. */
  members?: ReadonlyArray<string>;
  avatar?: string;
}

const EMAIL = /^[^\s@<>(),;:"[\]]+@[^\s@<>(),;:"[\]]+\.[^\s@<>(),;:"[\]]{2,}$/;

/** A plausible address: something, an at sign, a host with a dot. The server has the last word. */
export function isEmailAddress(value: string): boolean {
  return EMAIL.test(value.trim());
}

export interface ParsedRecipient {
  /** The address as written, or what could not be read as one. */
  value: string;
  name?: string;
  valid: boolean;
}

/**
 * Reads a paste into recipients: separated by commas, semicolons, new lines or spaces, with
 * `Name <address>` understood. Doubles (any case) are dropped; what is not an address is kept,
 * marked not valid, so the person sees it.
 */
export function parseRecipientText(text: string): ParsedRecipient[] {
  const out: ParsedRecipient[] = [];
  const seen = new Set<string>();
  const push = (value: string, name?: string) => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return;
    seen.add(key);
    out.push({ value, ...(name ? { name } : {}), valid: isEmailAddress(value) });
  };
  for (const chunk of text.split(/[,;\n]+/)) {
    const piece = chunk.trim();
    if (!piece) continue;
    const named = /^"?([^"<]*?)"?\s*<([^>]+)>$/.exec(piece);
    if (named) push(named[2]!.trim(), named[1]!.trim() || undefined);
    else for (const word of piece.split(/\s+/)) push(word.replace(/^<|>$/g, ""));
  }
  return out;
}

/** The addresses a contact stands for: a group's members, or its own address. */
export function conversationContactEmails(contact: ConversationContact): string[] {
  return contact.members ? [...contact.members] : contact.email ? [contact.email] : [];
}

/** `current` and `added`, without a double (any case), in order. */
export function addRecipients(
  current: ReadonlyArray<string>,
  added: ReadonlyArray<string>,
): string[] {
  const seen = new Set(current.map((c) => c.toLowerCase()));
  const next = [...current];
  for (const value of added) {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    next.push(value);
  }
  return next;
}

/* ---------------------------------------------------------------- list */

export interface ConversationSection<T> {
  id: string;
  label: string;
  items: T[];
}

/**
 * Items under their sections. `sections` fixes the order and the labels; an item without a section,
 * or with an unknown one, goes in the first. Pinned items go in a "Pinned" section above the rest
 * when `pinned` is given. Empty sections are left out.
 */
export function groupConversationItems<
  T extends { section?: string | undefined; pinned?: boolean | undefined },
>(
  items: ReadonlyArray<T>,
  sections: ReadonlyArray<{ id: string; label: string }> = [],
  pinned?: { id?: string; label: string },
): Array<ConversationSection<T>> {
  const out: Array<ConversationSection<T>> = [];
  const pin = pinned ? { id: pinned.id ?? "pinned", label: pinned.label, items: [] as T[] } : null;
  if (pin) out.push(pin);
  const base = sections.length > 0 ? sections : [{ id: "", label: "" }];
  const by = new Map(base.map((s) => [s.id, { ...s, items: [] as T[] }]));
  for (const item of items) {
    if (pin && item.pinned) pin.items.push(item);
    else (by.get(item.section ?? "") ?? by.get(base[0]!.id)!).items.push(item);
  }
  out.push(...by.values());
  return out.filter((s) => s.items.length > 0);
}

/** `3`, `99+`. */
export function conversationUnreadLabel(count: number, max = 99): string {
  return count > max ? `${max}+` : String(count);
}
