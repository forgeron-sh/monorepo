// The static renderer: a document becomes a small tree (`ViewNode`) and an HTML string, with no
// ProseMirror and no React, so a task list, a preview or an email never loads the editor. The React
// view walks the same tree.

import type { RichMark, RichNode } from "./model";

export type ViewAttrs = Record<string, string | number | boolean | undefined>;

export interface ViewElement {
  tag: string;
  attrs?: ViewAttrs;
  children?: ViewNode[];
}

/** A text string or an element. */
export type ViewNode = string | ViewElement;

const el = (tag: string, attrs?: ViewAttrs, children?: ViewNode[]): ViewElement => ({
  tag,
  ...(attrs ? { attrs } : {}),
  ...(children ? { children } : {}),
});

/** Only schemes that cannot run code: anything else loses its URL. */
export function safeUrl(url: unknown, kind: "link" | "image" = "link"): string | undefined {
  if (typeof url !== "string") return undefined;
  const value = url.trim();
  if (!value) return undefined;
  if (value.startsWith("//") || value.includes("\\")) return undefined;
  if (/^(\/|#|\.\/|\.\.\/)/.test(value)) return value;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1]?.toLowerCase();
  if (!scheme) return /^[^:]*$/.test(value) ? value : undefined;
  if (kind === "image") {
    if (scheme === "http" || scheme === "https") return value;
    return /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(value) ? value : undefined;
  }
  return ["http", "https", "mailto", "tel"].includes(scheme) ? value : undefined;
}

function markEl(mark: RichMark, children: ViewNode[]): ViewElement {
  switch (mark.type) {
    case "bold":
      return el("strong", undefined, children);
    case "italic":
      return el("em", undefined, children);
    case "underline":
      return el("u", undefined, children);
    case "strike":
      return el("s", undefined, children);
    case "code":
      return el("code", { class: "fg-rt-inline-code" }, children);
    case "link": {
      const href = safeUrl(mark.attrs?.["href"]);
      return el("a", { ...(href ? { href } : {}), rel: "noopener noreferrer nofollow" }, children);
    }
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? undefined : String(v));

function toNode(node: RichNode): ViewNode[] {
  const kids = () => (node.content ?? []).flatMap(toNode);
  switch (node.type) {
    case "text": {
      let out: ViewNode = node.text ?? "";
      // Marks are stored outermost first; the first one wraps the rest.
      for (const mark of [...(node.marks ?? [])].reverse()) out = markEl(mark, [out]);
      return [out];
    }
    case "doc":
      return kids();
    case "paragraph":
      return [el("p", undefined, kids())];
    case "heading": {
      const level = Math.min(3, Math.max(1, Number(node.attrs?.["level"]) || 1));
      return [el(`h${level}`, undefined, kids())];
    }
    case "bulletList":
      return [el("ul", undefined, kids())];
    case "orderedList": {
      const start = Number(node.attrs?.["start"]);
      return [el("ol", start > 1 ? { start } : undefined, kids())];
    }
    case "listItem":
      return [el("li", undefined, kids())];
    case "taskList":
      return [el("ul", { class: "fg-rt-tasks", "data-type": "taskList" }, kids())];
    case "taskItem": {
      const checked = node.attrs?.["checked"] === true;
      return [
        el("li", { "data-type": "taskItem", "data-checked": checked }, [
          el("input", { type: "checkbox", disabled: true, checked, "aria-label": "Done" }),
          el("div", undefined, kids()),
        ]),
      ];
    }
    case "blockquote":
      return [el("blockquote", undefined, kids())];
    case "codeBlock": {
      const language = str(node.attrs?.["language"]);
      const code = (node.content ?? []).map((c) => c.text ?? "").join("");
      return [
        el("pre", { class: "fg-rt-code" }, [
          el("code", language ? { "data-language": language } : undefined, [code]),
        ]),
      ];
    }
    case "horizontalRule":
      return [el("hr")];
    case "table":
      return [el("table", undefined, [el("tbody", undefined, kids())])];
    case "tableRow":
      return [el("tr", undefined, kids())];
    case "tableHeader":
      return [el("th", cellAttrs(node), kids())];
    case "tableCell":
      return [el("td", cellAttrs(node), kids())];
    case "image": {
      const src = safeUrl(node.attrs?.["src"], "image");
      if (!src) return [];
      const title = str(node.attrs?.["title"]);
      return [
        el("img", {
          src,
          alt: str(node.attrs?.["alt"]) ?? "",
          ...(title ? { title } : {}),
          loading: "lazy",
        }),
      ];
    }
    case "mention": {
      const id = str(node.attrs?.["id"]) ?? "";
      const label = str(node.attrs?.["label"]) ?? id;
      return [el("span", { class: "fg-rt-mention", "data-mention": id }, [`@${label}`])];
    }
    case "hardBreak":
      return [el("br")];
  }
}

function cellAttrs(node: RichNode): ViewAttrs | undefined {
  const colspan = Number(node.attrs?.["colspan"]);
  const rowspan = Number(node.attrs?.["rowspan"]);
  const attrs: ViewAttrs = {};
  if (colspan > 1) attrs["colSpan"] = colspan;
  if (rowspan > 1) attrs["rowSpan"] = rowspan;
  return Object.keys(attrs).length ? attrs : undefined;
}

/** The document as a list of top-level view nodes. Unsafe URLs are dropped. */
export function toTree(node: RichNode): ViewNode[] {
  return toNode(node);
}

const VOID = new Set(["br", "hr", "img", "input"]);
const ATTR_NAMES: Record<string, string> = { colSpan: "colspan", rowSpan: "rowspan" };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function serialize(node: ViewNode): string {
  if (typeof node === "string") return escapeHtml(node);
  const attrs = Object.entries(node.attrs ?? {})
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => {
      const name = ATTR_NAMES[k] ?? k;
      return v === true ? ` ${name}` : ` ${name}="${escapeHtml(String(v))}"`;
    })
    .join("");
  if (VOID.has(node.tag)) return `<${node.tag}${attrs}>`;
  return `<${node.tag}${attrs}>${(node.children ?? []).map(serialize).join("")}</${node.tag}>`;
}

/** The document as an HTML string, escaped, with only safe URLs. No script, no style. */
export function toHtml(node: RichNode): string {
  return toTree(node).map(serialize).join("");
}
