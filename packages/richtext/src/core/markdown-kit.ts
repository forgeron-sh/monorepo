// The small pieces a Markdown rule is made of, shared by the engine (`markdown.ts`) and by the
// plugins that read and write their own syntax. Pure functions on strings; no plugin knowledge.

import type { RichMark, RichNode } from "./types";

const PUNCT = /[\\`*_[\]<>~|]/g;

/** Escapes the characters that would read as Markdown, and a line start that would read as a block. */
export function escapeText(value: string, inTable = false): string {
  let out = value.replace(PUNCT, (c) => (c === "|" && !inTable ? c : `\\${c}`));
  out = out.replace(
    /^(\s*)(#{1,6}(?=\s|$)|>|[-+](?=\s)|\d+(?=[.)]\s)|={3,}|-{3,})/gm,
    (_m, ws, tok) =>
      tok.startsWith("#") || tok === ">" || /^[-+=]/.test(tok) ? `${ws}\\${tok}` : `${ws}${tok}\\`,
  );
  return out;
}

/** Escapes a URL for the `(...)` of a link or an image. */
export function escapeUrl(url: string): string {
  return url.replace(/[()\s\\]/g, (c) => (c === " " ? "%20" : `\\${c}`));
}

/** Inline code: a fence one backtick longer than any run inside, padded when it must be. */
export function codeSpan(value: string): string {
  const longest = Math.max(0, ...(value.match(/`+/g) ?? []).map((r) => r.length));
  const fence = "`".repeat(longest + 1);
  const pad = value.startsWith("`") || value.endsWith("`") || /^ .* $/.test(value) ? " " : "";
  return `${fence}${pad}${value}${pad}${fence}`;
}

/** Indents a multi-line string: `first` before the first line, `rest` before the others. */
export const indentLines = (value: string, first: string, rest: string) =>
  value
    .split("\n")
    .map((l, i) => (i === 0 ? first + l : l ? rest + l : l))
    .join("\n");

export const isPunct = (c: string | undefined) => !!c && /[!-/:-@[-`{-~]/.test(c);
export const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c);
export const isWord = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c);

/** A text node with its marks. */
export function textNode(value: string, marks: ReadonlyArray<RichMark>): RichNode {
  return marks.length
    ? { type: "text", text: value, marks: marks.map((m) => ({ ...m })) }
    : { type: "text", text: value };
}

/** Index of the `]` closing the `[` at `open`, skipping escapes and code spans; -1 when none. */
export function closingBracket(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") i++;
    else if (c === "`") {
      const run = /^`+/.exec(src.slice(i))?.[0] ?? "`";
      const end = src.indexOf(run, i + run.length);
      if (end !== -1) i = end + run.length - 1;
    } else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return i;
  }
  return -1;
}

const decodeSpaces = (u: string) => u.replace(/%20/g, " ");

/** Reads `(url "title")` at `at`; returns the url, title and the index after `)`. */
export function destination(
  src: string,
  at: number,
): { url: string; title?: string; end: number } | undefined {
  if (src[at] !== "(") return undefined;
  let i = at + 1;
  while (src[i] === " ") i++;
  let url = "";
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i] as string;
    if (c === "\\" && isPunct(src[i + 1])) {
      url += src[++i];
    } else if (c === "(") {
      depth++;
      url += c;
    } else if (c === ")") {
      if (depth === 0) break;
      depth--;
      url += c;
    } else if (c === " ") break;
    else url += c;
  }
  while (src[i] === " ") i++;
  let title: string | undefined;
  if (src[i] === '"') {
    let t = "";
    i++;
    for (; i < src.length && src[i] !== '"'; i++) {
      if (src[i] === "\\" && isPunct(src[i + 1])) i++;
      t += src[i];
    }
    title = t;
    i++;
    while (src[i] === " ") i++;
  }
  if (src[i] !== ")") return undefined;
  return { url: decodeSpaces(url), ...(title !== undefined ? { title } : {}), end: i + 1 };
}

/** Removes the backslash of an escaped punctuation character. */
export const unescapeMd = (s: string) => s.replace(/\\([!-/:-@[-`{-~])/g, "$1");

/** Splits a table row into trimmed cells (`\|` and code spans keep their pipes). */
export function splitRow(line: string): string[] {
  let l = line.trim();
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|") && !l.endsWith("\\|")) l = l.slice(0, -1);
  const cells: string[] = [];
  let cur = "";
  for (let i = 0; i < l.length; i++) {
    if (l[i] === "\\" && l[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (l[i] === "`") {
      const end = l.indexOf("`", i + 1);
      if (end === -1) cur += l[i];
      else {
        cur += l.slice(i, end + 1);
        i = end;
      }
    } else if (l[i] === "|") {
      cells.push(cur.trim());
      cur = "";
    } else cur += l[i];
  }
  cells.push(cur.trim());
  return cells;
}
