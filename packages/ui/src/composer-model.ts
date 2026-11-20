// The text side of the message composer: mentions found, inserted and read back, markdown markers
// toggled around a selection. Nothing here touches the DOM. The conversation blocks re-export it.

export interface ConversationQuote {
  /** The message quoted, so the quote can jump to it. */
  id?: string;
  author: string;
  text: string;
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
