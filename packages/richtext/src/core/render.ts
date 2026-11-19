// The static renderer: a document becomes a small tree (`ViewNode`) and an HTML string, with no
// ProseMirror and no React, so a task list, a preview or an email never loads the editor. The React
// view walks the same tree. Each plugin says how its own nodes and marks look; a type no plugin
// knows is shown as a placeholder, never as a crash.

import { registryOf } from "./defaults";
import type { RichMark, RichNode } from "./model";
import type { Plugins, Registry, ViewWriter } from "./plugin";
import { type ViewNode, el } from "./view";

export { safeUrl } from "./view";
export type { ViewAttrs, ViewElement, ViewNode } from "./view";

function markEl(mark: RichMark, children: ViewNode[], registry: Registry): ViewNode[] {
  const render = registry.mark(mark.type)?.render;
  // A mark no plugin knows is left out: its text stays.
  return render ? [render(mark, children)] : children;
}

function unknown(node: RichNode, children: ViewNode[], inline: boolean): ViewNode[] {
  const label = typeof node.attrs?.["label"] === "string" ? node.attrs["label"] : undefined;
  const attrs = { class: "fg-rt-unknown", "data-unknown": node.type };
  if (children.length) return [el(inline ? "span" : "div", attrs, children)];
  if (inline) return label ? [el("span", attrs, [label])] : [];
  return [el("div", attrs, [`Unsupported block (${node.type})`])];
}

const isInlineKid = (registry: Registry, node: RichNode) =>
  node.type === "text" || registry.node(registry.migrate(node).type)?.inline === true;

/**
 * `inline`: the node sits among text (a sibling is text or an inline node), which is how a node no
 * plugin knows is told from a block: it has no spec to say so.
 */
function toNode(node: RichNode, registry: Registry, inline = false): ViewNode[] {
  const source = registry.migrate(node);
  const writer: ViewWriter = {
    children: (n) => {
      const kids = n.content ?? [];
      const among = kids.some((k) => isInlineKid(registry, k));
      return kids.flatMap((c) => toNode(c, registry, among));
    },
  };
  if (source.type === "text") {
    let out: ViewNode[] = [source.text ?? ""];
    // Marks are stored outermost first; the first one wraps the rest.
    for (const mark of [...(source.marks ?? [])].reverse()) out = markEl(mark, out, registry);
    return out;
  }
  if (source.type === "doc") return writer.children(source);
  const spec = registry.node(source.type);
  if (spec?.render) return spec.render(source, writer);
  if (spec) return writer.children(source);
  return unknown(source, writer.children(source), inline);
}

/** The document as a list of top-level view nodes. Unsafe URLs are dropped. */
export function toTree(node: RichNode, plugins?: Plugins): ViewNode[] {
  return toNode(node, registryOf(plugins));
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
export function toHtml(node: RichNode, plugins?: Plugins): string {
  return toTree(node, plugins).map(serialize).join("");
}
