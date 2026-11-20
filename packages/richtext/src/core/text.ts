// The plain text of a document, for search, previews and notifications.

import { registryOf } from "./defaults";
import type { RichNode } from "./model";
import type { Plugins, Registry, TextWriter } from "./plugin";

export interface PlainTextOptions {
  /** Between blocks. Default a newline. */
  separator?: string;
  /** Cut the result to this many characters, with an ellipsis. */
  maxLength?: number;
}

/**
 * The text of a document or a node: blocks on their own lines, a mention as `@label`. A node type
 * no plugin knows gives the text it holds.
 */
export function toPlainText(
  node: RichNode,
  options: PlainTextOptions = {},
  plugins?: Plugins,
): string {
  const registry = registryOf(plugins);
  const separator = options.separator ?? "\n";
  const root = registry.migrate(node);
  const isDoc = root.type === "doc";
  if (isDoc) for (const hook of registry.documentHooks) hook.prepare?.(root);
  let raw = textOf(root, separator, registry);
  if (isDoc) {
    const writer: TextWriter = {
      sep: separator,
      text: (child, s = separator) => textOf(registry.migrate(child), s, registry),
    };
    for (const hook of registry.documentHooks) raw = hook.text?.(root, raw, writer) ?? raw;
  }
  const out = raw.replace(/\n{3,}/g, "\n\n").trim();
  const max = options.maxLength;
  return max !== undefined && out.length > max ? `${out.slice(0, Math.max(0, max - 1))}…` : out;
}

function textOf(node: RichNode, sep: string, registry: Registry): string {
  if (node.type === "text") return node.text ?? "";
  const writer: TextWriter = {
    sep,
    text: (child, s = sep) => textOf(registry.migrate(child), s, registry),
  };
  const spec = registry.node(node.type);
  if (spec?.text) return spec.text(node, writer);
  const kids = (node.content ?? []).map(registry.migrate);
  // Among text, a node is inline; a type no plugin knows has no spec to say so.
  const inline = kids.some((k) => k.type === "text" || registry.node(k.type)?.inline === true);
  if (!kids.length && typeof node.attrs?.["label"] === "string") return node.attrs["label"];
  return kids
    .map((k) => textOf(k, sep, registry))
    .filter((s, i) => inline || s !== "" || i === 0)
    .join(inline ? "" : sep);
}
