// The document model: plain JSON, ProseMirror-compatible (the shape `editor.getJSON()` returns and
// `setContent` takes), so a document is stored, diffed and rendered without the editor.

export type MarkType = "bold" | "italic" | "underline" | "strike" | "code" | "link";

export interface RichMark {
  type: MarkType;
  attrs?: { href?: string; [key: string]: unknown };
}

export type NodeType =
  | "doc"
  | "paragraph"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "listItem"
  | "taskList"
  | "taskItem"
  | "blockquote"
  | "codeBlock"
  | "horizontalRule"
  | "table"
  | "tableRow"
  | "tableHeader"
  | "tableCell"
  | "image"
  | "mention"
  | "hardBreak"
  | "text";

export interface RichNode {
  type: NodeType;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: RichMark[];
  text?: string;
}

/** A whole document: the root node, `type: "doc"`. */
export interface RichDoc extends RichNode {
  type: "doc";
  content: RichNode[];
}

export const MARK_TYPES: ReadonlyArray<MarkType> = [
  "link",
  "bold",
  "italic",
  "strike",
  "underline",
  "code",
];

const NODE_TYPES: ReadonlySet<string> = new Set<NodeType>([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
  "image",
  "mention",
  "hardBreak",
  "text",
]);

/** The empty document: one empty paragraph, what the editor starts from. */
export function emptyDoc(): RichDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

const rank = (m: RichMark) => MARK_TYPES.indexOf(m.type);

/**
 * Cleans a document so equal content is equal JSON: marks in one fixed order, adjacent text with
 * the same marks merged, empty text dropped, `null` attributes removed, a missing paragraph added
 * where the schema wants one (an empty doc or list item).
 */
export function normalizeDoc(input: RichDoc): RichDoc {
  const out = normalizeNode(input);
  const content = out.content?.length ? out.content : [{ type: "paragraph" } as RichNode];
  return { type: "doc", content };
}

function cleanAttrs(attrs: Record<string, unknown> | undefined) {
  if (!attrs) return undefined;
  const kept = Object.entries(attrs).filter(([, v]) => v !== null && v !== undefined);
  return kept.length ? Object.fromEntries(kept) : undefined;
}

const sameMarks = (a: RichMark[] | undefined, b: RichMark[] | undefined) =>
  JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

function normalizeNode(node: RichNode): RichNode {
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
      .sort((a, b) => rank(a) - rank(b));
    if (marks.length) out.marks = marks;
    return out;
  }
  if (node.content) {
    const children: RichNode[] = [];
    for (const child of node.content) {
      const next = normalizeNode(child);
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
  if ((node.type === "listItem" || node.type === "taskItem") && !out.content) {
    out.content = [{ type: "paragraph" }];
  }
  return out;
}

/**
 * Reads stored JSON of unknown origin: a document, or the empty one when it is not (a missing or
 * foreign value never throws). Unknown node types are dropped with their content.
 */
export function parseDoc(value: unknown): RichDoc {
  if (typeof value === "string") {
    try {
      return parseDoc(JSON.parse(value));
    } catch {
      return emptyDoc();
    }
  }
  if (!isRecord(value) || value["type"] !== "doc") return emptyDoc();
  const content = Array.isArray(value["content"]) ? sanitize(value["content"]) : [];
  return normalizeDoc({ type: "doc", content });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitize(list: unknown[]): RichNode[] {
  const out: RichNode[] = [];
  for (const raw of list) {
    if (!isRecord(raw)) continue;
    const type = raw["type"];
    if (typeof type !== "string" || !NODE_TYPES.has(type) || type === "doc") continue;
    const node: RichNode = { type: type as NodeType };
    if (isRecord(raw["attrs"])) node.attrs = raw["attrs"];
    if (typeof raw["text"] === "string") node.text = raw["text"];
    if (Array.isArray(raw["content"])) node.content = sanitize(raw["content"]);
    if (Array.isArray(raw["marks"])) {
      const marks = raw["marks"].filter(
        (m): m is RichMark => isRecord(m) && (MARK_TYPES as readonly unknown[]).includes(m["type"]),
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
export function sameDoc(a: RichDoc, b: RichDoc): boolean {
  return JSON.stringify(normalizeDoc(a)) === JSON.stringify(normalizeDoc(b));
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
