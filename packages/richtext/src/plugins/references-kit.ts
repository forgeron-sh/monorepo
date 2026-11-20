// What the reference kinds of this family (pages, tags, dates) share, core half: a way to say how
// one kind of the generic `reference` node reads in plain text and in the static view, leaving
// every other kind to the plugin that owns the node.

import type { NodeDecoration } from "../core/plugin";
import { type Reference, asReference } from "../core/references";
import type { ViewAttrs, ViewNode } from "../core/view";

export interface KindRules {
  /** The plain text of a reference of this kind; default: what the references plugin gives. */
  text?: (ref: Reference) => string;
  /** The static view; default: what the references plugin gives. */
  render?: (ref: Reference, fallback: () => ViewNode[]) => ViewNode[];
}

/** The `decorate` entry of a plugin that owns one kind of reference. */
export function decorateKind(
  kind: string,
  rules: KindRules,
): Readonly<Record<string, NodeDecoration>> {
  const mine = (node: Parameters<typeof asReference>[0]) => {
    const ref = asReference(node);
    return ref?.kind === kind ? ref : undefined;
  };
  return {
    reference: {
      text: (node, _writer, next) => {
        const ref = mine(node);
        return ref && rules.text ? rules.text(ref) : next();
      },
      render: (node, _writer, next) => {
        const ref = mine(node);
        return ref && rules.render ? rules.render(ref, next) : next();
      },
    },
  };
}

/** The attributes every reference of the static view carries, so an app can find them. */
export const referenceAttrs = (ref: Reference): ViewAttrs => ({
  "data-reference": ref.id,
  "data-reference-kind": ref.kind,
});
