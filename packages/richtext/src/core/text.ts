// The plain text of a document, for search, previews and notifications.

import type { RichNode } from "./model";

export interface PlainTextOptions {
  /** Between blocks. Default a newline. */
  separator?: string;
  /** Cut the result to this many characters, with an ellipsis. */
  maxLength?: number;
}

/** The text of a document or a node: blocks on their own lines, mentions as `@label`. */
export function toPlainText(node: RichNode, options: PlainTextOptions = {}): string {
  const separator = options.separator ?? "\n";
  const out = textOf(node, separator)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const max = options.maxLength;
  return max !== undefined && out.length > max ? `${out.slice(0, Math.max(0, max - 1))}…` : out;
}

function textOf(node: RichNode, sep: string): string {
  switch (node.type) {
    case "text":
      return node.text ?? "";
    case "hardBreak":
      return "\n";
    case "mention":
      return `@${String(node.attrs?.["label"] ?? node.attrs?.["id"] ?? "")}`;
    case "image":
      return String(node.attrs?.["alt"] ?? "");
    case "horizontalRule":
      return "";
    case "tableRow":
      return (node.content ?? []).map((c) => textOf(c, " ")).join("\t");
    default: {
      const kids = node.content ?? [];
      const inline = kids.every((k) => isInline(k));
      return kids
        .map((k) => textOf(k, sep))
        .filter((s, i) => inline || s !== "" || i === 0)
        .join(inline ? "" : sep);
    }
  }
}

const isInline = (n: RichNode) =>
  n.type === "text" || n.type === "hardBreak" || n.type === "mention";
