// Syntax colouring for the code block, core half. It holds no highlighter: the static view
// colours a block only when the app gives it a `highlight(code, language) => tokens` function, and
// renders the block as plain text otherwise. The editor half (`./editor/code-highlight`) brings
// the lazy engine, the language selector and the colours in the editor.
//
// The code block keeps its own `language` attribute and its Markdown fence; this plugin owns no
// node, it only passes over the finished static tree.

import { type CorePlugin, definePlugin } from "../core/plugin";
import type { ViewElement, ViewNode } from "../core/view";
import { el } from "../core/view";

/** A run of code and, when it is coloured, its kind: `keyword`, `string`, `comment`... */
export interface HighlightToken {
  text: string;
  /** One of `TOKEN_TYPES`, or any word the app styles with `.fg-rt-tok-<type>`. */
  type?: string;
}

/**
 * Colours code. `undefined` means the language is not known (the block stays plain). It must be
 * synchronous: a server awaits its grammars first (`loadHighlighter` in the editor half).
 */
export type Highlighter = (
  code: string,
  language: string,
) => ReadonlyArray<HighlightToken> | undefined;

/** The kinds of token the stylesheet colours with design tokens. */
export const TOKEN_TYPES = [
  "keyword",
  "string",
  "number",
  "literal",
  "comment",
  "function",
  "type",
  "variable",
  "attr",
  "tag",
  "operator",
  "punctuation",
  "meta",
  "addition",
  "deletion",
] as const;

export interface CodeHighlightOptions {
  /** Colours the static view. Without it the code block is rendered as plain text. */
  highlight?: Highlighter;
}

/** Class of a token: `fg-rt-tok-keyword`. A type outside `TOKEN_TYPES` is cleaned to a safe word. */
export const tokenClass = (type: string) => `fg-rt-tok-${type.replace(/[^a-z0-9-]/gi, "")}`;

/** The element for a token: a `span` with its class, or the bare text. */
export function tokenNode(token: HighlightToken): ViewNode {
  return token.type ? el("span", { class: tokenClass(token.type) }, [token.text]) : token.text;
}

const isElement = (node: ViewNode): node is ViewElement => typeof node !== "string";

const textOf = (node: ViewNode): string =>
  typeof node === "string" ? node : (node.children ?? []).map(textOf).join("");

function colour(node: ViewNode, highlight: Highlighter): ViewNode {
  if (!isElement(node)) return node;
  if (node.tag === "pre" && node.attrs?.["class"] === "fg-rt-code") {
    const [code] = node.children ?? [];
    const language = code && isElement(code) ? code.attrs?.["data-language"] : undefined;
    if (code && isElement(code) && typeof language === "string" && language) {
      let tokens: ReadonlyArray<HighlightToken> | undefined;
      try {
        tokens = highlight(textOf(code), language);
      } catch {
        // A broken highlighter leaves the block plain: the document still renders.
      }
      if (tokens) {
        return {
          ...node,
          children: [{ ...code, children: tokens.map(tokenNode) }],
        };
      }
    }
    return node;
  }
  if (!node.children) return node;
  return { ...node, children: node.children.map((child) => colour(child, highlight)) };
}

/**
 * The core half with options: `createCodeHighlight({ highlight })` for a static view that colours.
 * Put it in the list of core halves you give `RichTextView`, `toHtml` and `toTree`.
 */
export function createCodeHighlight(options: CodeHighlightOptions = {}): CorePlugin {
  const { highlight } = options;
  return definePlugin({
    id: "codeHighlight",
    name: "Code highlighting",
    description:
      "Syntax colouring for the code block, loaded on first use. The static view colours with a function the app gives, plain otherwise.",
    requires: ["codeBlock"],
    ...(highlight
      ? {
          document: {
            render: (_root: unknown, tree: ViewNode[]) => tree.map((n) => colour(n, highlight)),
          },
        }
      : {}),
  });
}

/** The plugin without a highlighter: the static view stays plain, the editor colours. */
export const codeHighlight = createCodeHighlight();
