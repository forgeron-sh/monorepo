// Markdown in and out, as pure functions, composed from the plugins. The engine knows the syntax
// every document shares (paragraphs, escapes, line breaks, emphasis delimiters); everything else
// (headings, lists, tables, a mention...) is a rule a plugin brings. What `toMarkdown` writes,
// `fromMarkdown` reads back to the same document (after `normalizeDoc`), for the plugins in use.

import { registryOf } from "./defaults";
import {
  closingBracket,
  destination,
  escapeText,
  escapeUrl,
  isPunct,
  isSpace,
  isWord,
  textNode,
} from "./markdown-kit";
import { normalizeDoc, type RichDoc, type RichMark, type RichNode } from "./model";
import type { MarkdownReader, MarkdownWriter, Plugins, Registry } from "./plugin";

/* ================================================================== Export */

const sameMark = (a: RichMark, b: RichMark) => JSON.stringify(a) === JSON.stringify(b);

const isInlineNode = (registry: Registry, node: RichNode) =>
  node.type === "text" || registry.node(registry.migrate(node).type)?.inline === true;

function writer(registry: Registry): MarkdownWriter {
  const delimited = (m: RichMark) => {
    const md = registry.mark(m.type)?.markdown;
    return !!md && !md.literal && (md.open !== undefined || md.close !== undefined);
  };
  const literalOf = (marks: RichMark[]) =>
    marks.map((m) => registry.mark(m.type)?.markdown?.literal).find((fn) => fn !== undefined);

  const w: MarkdownWriter = {
    escape: escapeText,
    escapeUrl,
    isList: (node) => registry.node(node.type)?.list === true,
    // A type no plugin knows that writes nothing leaves no gap.
    blocks: (nodes) =>
      nodes
        .map((n) => [n, w.block(n)] as const)
        .filter(([n, md]) => md !== "" || registry.node(registry.migrate(n).type))
        .map(([, md]) => md)
        .join("\n\n"),
    block(source) {
      const node = registry.migrate(source);
      const spec = registry.node(node.type);
      if (spec) return spec.markdown ? spec.markdown(node, w, false) : "";
      // A type no plugin knows: its text survives as plain blocks or a plain line.
      const kids = node.content ?? [];
      if (!kids.length) return "";
      return kids.some((k) => isInlineNode(registry, k)) ? w.inline(kids) : w.blocks(kids);
    },
    inline(nodes, inTable = false) {
      let out = "";
      let stack: RichMark[] = [];

      const closeTo = (keep: number) => {
        if (stack.length <= keep) return;
        // Whitespace before a closing delimiter would break it: move it outside.
        const tail = /\s+$/.exec(out)?.[0] ?? "";
        if (tail) out = out.slice(0, out.length - tail.length);
        while (stack.length > keep) {
          const mark = stack.pop() as RichMark;
          out += registry.mark(mark.type)?.markdown?.close?.(mark) ?? "";
        }
        out += tail;
      };

      for (const source of nodes) {
        const node = registry.migrate(source);
        if (node.type === "text") {
          const all = node.marks ?? [];
          const marks = all
            .filter(delimited)
            .sort((a, b) => registry.markRank(a.type) - registry.markRank(b.type));
          const literal = literalOf(all);
          let common = 0;
          while (
            common < stack.length &&
            common < marks.length &&
            sameMark(stack[common] as RichMark, marks[common] as RichMark)
          )
            common++;
          closeTo(common);
          const value = node.text ?? "";
          const lead = literal ? "" : (/^\s+/.exec(value)?.[0] ?? "");
          const body = literal ? value : value.slice(lead.length);
          const toOpen = marks.slice(common);
          // Leading whitespace goes before the new delimiters.
          out += lead;
          if (toOpen.length && body) {
            for (const m of toOpen) {
              out += registry.mark(m.type)?.markdown?.open?.(m) ?? "";
              stack.push(m);
            }
          }
          out += literal ? literal(body) : escapeText(body, inTable);
        } else {
          closeTo(0);
          const spec = registry.node(node.type);
          out += spec?.markdown
            ? spec.markdown(node, w, inTable)
            : spec
              ? ""
              : node.content
                ? w.inline(node.content, inTable)
                : typeof node.attrs?.["label"] === "string"
                  ? escapeText(node.attrs["label"], inTable)
                  : "";
        }
      }
      closeTo(0);
      return out;
    },
  };
  return w;
}

/**
 * A document as Markdown. Blocks separated by one blank line, no trailing newline. A node type no
 * plugin knows is written as the text it holds.
 */
export function toMarkdown(doc: RichNode, plugins?: Plugins): string {
  const registry = registryOf(plugins);
  const root = registry.migrate(doc);
  const isDoc = root.type === "doc";
  if (isDoc) for (const hook of registry.documentHooks) hook.prepare?.(root);
  const w = writer(registry);
  let out = w.blocks(root.content ?? []);
  if (isDoc) for (const hook of registry.documentHooks) out = hook.markdown?.(root, out, w) ?? out;
  return out;
}

/* ================================================================== Import */

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

function reader(registry: Registry): MarkdownReader {
  const r: MarkdownReader = {
    has: (id) => registry.has(id),
    blocks: (lines) => parseBlocks(lines, registry, r),
    inline: (src, marks = []) => parseInline(src, [...marks], registry, r),
  };
  return r;
}

function parseInline(
  src: string,
  marks: RichMark[],
  registry: Registry,
  r: MarkdownReader,
): RichNode[] {
  const out: RichNode[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push(textNode(buf, marks));
    buf = "";
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
    let taken = false;
    for (const rule of registry.inlineReaders(c)) {
      const hit = rule.read(src, i, marks, r);
      if (hit) {
        flush();
        out.push(...hit.nodes);
        i = hit.end;
        taken = true;
        break;
      }
    }
    if (taken) continue;
    const maxSize = registry.emphasisMax(c);
    if (maxSize > 0) {
      let run = 0;
      while (src[i + run] === c) run++;
      const prev = src[i - 1];
      const next = src[i + run];
      const canOpen = !isSpace(next) && (c !== "_" || !isWord(prev));
      let size = Math.min(run, maxSize);
      while (size > 0 && !registry.emphasis(c, size)) size--;
      if (canOpen && size) {
        const end = findCloser(src, i + size, c, size);
        if (end !== -1 && end > i + size) {
          // `***a***`: the outer is bold, the inner italic (bold is written first).
          const type = registry.emphasis(c, size) as string;
          flush();
          out.push(...parseInline(src.slice(i + size, end), [...marks, { type }], registry, r));
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

function parseBlocks(lines: string[], registry: Registry, r: MarkdownReader): RichNode[] {
  const out: RichNode[] = [];
  const interrupts = (line: string, next: string | undefined) =>
    registry.blockReaders.some((b) => b.interrupts?.(line, next, r) === true);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] as string;
    if (!line.trim()) {
      i++;
      continue;
    }
    let taken = false;
    for (const rule of registry.blockReaders) {
      const hit = rule.read(lines, i, r);
      if (hit) {
        out.push(...hit.nodes);
        i = hit.next;
        taken = true;
        break;
      }
    }
    if (taken) continue;
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      (lines[i] as string).trim() &&
      !interrupts(lines[i] as string, lines[i + 1])
    ) {
      para.push(lines[i] as string);
      i++;
    }
    const content = parseInline(para.join("\n").trim(), [], registry, r);
    out.push(content.length ? { type: "paragraph", content } : { type: "paragraph" });
  }
  return out;
}

/**
 * Markdown to a document. Anything the plugins do not read stays plain text; it never throws.
 */
export function fromMarkdown(markdown: string, plugins?: Plugins): RichDoc {
  const registry = registryOf(plugins);
  const lines = markdown.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  let root: RichNode = { type: "doc", content: reader(registry).blocks(lines) };
  for (const hook of registry.documentHooks) root = hook.fromMarkdown?.(root) ?? root;
  return normalizeDoc({ type: "doc", content: root.content ?? [] }, registry);
}
