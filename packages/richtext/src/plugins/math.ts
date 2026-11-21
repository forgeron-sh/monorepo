// Formulas, core half: an inline `mathInline` and a block `mathBlock`, both holding LaTeX source in
// their `tex` attribute. Markdown is `$x^2$` and `$$ ... $$`. This half typesets nothing: the static
// view writes the LaTeX source in a `<code>` and calls `renderMath(tex, display)` when the app gives
// one (KaTeX, MathJax, a server). The editor half loads KaTeX lazily to draw and edit formulas.

import { type CorePlugin, definePlugin } from "../core/plugin";
import type { RichNode } from "../core/types";
import { el, rawEl, str } from "../core/view";
import type { ViewElement } from "../core/view";

/** Typesets LaTeX to an HTML string, trusted: `display` is `true` for a block formula. May throw on bad LaTeX. */
export type MathRenderer = (tex: string, display: boolean) => string;

export interface MathOptions {
  /** Typesets the static view. Without it the LaTeX source is shown in a `<code>`. */
  renderMath?: MathRenderer;
}

/** `{ tex }`, the only attribute of a formula. */
export const mathNode = (display: boolean, tex: string): RichNode => ({
  type: display ? "mathBlock" : "mathInline",
  attrs: { tex },
});

const texOf = (node: RichNode) => str(node.attrs?.["tex"]) ?? "";

function view(node: RichNode, display: boolean, renderMath: MathRenderer | undefined): ViewElement {
  const tex = texOf(node);
  const attrs = {
    class: display ? "fg-rt-math fg-rt-math-block" : "fg-rt-math",
    "data-math": display ? "block" : "inline",
    "data-tex": tex,
  };
  const tag = display ? "div" : "span";
  if (renderMath && tex.trim()) {
    try {
      return rawEl(tag, attrs, renderMath(tex, display));
    } catch {
      // Bad LaTeX: the source is shown with an error class, the page still renders.
      return el(tag, { ...attrs, class: `${attrs.class} fg-rt-math-error` }, [
        el("code", undefined, [tex]),
      ]);
    }
  }
  return el(tag, attrs, [el("code", undefined, [tex])]);
}

const BLOCK_FENCE = /^ {0,3}\$\$/;

/** The core half with options: `createMath({ renderMath })` typesets the static view. */
export function createMath(options: MathOptions = {}): CorePlugin {
  const { renderMath } = options;
  return definePlugin({
    id: "math",
    name: "Math",
    description:
      "Inline and block formulas in LaTeX: `$x^2$` and `$$ ... $$`. Typeset with KaTeX in the editor, loaded on first use.",
    nodes: {
      mathInline: {
        inline: true,
        markdown: (node) => {
          const tex = texOf(node)
            .replace(/\s*\n\s*/g, " ")
            .trim();
          return tex ? `$${tex}$` : "";
        },
        text: (node) => texOf(node),
        render: (node) => [view(node, false, renderMath)],
      },
      mathBlock: {
        markdown: (node) => `$$\n${texOf(node).trim()}\n$$`,
        text: (node) => texOf(node),
        render: (node) => [view(node, true, renderMath)],
      },
    },
    blocks: [
      {
        id: "math-block",
        label: "Math block",
        keywords: ["math", "latex", "equation", "formula", "katex", "tex"],
        icon: "calculator-01",
        group: "insert",
        shortcut: "$$",
      },
    ],
    markdown: {
      blocks: [
        {
          id: "mathBlock",
          priority: 90,
          interrupts: (line) => BLOCK_FENCE.test(line),
          read: (lines, at) => {
            const first = lines[at] as string;
            if (!BLOCK_FENCE.test(first)) return undefined;
            const rest = first.trim().slice(2);
            // `$$ x $$` on one line.
            if (rest.length > 2 && rest.endsWith("$$") && !rest.slice(0, -2).includes("$$")) {
              return { nodes: [mathNode(true, rest.slice(0, -2).trim())], next: at + 1 };
            }
            const body: string[] = rest.trim() ? [rest.trim()] : [];
            for (let i = at + 1; i < lines.length; i++) {
              const line = (lines[i] as string).trim();
              if (line.endsWith("$$")) {
                const last = line.slice(0, -2).trim();
                if (last) body.push(last);
                return { nodes: [mathNode(true, body.join("\n"))], next: i + 1 };
              }
              body.push(lines[i] as string);
            }
            return undefined; // never closed: plain text
          },
        },
      ],
      inline: [
        {
          chars: "$",
          read: (src, at) => {
            // Pandoc's rule keeps prices apart: `$5 and $10` is text, `$x$` is a formula. The
            // opener has no space after it, the closer none before it and no digit after it.
            const first = src[at + 1];
            if (first === undefined || first === "$" || /\s/.test(first)) return undefined;
            for (let i = at + 1; i < src.length; i++) {
              const c = src[i];
              if (c === "\\") {
                i++;
                continue;
              }
              if (c === "\n") return undefined;
              if (c !== "$") continue;
              if (/\s/.test(src[i - 1] ?? " ") || /\d/.test(src[i + 1] ?? "")) return undefined;
              return { nodes: [mathNode(false, src.slice(at + 1, i))], end: i + 1 };
            }
            return undefined;
          },
        },
      ],
    },
  });
}

/** The plugin without a typesetter: the static view shows the LaTeX source in a `<code>`. */
export const math = createMath();
