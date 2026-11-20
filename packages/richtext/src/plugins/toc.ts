// Table of contents, core half: a block that lists the headings of the document, each a link to its
// heading. It stores nothing but its own place: the list is made from the headings when it is shown.
// The headings are not changed either: their ids are derived from their text at render time (in the
// static view as `id` attributes, in the editor as decorations), with a slug that is unique in the
// document and the same everywhere (`slugify`, `uniqueSlugs`).

import type { RichNode } from "../core/types";
import { definePlugin } from "../core/plugin";
import { type ViewNode, el } from "../core/view";

/** `Hello, World!` becomes `hello-world`: lower case, letters and digits of any script, dashes. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * One id per text, in order: the slug of the text, a number added when it was taken already
 * (`intro`, `intro-1`, `intro-2`), never the id of another heading. A blank text has no id (`""`);
 * a text without a letter or digit gets `section`.
 */
export function uniqueSlugs(texts: ReadonlyArray<string>): string[] {
  const used = new Set<string>();
  return texts.map((text) => {
    if (!text.trim()) return "";
    const base = slugify(text) || "section";
    let id = base;
    for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  });
}

export interface TocEntry {
  /** The id of the heading, and the target of the link (`#id`). */
  id: string;
  level: number;
  text: string;
}

/** The text of an inline run: text nodes, and the label of an atom such as a reference. */
function inlineText(nodes: ReadonlyArray<RichNode> | undefined): string {
  return (nodes ?? [])
    .map((n) =>
      n.type === "text"
        ? (n.text ?? "")
        : n.content
          ? inlineText(n.content)
          : typeof n.attrs?.["label"] === "string"
            ? n.attrs["label"]
            : "",
    )
    .join("");
}

/** Every heading node of a document, nested ones included, in reading order. */
export function headingNodes(root: RichNode): RichNode[] {
  const out: RichNode[] = [];
  const walk = (node: RichNode) => {
    if (node.type === "heading") out.push(node);
    else for (const child of node.content ?? []) walk(child);
  };
  walk(root);
  return out;
}

const levelOf = (node: RichNode) => Math.min(3, Math.max(1, Number(node.attrs?.["level"]) || 1));

/** The headings that have text, with the id each one gets. Empty headings are left out. */
export function tocEntries(root: RichNode): TocEntry[] {
  const nodes = headingNodes(root);
  const texts = nodes.map((n) => inlineText(n.content).trim());
  const ids = uniqueSlugs(texts);
  return nodes.flatMap((node, i) =>
    ids[i] ? [{ id: ids[i] as string, level: levelOf(node), text: texts[i] as string }] : [],
  );
}

/** The static list: a link per heading, indented by level; a line when there is none. */
function listView(entries: ReadonlyArray<TocEntry>): ViewNode[] {
  if (!entries.length) return [el("p", { class: "fg-rt-toc-empty" }, ["No headings yet"])];
  return [
    el(
      "ul",
      undefined,
      entries.map((entry) =>
        el("li", { "data-level": entry.level }, [el("a", { href: `#${entry.id}` }, [entry.text])]),
      ),
    ),
  ];
}

/** What a render pass knows, found once per document before its nodes are rendered. */
const lists = new WeakMap<RichNode, ReadonlyArray<TocEntry>>();

/** Gives `id`s to the heading elements of a finished tree, in order, when the counts agree. */
function withIds(tree: ViewNode[], ids: ReadonlyArray<string>): ViewNode[] {
  let seen = 0;
  const visit = (node: ViewNode): ViewNode => {
    if (typeof node === "string") return node;
    const heading = /^h[1-3]$/.test(node.tag);
    const id = heading ? ids[seen++] : undefined;
    const children = node.children?.map(visit);
    return {
      ...node,
      ...(id ? { attrs: { ...node.attrs, id } } : {}),
      ...(children ? { children } : {}),
    };
  };
  return tree.map(visit);
}

const countHeadings = (tree: ViewNode[]): number =>
  tree.reduce<number>(
    (sum, node) =>
      typeof node === "string"
        ? sum
        : sum + (/^h[1-3]$/.test(node.tag) ? 1 : 0) + countHeadings(node.children ?? []),
    0,
  );

export const toc = definePlugin({
  id: "toc",
  name: "Table of contents",
  description:
    "A block that lists the headings of the page, each a link to its heading: `[TOC]` in Markdown.",
  nodes: {
    toc: {
      markdown: () => "[TOC]",
      text: () => "",
      render: (node) => [
        el(
          "nav",
          { class: "fg-rt-toc", "aria-label": "Table of contents" },
          listView(lists.get(node) ?? []),
        ),
      ],
    },
  },
  blocks: [
    {
      id: "toc",
      label: "Table of contents",
      keywords: ["toc", "contents", "outline", "headings", "index", "navigation"],
      icon: "table-of-contents",
      group: "insert",
    },
  ],
  document: {
    prepare(root) {
      const entries = tocEntries(root);
      const visit = (node: RichNode) => {
        if (node.type === "toc") lists.set(node, entries);
        for (const child of node.content ?? []) visit(child);
      };
      visit(root);
    },
    render(root, tree) {
      const nodes = headingNodes(root);
      const ids = uniqueSlugs(nodes.map((n) => inlineText(n.content).trim()));
      // The tree shows one `h1` to `h3` per heading when the heading plugin is there: if the counts
      // differ, another plugin draws headings too and no id is guessed.
      return ids.some(Boolean) && countHeadings(tree) === nodes.length ? withIds(tree, ids) : tree;
    },
  },
  markdown: {
    blocks: [
      {
        id: "toc",
        priority: 85,
        interrupts: (line) => /^ {0,3}\[toc\][ \t]*$/i.test(line),
        read: (lines, at) =>
          /^ {0,3}\[toc\][ \t]*$/i.test(lines[at] as string)
            ? { nodes: [{ type: "toc" }], next: at + 1 }
            : undefined,
      },
    ],
  },
});
