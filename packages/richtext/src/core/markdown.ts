// Markdown in and out, as pure functions. A subset that a page needs: headings 1 to 3, paragraphs,
// bullet, numbered and to-do lists (nested), quotes, fenced code, rules, GFM tables, images, links,
// bold, italic, strike, inline code, and two extensions that Markdown has no word for: `<u>` for
// underline and `[@Label](mention:id)` for a mention. What `toMarkdown` writes, `fromMarkdown`
// reads back to the same document (after `normalizeDoc`).

import {
  MARK_TYPES,
  normalizeDoc,
  type MarkType,
  type RichDoc,
  type RichMark,
  type RichNode,
} from "./model";

/* ================================================================== Export */

const PUNCT = /[\\`*_[\]<>~|]/g;

function escapeText(value: string, inTable = false): string {
  let out = value.replace(PUNCT, (c) => (c === "|" && !inTable ? c : `\\${c}`));
  // A line that would read as a block when it starts the paragraph.
  out = out.replace(
    /^(\s*)(#{1,6}(?=\s|$)|>|[-+](?=\s)|\d+(?=[.)]\s)|={3,}|-{3,})/gm,
    (_m, ws, tok) =>
      tok.startsWith("#") || tok === ">" || /^[-+=]/.test(tok) ? `${ws}\\${tok}` : `${ws}${tok}\\`,
  );
  return out;
}

function escapeUrl(url: string): string {
  return url.replace(/[()\s\\]/g, (c) => (c === " " ? "%20" : `\\${c}`));
}

const orderMarks = (marks: RichMark[]) =>
  [...marks].sort((a, b) => MARK_TYPES.indexOf(a.type) - MARK_TYPES.indexOf(b.type));

const sameMark = (a: RichMark, b: RichMark) => JSON.stringify(a) === JSON.stringify(b);

function opener(m: RichMark): string {
  switch (m.type) {
    case "bold":
      return "**";
    case "italic":
      return "*";
    case "strike":
      return "~~";
    case "underline":
      return "<u>";
    case "link":
      return "[";
    case "code":
      return "";
  }
}

function closer(m: RichMark): string {
  switch (m.type) {
    case "bold":
      return "**";
    case "italic":
      return "*";
    case "strike":
      return "~~";
    case "underline":
      return "</u>";
    case "link":
      return `](${escapeUrl(String(m.attrs?.["href"] ?? ""))})`;
    case "code":
      return "";
  }
}

function codeSpan(value: string): string {
  const longest = Math.max(0, ...(value.match(/`+/g) ?? []).map((r) => r.length));
  const fence = "`".repeat(longest + 1);
  const pad = value.startsWith("`") || value.endsWith("`") || /^ .* $/.test(value) ? " " : "";
  return `${fence}${pad}${value}${pad}${fence}`;
}

/** Inline content to Markdown, opening and closing marks across neighbours like `**a *b* c**`. */
function inline(nodes: RichNode[], inTable = false): string {
  let out = "";
  let stack: RichMark[] = [];

  const closeTo = (keep: number) => {
    if (stack.length <= keep) return;
    // Whitespace before a closing delimiter would break it: move it outside.
    const tail = /\s+$/.exec(out)?.[0] ?? "";
    if (tail) out = out.slice(0, out.length - tail.length);
    while (stack.length > keep) out += closer(stack.pop() as RichMark);
    out += tail;
  };

  for (const node of nodes) {
    if (node.type === "text") {
      const marks = orderMarks((node.marks ?? []).filter((m) => m.type !== "code"));
      const isCode = (node.marks ?? []).some((m) => m.type === "code");
      let common = 0;
      while (
        common < stack.length &&
        common < marks.length &&
        sameMark(stack[common] as RichMark, marks[common] as RichMark)
      )
        common++;
      closeTo(common);
      const value = node.text ?? "";
      const lead = isCode ? "" : (/^\s+/.exec(value)?.[0] ?? "");
      const body = isCode ? value : value.slice(lead.length);
      const toOpen = marks.slice(common);
      // Leading whitespace goes before the new delimiters.
      if (toOpen.length && body) {
        out += lead;
        for (const m of toOpen) {
          out += opener(m);
          stack.push(m);
        }
      } else {
        out += lead;
      }
      out += isCode ? codeSpan(body) : inTable ? escapeText(body, true) : escapeText(body);
    } else {
      closeTo(0);
      out += leaf(node, inTable);
    }
  }
  closeTo(0);
  return out;
}

function leaf(node: RichNode, inTable: boolean): string {
  switch (node.type) {
    case "hardBreak":
      return inTable ? "<br>" : "\\\n";
    case "mention": {
      const id = String(node.attrs?.["id"] ?? "");
      const label = String(node.attrs?.["label"] ?? id);
      return `[@${escapeText(label)}](mention:${escapeUrl(id)})`;
    }
    default:
      return "";
  }
}

function imageMd(node: RichNode): string {
  const alt = String(node.attrs?.["alt"] ?? "").replace(/[[\]\\]/g, (c) => `\\${c}`);
  const src = escapeUrl(String(node.attrs?.["src"] ?? ""));
  const title = node.attrs?.["title"]
    ? ` "${String(node.attrs["title"]).replace(/["\\]/g, (c) => `\\${c}`)}"`
    : "";
  return `![${alt}](${src}${title})`;
}

const indentLines = (value: string, first: string, rest: string) =>
  value
    .split("\n")
    .map((l, i) => (i === 0 ? first + l : l ? rest + l : l))
    .join("\n");

function blocks(nodes: RichNode[]): string {
  return nodes.map(block).join("\n\n");
}

function listMd(node: RichNode): string {
  const ordered = node.type === "orderedList";
  const task = node.type === "taskList";
  let n = Number(node.attrs?.["start"]) || 1;
  const items = (node.content ?? []).map((item) => {
    const marker = ordered ? `${n++}. ` : "- ";
    const check = task ? (item.attrs?.["checked"] === true ? "[x] " : "[ ] ") : "";
    const inner = (item.content ?? []).map(block);
    // A paragraph then a nested list stays tight; other blocks are separated by a blank line.
    let body = "";
    inner.forEach((part, i) => {
      const prev = item.content?.[i - 1];
      const cur = item.content?.[i];
      const tight = i > 0 && cur && prev && isList(cur) && prev.type === "paragraph";
      body += i === 0 ? part : tight ? `\n${part}` : `\n\n${part}`;
    });
    return indentLines(`${check}${body}`, marker, " ".repeat(marker.length));
  });
  const loose = (node.content ?? []).some(
    (item) => (item.content ?? []).filter((c) => !isList(c)).length > 1,
  );
  return items.join(loose ? "\n\n" : "\n");
}

const isList = (n: RichNode) =>
  n.type === "bulletList" || n.type === "orderedList" || n.type === "taskList";

function tableMd(node: RichNode): string {
  const rows = (node.content ?? []).map((row) =>
    (row.content ?? []).map((cell) =>
      (cell.content ?? [])
        .map((b) => inline(b.content ?? [], true))
        .join("<br>")
        .replace(/\n/g, " "),
    ),
  );
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length), 1);
  const pad = (r: string[]) => Array.from({ length: width }, (_, i) => r[i] ?? "");
  const line = (r: string[]) => `| ${pad(r).join(" | ")} |`;
  const [head, ...rest] = rows as [string[], ...string[][]];
  return [
    line(head),
    `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
    ...rest.map(line),
  ].join("\n");
}

function block(node: RichNode): string {
  switch (node.type) {
    case "paragraph":
      return inline(node.content ?? []);
    case "heading": {
      const level = Math.min(3, Math.max(1, Number(node.attrs?.["level"]) || 1));
      return `${"#".repeat(level)} ${inline(node.content ?? []).replace(/\n/g, " ")}`;
    }
    case "bulletList":
    case "orderedList":
    case "taskList":
      return listMd(node);
    case "blockquote":
      return blocks(node.content ?? [])
        .split("\n")
        .map((l) => (l ? `> ${l}` : ">"))
        .join("\n");
    case "codeBlock": {
      const code = (node.content ?? []).map((c) => c.text ?? "").join("");
      const longest = Math.max(2, ...(code.match(/^`{3,}/gm) ?? []).map((r) => r.length));
      const fence = "`".repeat(longest + 1);
      const lang = node.attrs?.["language"] ? String(node.attrs["language"]) : "";
      return `${fence}${lang}\n${code}\n${fence}`;
    }
    case "horizontalRule":
      return "---";
    case "table":
      return tableMd(node);
    case "image":
      return imageMd(node);
    default:
      return "";
  }
}

/** A document as Markdown. Block separated by one blank line, no trailing newline. */
export function toMarkdown(doc: RichNode): string {
  return blocks(doc.content ?? []);
}

/* ================================================================== Import */

const isPunct = (c: string | undefined) => !!c && /[!-/:-@[-`{-~]/.test(c);
const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c);
const isWord = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c);

interface Ctx {
  marks: RichMark[];
}

function textNode(value: string, marks: RichMark[]): RichNode {
  return marks.length
    ? { type: "text", text: value, marks: marks.map((m) => ({ ...m })) }
    : { type: "text", text: value };
}

/** Index of the `]` closing the `[` at `open`, skipping escapes and code spans; -1 when none. */
function closingBracket(src: string, open: number): number {
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

/** Reads `(url "title")` at `at`; returns the url, title and the index after `)`. */
function destination(
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

const decodeSpaces = (u: string) => u.replace(/%20/g, " ");

/** Finds the closer of an emphasis delimiter opened at `from` (after its delimiter). */
function findCloser(src: string, from: number, ch: string, size: number): number {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (c === "`") {
      const run = /^`+/.exec(src.slice(i))?.[0] ?? "`";
      const end = src.indexOf(run, i + run.length);
      if (end !== -1) i = end + run.length - 1;
      continue;
    }
    if (c === "[") {
      const end = closingBracket(src, i);
      if (end !== -1) {
        const dest = destination(src, end + 1);
        i = dest ? dest.end - 1 : end;
      }
      continue;
    }
    if (c !== ch) continue;
    let run = 0;
    while (src[i + run] === ch) run++;
    const prev = src[i - 1];
    const next = src[i + run];
    const canClose = !isSpace(prev) && (ch !== "_" || !isWord(next));
    const canOpen = !isSpace(next) && (ch !== "_" || !isWord(prev));
    if (canClose) {
      if (depth >= run) depth -= run;
      else if (run - depth >= size) return i + run - size;
      else depth = 0;
    } else if (canOpen) depth += run;
    i += run - 1;
  }
  return -1;
}

function parseInline(src: string, ctx: Ctx): RichNode[] {
  const out: RichNode[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push(textNode(buf, ctx.marks));
    buf = "";
  };
  const withMark = (mark: RichMark, inner: string) => {
    flush();
    out.push(...parseInline(inner, { marks: [...ctx.marks, mark] }));
  };

  for (let i = 0; i < src.length;) {
    const c = src[i] as string;
    if (c === "\\") {
      const n = src[i + 1];
      if (n === "\n") {
        flush();
        out.push({ type: "hardBreak" });
        i += 2;
      } else if (isPunct(n)) {
        buf += n;
        i += 2;
      } else {
        buf += c;
        i++;
      }
      continue;
    }
    if (c === "\n") {
      // Two spaces before a newline is a hard break; otherwise a soft one, a space.
      if (/ {2,}$/.test(buf)) {
        buf = buf.replace(/ +$/, "");
        flush();
        out.push({ type: "hardBreak" });
      } else buf += " ";
      i++;
      continue;
    }
    if (c === "`") {
      const run = /^`+/.exec(src.slice(i))?.[0] ?? "`";
      const end = src.indexOf(run, i + run.length);
      if (end !== -1 && src[end + run.length] !== "`") {
        let code = src.slice(i + run.length, end).replace(/\n/g, " ");
        if (/^ .* $/.test(code) && code.trim()) code = code.slice(1, -1);
        flush();
        out.push(textNode(code, [...ctx.marks, { type: "code" }]));
        i = end + run.length;
        continue;
      }
      buf += run;
      i += run.length;
      continue;
    }
    if (c === "<") {
      if (src.startsWith("<br>", i) || src.startsWith("<br/>", i) || src.startsWith("<br />", i)) {
        flush();
        out.push({ type: "hardBreak" });
        i += src.indexOf(">", i) + 1 - i;
        continue;
      }
      if (src.startsWith("<u>", i)) {
        const end = src.indexOf("</u>", i + 3);
        if (end !== -1) {
          withMark({ type: "underline" }, src.slice(i + 3, end));
          i = end + 4;
          continue;
        }
      }
    }
    if (c === "[") {
      const close = closingBracket(src, i);
      const dest = close === -1 ? undefined : destination(src, close + 1);
      if (close !== -1 && dest) {
        const label = src.slice(i + 1, close);
        if (dest.url.startsWith("mention:") && label.startsWith("@")) {
          flush();
          out.push({
            type: "mention",
            attrs: { id: dest.url.slice(8), label: unescapeMd(label.slice(1)) },
          });
        } else {
          withMark({ type: "link", attrs: { href: dest.url } }, label);
        }
        i = dest.end;
        continue;
      }
    }
    if (c === "*" || c === "_" || c === "~") {
      let run = 0;
      while (src[i + run] === c) run++;
      const prev = src[i - 1];
      const next = src[i + run];
      const canOpen = !isSpace(next) && (c !== "_" || !isWord(prev));
      const size = c === "~" ? (run >= 2 ? 2 : 0) : run >= 2 ? 2 : 1;
      if (canOpen && size) {
        const end = findCloser(src, i + size, c, size);
        if (end !== -1 && end > i + size) {
          // `***a***`: the outer is bold, the inner italic (bold is written first).
          const type: MarkType = c === "~" ? "strike" : size === 2 ? "bold" : "italic";
          withMark({ type }, src.slice(i + size, end));
          i = end + size;
          continue;
        }
      }
      buf += src.slice(i, i + run);
      i += run;
      continue;
    }
    buf += c;
    i++;
  }
  flush();
  return out;
}

const unescapeMd = (s: string) => s.replace(/\\([!-/:-@[-`{-~])/g, "$1");

const inlineOf = (src: string): RichNode[] => parseInline(src.trim(), { marks: [] });

const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)\s*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const BULLET = /^( {0,3})([-*+])[ \t]+(.*)$/;
const ORDERED = /^( {0,3})(\d{1,9})([.)])[ \t]+(.*)$/;
const IMAGE_LINE = /^!\[((?:\\.|[^\]])*)\]\((.*)\)\s*$/;
const TABLE_SEP = /^ {0,3}\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

function startsBlock(line: string, next: string | undefined): boolean {
  return (
    HEADING.test(line) ||
    FENCE.test(line) ||
    RULE.test(line) ||
    /^ {0,3}>/.test(line) ||
    BULLET.test(line) ||
    /^ {0,3}1[.)][ \t]+/.test(line) ||
    (line.includes("|") && next !== undefined && TABLE_SEP.test(next) && next.includes("-"))
  );
}

function splitRow(line: string): string[] {
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

function parseBlocks(lines: string[]): RichNode[] {
  const out: RichNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] as string;
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = FENCE.exec(line);
    if (fence) {
      const mark = (fence[1] as string)[0] as string;
      const size = (fence[1] as string).length;
      const body: string[] = [];
      i++;
      while (
        i < lines.length &&
        !new RegExp(`^ {0,3}${mark}{${size},}\\s*$`).test(lines[i] as string)
      ) {
        body.push(lines[i] as string);
        i++;
      }
      i++;
      const node: RichNode = { type: "codeBlock" };
      if (fence[2]) node.attrs = { language: fence[2] };
      if (body.length) node.content = [{ type: "text", text: body.join("\n") }];
      out.push(node);
      continue;
    }
    const head = HEADING.exec(line);
    if (head) {
      const level = Math.min(3, (head[1] as string).length);
      const content = inlineOf(head[2] as string);
      out.push({ type: "heading", attrs: { level }, ...(content.length ? { content } : {}) });
      i++;
      continue;
    }
    if (RULE.test(line)) {
      out.push({ type: "horizontalRule" });
      i++;
      continue;
    }
    if (/^ {0,3}>/.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && /^ {0,3}>/.test(lines[i] as string)) {
        inner.push((lines[i] as string).replace(/^ {0,3}> ?/, ""));
        i++;
      }
      const content = parseBlocks(inner);
      out.push({ type: "blockquote", content: content.length ? content : [{ type: "paragraph" }] });
      continue;
    }
    if (BULLET.test(line) || ORDERED.test(line)) {
      const [lists, next] = parseList(lines, i);
      out.push(...lists);
      i = next;
      continue;
    }
    const nextLine = lines[i + 1];
    if (
      line.includes("|") &&
      nextLine !== undefined &&
      TABLE_SEP.test(nextLine) &&
      nextLine.includes("-")
    ) {
      const head = splitRow(line);
      const sep = splitRow(nextLine);
      if (head.length === sep.length) {
        const rows: string[][] = [head];
        i += 2;
        while (
          i < lines.length &&
          (lines[i] as string).trim() &&
          (lines[i] as string).includes("|")
        ) {
          rows.push(splitRow(lines[i] as string));
          i++;
        }
        out.push(tableNode(rows, head.length));
        continue;
      }
    }
    const image = IMAGE_LINE.exec(line);
    if (image) {
      const dest = destination(`(${image[2]})`, 0);
      if (dest) {
        out.push({
          type: "image",
          attrs: {
            src: dest.url,
            alt: unescapeMd(image[1] as string),
            ...(dest.title !== undefined ? { title: dest.title } : {}),
          },
        });
        i++;
        continue;
      }
    }
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      (lines[i] as string).trim() &&
      !startsBlock(lines[i] as string, lines[i + 1])
    ) {
      para.push(lines[i] as string);
      i++;
    }
    const content = inlineOf(para.join("\n"));
    out.push(content.length ? { type: "paragraph", content } : { type: "paragraph" });
  }
  return out;
}

function tableNode(rows: string[][], width: number): RichNode {
  return {
    type: "table",
    content: rows.map((cells, r) => ({
      type: "tableRow",
      content: Array.from({ length: width }, (_, c) => {
        const content = inlineOf(cells[c] ?? "");
        return {
          type: r === 0 ? "tableHeader" : "tableCell",
          content: [{ type: "paragraph", ...(content.length ? { content } : {}) }],
        } as RichNode;
      }),
    })),
  };
}

interface RawItem {
  lines: string[];
  width: number;
  task?: boolean;
  checked?: boolean;
}

function parseList(lines: string[], start: number): [RichNode[], number] {
  const first = lines[start] as string;
  const orderedFirst = ORDERED.exec(first);
  const base = (orderedFirst ? orderedFirst[1] : (BULLET.exec(first)?.[1] ?? "")) as string;
  const ordered = !!orderedFirst;
  const startNumber = orderedFirst ? Number(orderedFirst[2]) : 1;
  const items: RawItem[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i] as string;
    const m = ordered ? ORDERED.exec(line) : BULLET.exec(line);
    if (m && (m[1] as string).length <= base.length + 1) {
      const content = (ordered ? m[4] : m[3]) as string;
      const task = !ordered ? /^\[([ xX])\][ \t]+(.*)$/.exec(content) : null;
      items.push({
        lines: [task ? (task[2] as string) : content],
        width: ordered ? (m[2] as string).length + 2 : 2,
        ...(task ? { task: true, checked: task[1] !== " " } : {}),
      });
      i++;
      continue;
    }
    if (!line.trim()) {
      // A blank line stays in the list when an indented line or another item follows.
      let j = i;
      while (j < lines.length && !(lines[j] as string).trim()) j++;
      const after = lines[j];
      if (!items.length || after === undefined) break;
      const nextItem = ordered ? ORDERED.exec(after) : BULLET.exec(after);
      if (nextItem && (nextItem[1] as string).length <= base.length + 1) {
        i = j;
        continue;
      }
      if (/^\s{2,}\S/.test(after)) {
        (items[items.length - 1] as RawItem).lines.push("");
        i++;
        continue;
      }
      break;
    }
    // Indented text belongs to the last item: its paragraphs, a nested list, a code block.
    if (items.length && /^\s+\S/.test(line)) {
      (items[items.length - 1] as RawItem).lines.push(line);
      i++;
      continue;
    }
    break;
  }
  const lists: RichNode[] = [];
  items.forEach((item, index) => {
    const [head, ...rest] = item.lines;
    const dedented = rest.map((l) => {
      const lead = /^ */.exec(l)?.[0].length ?? 0;
      return l.slice(Math.min(item.width, lead));
    });
    const children = parseBlocks([head as string, ...dedented]);
    const content: RichNode[] =
      children[0]?.type === "paragraph" ? children : [{ type: "paragraph" }, ...children];
    const node: RichNode = item.task
      ? { type: "taskItem", attrs: { checked: !!item.checked }, content }
      : { type: "listItem", content };
    const kind = item.task ? "taskList" : ordered ? "orderedList" : "bulletList";
    const last = lists[lists.length - 1];
    if (last && last.type === kind) (last.content as RichNode[]).push(node);
    else {
      lists.push({
        type: kind,
        ...(kind === "orderedList" && startNumber !== 1 && index === 0
          ? { attrs: { start: startNumber } }
          : {}),
        content: [node],
      });
    }
  });
  return [lists, i];
}

/** Markdown to a document. Anything it does not know stays plain text; it never throws. */
export function fromMarkdown(markdown: string): RichDoc {
  const lines = markdown.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  return normalizeDoc({ type: "doc", content: parseBlocks(lines) });
}
