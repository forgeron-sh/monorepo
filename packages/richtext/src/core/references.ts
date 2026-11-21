// References: a typed pointer to a thing of the app, inline in a text (`{ kind, id, label }`). A
// person, a page, a tag, a date are all references with different kinds; the editor does not know
// what they mean, it only lets a provider offer them and reports which were added or removed, so
// an app can notify people. The legacy `mention` node is the kind `user`.

import type { RichNode } from "./types";

export interface Reference {
  /** What it points at: `user`, `page`, `tag`. */
  kind: string;
  id: string;
  /** What the text shows. */
  label: string;
}

/** One candidate a provider offers while the user types a trigger character. */
export interface ReferenceItem {
  id: string;
  label: string;
  /** A second line: an email, a role. */
  hint?: string;
}

/** Where the candidates of one kind come from. The editor opens the menu on `char`. */
export interface ReferenceProvider {
  kind: string;
  /** The character that opens the menu. Default `@`. */
  char?: string;
  /** The menu's accessible name. Default: the kind. */
  label?: string;
  /** What the menu says when nothing matches. */
  empty?: string;
  /** Candidates for the text typed after the trigger: a fixed list, or a search on a server. */
  items: (query: string) => ReferenceItem[] | Promise<ReferenceItem[]>;
}

/** A node is a reference (the current node, or the legacy `mention`, read as the kind `user`). */
export function asReference(node: RichNode): Reference | undefined {
  if (node.type !== "reference" && node.type !== "mention") return undefined;
  const id = node.attrs?.["id"];
  if (id === undefined || id === null || id === "") return undefined;
  const kind = node.type === "mention" ? "user" : String(node.attrs?.["kind"] || "user");
  return { kind, id: String(id), label: String(node.attrs?.["label"] ?? id) };
}

const keyOf = (r: Reference) => `${r.kind}\u0000${r.id}`;

/** Every reference of a document, once each (by kind and id), in reading order. */
export function referencesOf(node: RichNode): Reference[] {
  const seen = new Map<string, Reference>();
  const walk = (n: RichNode) => {
    const ref = asReference(n);
    if (ref && !seen.has(keyOf(ref))) seen.set(keyOf(ref), ref);
    for (const child of n.content ?? []) walk(child);
  };
  walk(node);
  return [...seen.values()];
}

export interface ReferencesChange {
  added: Reference[];
  removed: Reference[];
  /** The references of the document now. */
  all: Reference[];
}

/** What changed between two states (documents or lists): what was added and what was removed. */
export function diffReferences(
  before: RichNode | ReadonlyArray<Reference>,
  after: RichNode | ReadonlyArray<Reference>,
): ReferencesChange {
  const list = (v: RichNode | ReadonlyArray<Reference>) =>
    Array.isArray(v) ? [...(v as ReadonlyArray<Reference>)] : referencesOf(v as RichNode);
  const prev = list(before);
  const next = list(after);
  const had = new Set(prev.map(keyOf));
  const has = new Set(next.map(keyOf));
  return {
    added: next.filter((r) => !had.has(keyOf(r))),
    removed: prev.filter((r) => !has.has(keyOf(r))),
    all: next,
  };
}
