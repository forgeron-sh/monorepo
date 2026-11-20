import { type ReactNode, createElement, useMemo } from "react";
import type { RichNode } from "../core/model";
import type { Plugins } from "../core/plugin";
import { type ViewNode, toTree } from "../core/render";
import { cx } from "./cx";

export interface RichTextViewProps {
  /** The document to show. Anything unsafe (a `javascript:` link) is dropped. */
  value: RichNode;
  /**
   * The core halves of the plugins the document was written with; default the `full` preset. A
   * node no plugin knows is shown as a placeholder.
   */
  plugins?: Plugins;
  className?: string;
}

const PROPS: Record<string, string> = { class: "className" };

function renderNode(node: ViewNode, key: number): ReactNode {
  if (typeof node === "string") return node;
  const props: Record<string, unknown> = { key };
  for (const [name, value] of Object.entries(node.attrs ?? {})) {
    if (value === undefined) continue;
    props[PROPS[name] ?? name] = value;
  }
  // A checkbox in a read-only view: shown, not clickable, and React does not warn about it.
  if (node.tag === "input") props["readOnly"] = true;
  if (node.html !== undefined) {
    props["dangerouslySetInnerHTML"] = { __html: node.html };
    return createElement(node.tag, props);
  }
  const kids = node.children?.map(renderNode);
  return createElement(node.tag, props, ...(kids ?? []));
}

/**
 * A document, read only, without ProseMirror: the static tree walked by React, from the core
 * halves of the plugins only. Light enough for a task list or a preview; the look is the editor's
 * (`@forgeron/richtext/styles.css`).
 */
export function RichTextView({ value, plugins, className }: RichTextViewProps) {
  const tree = useMemo(() => toTree(value, plugins), [value, plugins]);
  return <div className={cx("fg-rt fg-rt-view", className)}>{tree.map(renderNode)}</div>;
}
