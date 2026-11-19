// The document model: plain JSON, ProseMirror-compatible (the shape `editor.getJSON()` returns and
// `setContent` takes), so a document is stored, diffed and rendered without the editor.
//
// Node and mark types are open strings: a plugin owns its types, and a document may hold a type
// no plugin of this editor knows (it is kept as is, and shown as a placeholder).

import { registryOf } from "./defaults";
import type { Plugins, Registry } from "./plugin";
import type { MarkType, RichDoc, RichMark, RichNode } from "./types";

export type { MarkType, NodeType, RichDoc, RichMark, RichNode } from "./types";

/** The marks of the full preset, in the order they are stored (outermost first). */
export const MARK_TYPES: ReadonlyArray<MarkType> = [
  "link",
  "bold",
  "italic",
  "strike",
  "underline",
  "code",
];

/** The empty document: one empty paragraph, what the editor starts from. */
export function emptyDoc(): RichDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

function cleanAttrs(attrs: Record<string, unknown> | undefined) {
  if (!attrs) return undefined;
  const kept = Object.entries(attrs).filter(([, v]) => v !== null && v !== undefined);
  return kept.length ? Object.fromEntries(kept) : undefined;
}

const sameMarks = (a: RichMark[] | undefined, b: RichMark[] | undefined) =>
  JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

/**
 * Cleans a document so equal content is equal JSON: marks in one fixed order, adjacent text with
 * the same marks merged, empty text dropped, `null` attributes removed, a missing paragraph added
 * where a plugin's node wants one (an empty doc or list item), legacy nodes migrated (`mention`
 * becomes a `reference`). Types no plugin knows are kept untouched.
 */
export function normalizeDoc(input: RichDoc, plugins?: Plugins): RichDoc {
  const registry = registryOf(plugins);
  const out = normalizeNode(registry.migrate(input), registry);
  const content = out.content?.length ? out.content : [{ type: "paragraph" } as RichNode];
  return { type: "doc", content };
}

function normalizeNode(source: RichNode, registry: Registry): RichNode {
  const node = registry.migrate(source);
  const out: RichNode = { type: node.type };
  const attrs = cleanAttrs(node.attrs);
  if (attrs) out.attrs = attrs;
  if (node.type === "text") {
    out.text = node.text ?? "";
    const marks = (node.marks ?? [])
      .map((m) => {
        const a = cleanAttrs(m.attrs);
        return a ? ({ type: m.type, attrs: a } as RichMark) : ({ type: m.type } as RichMark);
      })
      .sort((a, b) => registry.markRank(a.type) - registry.markRank(b.type));
    if (marks.length) out.marks = marks;
    return out;
  }
  if (node.content) {
    const children: RichNode[] = [];
    for (const child of node.content) {
      const next = normalizeNode(child, registry);
      if (next.type === "text") {
        if (!next.text) continue;
        const last = children[children.length - 1];
        if (last && last.type === "text" && sameMarks(last.marks, next.marks)) {
          last.text = (last.text ?? "") + next.text;
          continue;
        }
      }
      children.push(next);
    }
    if (children.length) out.content = children;
  }
  if (!out.content && registry.node(node.type)?.fillEmpty) out.content = [{ type: "paragraph" }];
  return out;
}

export interface ParseOptions {
  /**
   * What to do with a node type no plugin knows. `drop` (the default) removes it with its
   * content, the safe choice for foreign data; `keep` leaves it as is, so a document written by a
   * richer editor survives a round trip through a poorer one.
   */
  unknown?: "drop" | "keep";
}

/**
 * Reads stored JSON of unknown origin: a document, or the empty one when it is not (a missing or
 * foreign value never throws). Unknown node types are dropped with their content, unless
 * `options.unknown` is `keep`.
 */
export function parseDoc(value: unknown, plugins?: Plugins, options: ParseOptions = {}): RichDoc {
  if (typeof value === "string") {
    try {
      return parseDoc(JSON.parse(value), plugins, options);
    } catch {
      return emptyDoc();
    }
  }
  if (!isRecord(value) || value["type"] !== "doc") return emptyDoc();
  const registry = registryOf(plugins);
  const content = Array.isArray(value["content"])
    ? sanitize(value["content"], registry, options.unknown === "keep")
    : [];
  return normalizeDoc({ type: "doc", content }, registry);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitize(list: unknown[], registry: Registry, keep: boolean): RichNode[] {
  const out: RichNode[] = [];
  for (const raw of list) {
    if (!isRecord(raw)) continue;
    const type = raw["type"];
    if (typeof type !== "string" || type === "doc") continue;
    if (!registry.knows(type) && !keep) continue;
    const node: RichNode = { type };
    if (isRecord(raw["attrs"])) node.attrs = raw["attrs"];
    if (typeof raw["text"] === "string") node.text = raw["text"];
    if (Array.isArray(raw["content"])) node.content = sanitize(raw["content"], registry, keep);
    if (Array.isArray(raw["marks"])) {
      const marks = raw["marks"].filter(
        (m): m is RichMark =>
          isRecord(m) && typeof m["type"] === "string" && (keep || registry.hasMark(m["type"])),
      );
      if (marks.length) node.marks = marks;
    }
    out.push(node);
  }
  return out;
}

/** `true` for the empty document, or one with only empty paragraphs. */
export function isEmptyDoc(doc: RichDoc): boolean {
  return doc.content.every((n) => n.type === "paragraph" && (!n.content || n.content.length === 0));
}

/** Structural equality of two documents, after normalisation. */
export function sameDoc(a: RichDoc, b: RichDoc, plugins?: Plugins): boolean {
  const registry = registryOf(plugins);
  return JSON.stringify(normalizeDoc(a, registry)) === JSON.stringify(normalizeDoc(b, registry));
}

/* Small constructors, for tests, seeds and examples. */

export const text = (value: string, ...marks: MarkType[]): RichNode => ({
  type: "text",
  text: value,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});

export const link = (value: string, href: string): RichNode => ({
  type: "text",
  text: value,
  marks: [{ type: "link", attrs: { href } }],
});

export const paragraph = (...content: Array<RichNode | string>): RichNode => {
  const nodes = content.map((c) => (typeof c === "string" ? text(c) : c));
  return nodes.length ? { type: "paragraph", content: nodes } : { type: "paragraph" };
};

export const heading = (level: 1 | 2 | 3, ...content: Array<RichNode | string>): RichNode => ({
  type: "heading",
  attrs: { level },
  content: content.map((c) => (typeof c === "string" ? text(c) : c)),
});

export const doc = (...content: RichNode[]): RichDoc => ({
  type: "doc",
  content: content.length ? content : [{ type: "paragraph" }],
});
