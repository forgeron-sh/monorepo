// Formulas, editor half: the inline and block nodes, their node views and a small inline editor.
// KaTeX (MIT) and its stylesheet are fetched the first time a formula is drawn, never before; the
// node views are plain DOM, so this file loads no React and the schema can be built on a server.
//
// Clicking a formula (or inserting one) opens an editor under it: the LaTeX, a live preview and the
// error of KaTeX when the source is not valid. Enter applies (Mod+Enter in a block formula, where
// Enter is a new line), Escape cancels, leaving the formula applies.

import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import { NodeSelection, Selection } from "@tiptap/pm/state";
import { math as mathCore } from "../math";
import type { MathRenderer } from "../math";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

/** What `pluginOptions.math` takes. */
export interface MathEditorOptions {
  /** What KaTeX writes: HTML to draw, MathML for assistive technology, or both. Default `htmlAndMathml`. */
  output?: "html" | "mathml" | "htmlAndMathml";
  /** KaTeX macros, `{ "\\RR": "\\mathbb{R}" }`. */
  macros?: Record<string, string>;
}

interface Katex {
  renderToString(tex: string, options: Record<string, unknown>): string;
}

let katex: Katex | undefined;
let loading: Promise<Katex> | undefined;

/** Fetches KaTeX, and its stylesheet unless `css` is `false` (once). */
export function loadKatex(css = true): Promise<Katex> {
  loading ??= import("katex").then((m) => {
    katex = m.default as unknown as Katex;
    return katex;
  });
  if (css) void import("./math-style").catch(() => undefined);
  return loading;
}

const settings = (display: boolean, options: MathEditorOptions) => ({
  displayMode: display,
  throwOnError: true,
  strict: "ignore",
  trust: false,
  output: options.output ?? "htmlAndMathml",
  ...(options.macros ? { macros: { ...options.macros } } : {}),
});

/**
 * A `renderMath` for the static view, once KaTeX is loaded:
 * `createMath({ renderMath: await katexRenderer() })`. The stylesheet is the app's to import
 * (`katex/dist/katex.min.css`) for a page that is not an editor.
 */
export async function katexRenderer(options: MathEditorOptions = {}): Promise<MathRenderer> {
  const k = await loadKatex(false);
  return (tex, display) => k.renderToString(tex, settings(display, options));
}

type Result = { html: string } | { error: string };

function typeset(k: Katex, tex: string, display: boolean, options: MathEditorOptions): Result {
  try {
    return { html: k.renderToString(tex, settings(display, options)) };
  } catch (e) {
    const raw = (e as { rawMessage?: unknown }).rawMessage;
    return { error: typeof raw === "string" ? raw : e instanceof Error ? e.message : String(e) };
  }
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string) => {
  const node = document.createElement(tag);
  node.className = className;
  return node;
};

function mathNode(name: "mathInline" | "mathBlock", display: boolean) {
  return Node.create<MathEditorOptions>({
    name,
    group: display ? "block" : "inline",
    inline: !display,
    atom: true,
    selectable: true,
    addOptions: () => ({}),
    addAttributes: () => ({
      tex: {
        default: "",
        parseHTML: (e) => e.getAttribute("data-tex") ?? e.textContent ?? "",
        renderHTML: (attrs) => ({ "data-tex": String(attrs["tex"] ?? "") }),
      },
    }),
    parseHTML: () => [
      { tag: `${display ? "div" : "span"}[data-math="${display ? "block" : "inline"}"]` },
    ],
    renderHTML: ({ node, HTMLAttributes }) => [
      display ? "div" : "span",
      mergeAttributes(
        {
          "data-math": display ? "block" : "inline",
          class: display ? "fg-rt-math fg-rt-math-block" : "fg-rt-math",
        },
        HTMLAttributes,
      ),
      String(node.attrs["tex"] ?? ""),
    ],
    renderText: ({ node }) =>
      display
        ? `$$\n${String(node.attrs["tex"] ?? "")}\n$$`
        : `$${String(node.attrs["tex"] ?? "")}$`,
    addInputRules() {
      const type = this.type;
      if (display) {
        return [
          new InputRule({
            find: /^\$\$\s$/,
            handler: ({ chain, range }) => {
              chain()
                .deleteRange(range)
                .insertContent({ type: name, attrs: { tex: "" } })
                .command(({ tr }) => {
                  tr.setSelection(NodeSelection.create(tr.doc, range.from - 1));
                  return true;
                })
                .run();
            },
          }),
        ];
      }
      return [
        new InputRule({
          find: /(?<![\\$])\$([^\s$](?:[^$\n]*[^\s$\\])?)\$$/,
          handler: ({ state, range, match }) => {
            state.tr.replaceWith(range.from, range.to, type.create({ tex: match[1] ?? "" }));
          },
        }),
      ];
    },
    addNodeView() {
      const options = this.options;
      return ({ node: first, editor, getPos }) => {
        let node = first;
        const dom = el(
          display ? "div" : "span",
          display ? "fg-rt-math fg-rt-math-block" : "fg-rt-math",
        );
        dom.dataset["math"] = display ? "block" : "inline";
        dom.contentEditable = "false";
        const out = el("span", "fg-rt-math-out");
        dom.append(out);

        const versions = new WeakMap<HTMLElement, number>();
        const paint = (
          target: HTMLElement,
          tex: string,
          onError?: (message: string | undefined) => void,
        ) => {
          const mine = (versions.get(target) ?? 0) + 1;
          versions.set(target, mine);
          if (!tex.trim()) {
            target.textContent = "";
            target.classList.add("fg-rt-math-empty");
            onError?.(undefined);
            return;
          }
          target.classList.remove("fg-rt-math-empty");
          const show = (k: Katex) => {
            if (mine !== versions.get(target)) return;
            const result = typeset(k, tex, display, options);
            if ("html" in result) {
              target.innerHTML = result.html;
              target.classList.remove("fg-rt-math-error");
              target.removeAttribute("title");
              onError?.(undefined);
            } else {
              // The source stays visible so the formula is not lost.
              target.textContent = tex;
              target.classList.add("fg-rt-math-error");
              target.title = result.error;
              onError?.(result.error);
            }
          };
          if (katex) show(katex);
          else {
            target.textContent = tex;
            void loadKatex().then(show, () => undefined);
          }
        };
        const draw = () => paint(out, String(node.attrs["tex"] ?? ""));
        draw();

        /* ---------------------------------------------- the inline editor */
        let panel: HTMLElement | undefined;
        let area: HTMLTextAreaElement | undefined;
        let preview: HTMLElement | undefined;
        let note: HTMLElement | undefined;

        // `after`: the caret goes behind the formula (Enter). Otherwise the formula was left (a
        // click elsewhere), which ProseMirror reports in the middle of an update: write afterwards.
        const commit = (after: boolean) => {
          if (!panel || !area) return;
          const tex = area.value.trim();
          close();
          const write = () => {
            const pos = getPos();
            if (pos === undefined) return;
            const { view } = editor;
            let tr = view.state.tr;
            if (tex !== String(node.attrs["tex"] ?? "")) {
              tr = tr.setNodeMarkup(pos, undefined, { tex });
            }
            if (after) {
              const end = Math.min(pos + node.nodeSize, tr.doc.content.size);
              tr = tr.setSelection(Selection.near(tr.doc.resolve(end), 1));
            }
            if (tr.docChanged || after) view.dispatch(tr);
            if (after) view.focus();
          };
          if (after) write();
          else queueMicrotask(write);
        };
        const cancel = () => {
          close();
          const pos = getPos();
          if (pos === undefined) return;
          const { view } = editor;
          const end = Math.min(pos + node.nodeSize, view.state.doc.content.size);
          view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(end), 1)));
          view.focus();
        };
        function close() {
          panel?.remove();
          panel = area = preview = note = undefined;
          dom.classList.remove("fg-rt-math-open");
        }
        const open = () => {
          if (panel || !editor.isEditable) return;
          panel = el("div", "fg-rt-math-edit");
          panel.setAttribute("role", "group");
          panel.setAttribute("aria-label", "Edit formula");
          area = el("textarea", "fg-rt-math-input");
          area.rows = display ? 4 : 2;
          area.spellcheck = false;
          area.value = String(node.attrs["tex"] ?? "");
          area.setAttribute("aria-label", "LaTeX");
          area.placeholder = "LaTeX, for example x^2 + y^2 = z^2";
          preview = el("div", "fg-rt-math-preview");
          preview.setAttribute("aria-live", "polite");
          note = el("div", "fg-rt-math-note");
          note.setAttribute("role", "alert");
          note.hidden = true;
          const hint = el("div", "fg-rt-math-hint");
          hint.textContent = display
            ? "Ctrl+Enter applies, Esc cancels"
            : "Enter applies, Esc cancels";
          panel.append(area, preview, note, hint);
          dom.append(panel);
          dom.classList.add("fg-rt-math-open");
          const refresh = () => {
            if (!area || !preview || !note) return;
            const message = (text: string | undefined) => {
              if (!note) return;
              note.hidden = !text;
              note.textContent = text ?? "";
              area?.setAttribute("aria-invalid", text ? "true" : "false");
            };
            paint(preview, area.value, message);
          };
          area.addEventListener("input", refresh);
          area.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancel();
            } else if (event.key === "Enter" && (!display || event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              commit(true);
            }
          });
          refresh();
          requestAnimationFrame(() => area?.focus());
        };

        return {
          dom,
          update(next) {
            if (next.type !== node.type) return false;
            node = next;
            draw();
            return true;
          },
          selectNode() {
            dom.classList.add("ProseMirror-selectednode");
            open();
          },
          deselectNode() {
            dom.classList.remove("ProseMirror-selectednode");
            if (panel) commit(false);
          },
          stopEvent: (event) => !!panel && panel.contains(event.target as globalThis.Node),
          ignoreMutation: () => true,
          destroy: close,
        };
      };
    },
  });
}

const MathInline = mathNode("mathInline", false);
const MathBlock = mathNode("mathBlock", true);

export const math = defineEditorPlugin({
  core: mathCore,
  extensions: (ctx) => {
    const options = ctx.option<MathEditorOptions>("math") ?? {};
    return [MathInline.configure(options), MathBlock.configure(options)];
  },
  blocks: {
    "math-block": {
      apply: ({ editor, range }) => {
        const from = range?.from ?? editor.state.selection.from;
        startChain(editor, range)
          .insertContent({ type: "mathBlock", attrs: { tex: "" } })
          .run();
        // Open the editor on the new formula.
        let at: number | undefined;
        editor.state.doc.nodesBetween(Math.max(0, from - 2), from + 2, (n, pos) => {
          if (at === undefined && n.type.name === "mathBlock" && !n.attrs["tex"]) at = pos;
        });
        if (at !== undefined) editor.commands.setNodeSelection(at);
      },
      isActive: (editor) => editor.isActive("mathBlock"),
    },
  },
});
