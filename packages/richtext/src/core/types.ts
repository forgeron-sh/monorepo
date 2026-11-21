// The document's types: plain JSON, ProseMirror-compatible. A leaf of the core, so the plugin
// contract and the plugins can name them without depending on the functions that use the plugins.

export type MarkType = string;

export interface RichMark {
  type: MarkType;
  attrs?: { href?: string; [key: string]: unknown };
}

export type NodeType = string;

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
