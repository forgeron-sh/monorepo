// Code highlighting, editor half: colours the text of every code block with decorations (the
// document is never touched) and puts a language selector on the block. The engine is lowlight
// (highlight.js, BSD-3), loaded on first use, and each grammar is its own dynamic import, fetched
// the first time a block of that language is on the page. Nothing here is imported at the top
// level except ProseMirror: a page without a code block downloads no highlighter.

import { Extension } from "@tiptap/core";
import type { LanguageFn } from "highlight.js";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import {
  type CodeHighlightOptions,
  type HighlightToken,
  type Highlighter,
  codeHighlight as codeHighlightCore,
  tokenClass,
} from "../code-highlight";
import { defineEditorPlugin } from "../../tiptap/plugin";

/** A language the editor can colour: its id, its name in the selector, other names for it. */
export interface LanguageDef {
  id: string;
  label: string;
  aliases: readonly string[];
}

type Grammar = () => Promise<{ default: LanguageFn }>;

// One literal import per grammar: the bundler makes a chunk of each, loaded when first needed.
const GRAMMARS: Record<string, Grammar> = {
  bash: () => import("highlight.js/lib/languages/bash"),
  c: () => import("highlight.js/lib/languages/c"),
  cpp: () => import("highlight.js/lib/languages/cpp"),
  csharp: () => import("highlight.js/lib/languages/csharp"),
  css: () => import("highlight.js/lib/languages/css"),
  diff: () => import("highlight.js/lib/languages/diff"),
  dockerfile: () => import("highlight.js/lib/languages/dockerfile"),
  go: () => import("highlight.js/lib/languages/go"),
  graphql: () => import("highlight.js/lib/languages/graphql"),
  ini: () => import("highlight.js/lib/languages/ini"),
  java: () => import("highlight.js/lib/languages/java"),
  javascript: () => import("highlight.js/lib/languages/javascript"),
  json: () => import("highlight.js/lib/languages/json"),
  kotlin: () => import("highlight.js/lib/languages/kotlin"),
  lua: () => import("highlight.js/lib/languages/lua"),
  markdown: () => import("highlight.js/lib/languages/markdown"),
  php: () => import("highlight.js/lib/languages/php"),
  python: () => import("highlight.js/lib/languages/python"),
  ruby: () => import("highlight.js/lib/languages/ruby"),
  rust: () => import("highlight.js/lib/languages/rust"),
  scss: () => import("highlight.js/lib/languages/scss"),
  sql: () => import("highlight.js/lib/languages/sql"),
  swift: () => import("highlight.js/lib/languages/swift"),
  typescript: () => import("highlight.js/lib/languages/typescript"),
  xml: () => import("highlight.js/lib/languages/xml"),
  yaml: () => import("highlight.js/lib/languages/yaml"),
};

/** The languages of the selector, in the order it lists them. */
export const LANGUAGES: ReadonlyArray<LanguageDef> = [
  { id: "bash", label: "Shell", aliases: ["sh", "shell", "zsh", "console"] },
  { id: "c", label: "C", aliases: ["h"] },
  { id: "cpp", label: "C++", aliases: ["c++", "cc", "hpp"] },
  { id: "csharp", label: "C#", aliases: ["cs", "c#"] },
  { id: "css", label: "CSS", aliases: [] },
  { id: "diff", label: "Diff", aliases: ["patch"] },
  { id: "dockerfile", label: "Dockerfile", aliases: ["docker"] },
  { id: "go", label: "Go", aliases: ["golang"] },
  { id: "graphql", label: "GraphQL", aliases: ["gql"] },
  { id: "xml", label: "HTML / XML", aliases: ["html", "svg", "xhtml"] },
  { id: "ini", label: "INI / TOML", aliases: ["toml"] },
  { id: "java", label: "Java", aliases: [] },
  { id: "javascript", label: "JavaScript", aliases: ["js", "jsx", "mjs", "cjs"] },
  { id: "json", label: "JSON", aliases: ["jsonc", "json5"] },
  { id: "kotlin", label: "Kotlin", aliases: ["kt"] },
  { id: "lua", label: "Lua", aliases: [] },
  { id: "markdown", label: "Markdown", aliases: ["md"] },
  { id: "php", label: "PHP", aliases: [] },
  { id: "python", label: "Python", aliases: ["py"] },
  { id: "ruby", label: "Ruby", aliases: ["rb"] },
  { id: "rust", label: "Rust", aliases: ["rs"] },
  { id: "scss", label: "SCSS", aliases: ["sass"] },
  { id: "sql", label: "SQL", aliases: [] },
  { id: "swift", label: "Swift", aliases: [] },
  { id: "typescript", label: "TypeScript", aliases: ["ts", "tsx", "mts", "cts"] },
  { id: "yaml", label: "YAML", aliases: ["yml"] },
];

const BY_NAME = new Map<string, string>();
for (const lang of LANGUAGES) {
  BY_NAME.set(lang.id, lang.id);
  for (const alias of lang.aliases) BY_NAME.set(alias, lang.id);
}

/** The id of a language from any of its names (`js` is `javascript`); `undefined` when unknown. */
export const languageId = (name: string | null | undefined): string | undefined =>
  name ? BY_NAME.get(name.trim().toLowerCase()) : undefined;

/* ------------------------------------------------------------------ The lazy engine */

interface Lowlight {
  highlight(language: string, code: string): { children: HastNode[] };
  register(grammars: Record<string, LanguageFn>): void;
  registered(name: string): boolean;
}
interface HastNode {
  type: string;
  value?: string;
  properties?: { className?: string[] };
  children?: HastNode[];
}

let engine: Promise<Lowlight> | undefined;
let engineReady: Lowlight | undefined;
const loading = new Map<string, Promise<boolean>>();
const loaded = new Set<string>();

function lowlight(): Promise<Lowlight> {
  engine ??= import("lowlight").then((m) => m.createLowlight() as unknown as Lowlight);
  return engine;
}

/** Loads the engine and the grammar of a language (once). `false` when the language is unknown. */
export function loadLanguage(name: string): Promise<boolean> {
  const id = languageId(name);
  const grammar = id ? GRAMMARS[id] : undefined;
  if (!id || !grammar) return Promise.resolve(false);
  let pending = loading.get(id);
  if (!pending) {
    pending = Promise.all([lowlight(), grammar()])
      .then(([low, mod]) => {
        low.register({ [id]: mod.default });
        engineReady = low;
        loaded.add(id);
        return true;
      })
      .catch(() => {
        // Offline or blocked chunk: the block stays plain, and a later edit tries again.
        loading.delete(id);
        return false;
      });
    loading.set(id, pending);
  }
  return pending;
}

/** Maps what highlight.js calls a scope to one of the kinds the stylesheet colours. */
export function tokenType(classNames: readonly string[]): string | undefined {
  const names = classNames.map((c) => c.replace(/^hljs-/, ""));
  const first = names[0];
  if (!first) return undefined;
  const second = names[1];
  switch (first) {
    case "keyword":
    case "selector-tag":
    case "doctag":
      return first === "doctag" ? "comment" : "keyword";
    case "built_in":
    case "title":
      return second === "class_" || second === "class" ? "type" : "function";
    case "type":
    case "class":
      return "type";
    case "string":
    case "regexp":
    case "symbol":
    case "template-tag":
    case "bullet":
    case "link":
      return "string";
    case "number":
      return "number";
    case "literal":
      return "literal";
    case "comment":
    case "quote":
      return "comment";
    case "variable":
    case "params":
    case "template-variable":
      return "variable";
    case "attr":
    case "attribute":
    case "property":
    case "selector-attr":
    case "selector-class":
    case "selector-id":
    case "selector-pseudo":
      return "attr";
    case "tag":
    case "name":
    case "section":
      return "tag";
    case "operator":
      return "operator";
    case "punctuation":
      return "punctuation";
    case "meta":
    case "meta-keyword":
    case "meta-string":
      return "meta";
    case "addition":
      return "addition";
    case "deletion":
      return "deletion";
    default:
      return undefined;
  }
}

function flatten(nodes: HastNode[], inherited: string | undefined, out: HighlightToken[]) {
  for (const node of nodes) {
    if (node.type === "text") {
      const text = node.value ?? "";
      if (!text) continue;
      const last = out[out.length - 1];
      if (last && last.type === inherited) last.text += text;
      else out.push(inherited ? { text, type: inherited } : { text });
    } else if (node.type === "element") {
      const own = tokenType(node.properties?.className ?? []) ?? inherited;
      flatten(node.children ?? [], own, out);
    }
  }
}

/** Colours code with the grammars loaded so far; `undefined` when the language is not loaded. */
export const highlightLoaded: Highlighter = (code, language) => {
  const id = languageId(language);
  if (!id || !loaded.has(id) || !engineReady) return undefined;
  try {
    const tokens: HighlightToken[] = [];
    flatten(engineReady.highlight(id, code).children, undefined, tokens);
    return tokens;
  } catch {
    return undefined;
  }
};

/**
 * A synchronous `highlight` function for the static view, once the grammars of `languages` are
 * loaded (all of them by default): `createCodeHighlight({ highlight: await loadHighlighter(["ts"]) })`.
 */
export async function loadHighlighter(languages?: ReadonlyArray<string>): Promise<Highlighter> {
  const wanted = languages ?? LANGUAGES.map((l) => l.id);
  await Promise.all(wanted.map(loadLanguage));
  return highlightLoaded;
}

/* ------------------------------------------------------------------ The decorations */

/** What `pluginOptions.codeHighlight` takes. */
export interface CodeHighlightEditorOptions {
  /** Languages offered by the selector and coloured. Default: all of `LANGUAGES`. */
  languages?: ReadonlyArray<string>;
  /** A block longer than this many characters stays plain (the colouring is per keystroke). Default 20000. */
  maxLength?: number;
  /** Show the language selector on each block. Default `true`. */
  selector?: boolean;
}

const key = new PluginKey<State>("fgCodeHighlight");

interface State {
  decorations: DecorationSet;
  /** Languages of the blocks that are not loaded yet. */
  missing: ReadonlySet<string>;
}

// Tokens are cached by node: ProseMirror reuses a node object until it changes.
const cache = new WeakMap<
  PMNode,
  { language: string; tokens: ReadonlyArray<HighlightToken> | undefined }
>();

function tokensOf(node: PMNode, language: string, maxLength: number) {
  const hit = cache.get(node);
  if (hit && hit.language === language) return hit.tokens;
  const text = node.textContent;
  const tokens = text.length > maxLength ? undefined : highlightLoaded(text, language);
  if (tokens) cache.set(node, { language, tokens });
  return tokens;
}

function selector(
  view: EditorView,
  getPos: () => number | undefined,
  current: string | null,
  ids: ReadonlyArray<string>,
  editable: boolean,
): HTMLElement {
  const slot = document.createElement("div");
  slot.className = "fg-rt-lang-slot";
  slot.contentEditable = "false";
  const known = languageId(current);
  const canonical = known ?? current ?? "";
  if (!editable) {
    if (canonical) {
      const label = document.createElement("span");
      label.className = "fg-rt-lang fg-rt-lang-label";
      label.textContent = LANGUAGES.find((l) => l.id === known)?.label ?? canonical;
      slot.append(label);
    }
    return slot;
  }
  const select = document.createElement("select");
  select.className = "fg-rt-lang";
  select.setAttribute("aria-label", "Code language");
  const add = (value: string, label: string) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  };
  add("", "Plain text");
  for (const lang of LANGUAGES) if (ids.includes(lang.id)) add(lang.id, lang.label);
  // A language of the document that the list does not know stays selectable as it is written.
  if (canonical && !select.querySelector(`option[value="${CSS.escape(canonical)}"]`)) {
    add(canonical, canonical);
  }
  select.value = canonical;
  select.addEventListener("change", () => {
    const pos = getPos();
    if (pos === undefined) return;
    const value = select.value;
    view.dispatch(view.state.tr.setNodeAttribute(pos, "language", value || null));
    view.focus();
  });
  slot.append(select);
  return slot;
}

function build(
  doc: PMNode,
  options: Required<CodeHighlightEditorOptions>,
  editable: boolean,
): State {
  const decorations: Decoration[] = [];
  const missing = new Set<string>();
  doc.descendants((node, pos) => {
    if (node.type.name !== "codeBlock") return;
    const language = node.attrs["language"] as string | null;
    const id = languageId(language);
    if (options.selector) {
      decorations.push(
        Decoration.widget(
          pos,
          (v, getPos) =>
            selector(
              v,
              () => {
                const p = getPos();
                return typeof p === "number" ? p : undefined;
              },
              language,
              options.languages as string[],
              editable,
            ),
          {
            side: -1,
            key: `lang:${id ?? language ?? ""}:${editable}`,
            stopEvent: () => true,
            ignoreSelection: true,
          },
        ),
      );
    }
    if (id && options.languages.includes(id)) {
      if (!loaded.has(id)) missing.add(id);
      else {
        const tokens = tokensOf(node, id, options.maxLength);
        let at = pos + 1;
        for (const token of tokens ?? []) {
          const end = at + token.text.length;
          if (token.type) {
            decorations.push(Decoration.inline(at, end, { class: tokenClass(token.type) }));
          }
          at = end;
        }
      }
    }
    return false;
  });
  return { decorations: DecorationSet.create(doc, decorations), missing };
}

const CodeHighlight = Extension.create<CodeHighlightEditorOptions>({
  name: "codeHighlight",
  addOptions: () => ({}),
  addProseMirrorPlugins() {
    const editor = this.editor;
    const options: Required<CodeHighlightEditorOptions> = {
      languages: this.options.languages ?? LANGUAGES.map((l) => l.id),
      maxLength: this.options.maxLength ?? 20000,
      selector: this.options.selector ?? true,
    };
    return [
      new Plugin<State>({
        key,
        state: {
          init: (_, { doc }) => build(doc, options, editor.isEditable),
          apply(tr, old, _prev, next) {
            if (!tr.docChanged && !tr.getMeta(key)) return old;
            return build(next.doc, options, editor.isEditable);
          },
        },
        props: { decorations: (state) => key.getState(state)?.decorations ?? null },
        view(view) {
          let editable = view.editable;
          let destroyed = false;
          const sync = () => {
            const missing = key.getState(view.state)?.missing;
            if (!missing?.size) return;
            for (const id of missing) {
              void loadLanguage(id).then((ok) => {
                if (ok && !destroyed) view.dispatch(view.state.tr.setMeta(key, true));
              });
            }
          };
          sync();
          return {
            update(v) {
              if (v.editable !== editable) {
                editable = v.editable;
                queueMicrotask(() => {
                  if (!destroyed) v.dispatch(v.state.tr.setMeta(key, true));
                });
              }
              sync();
            },
            destroy() {
              destroyed = true;
            },
          };
        },
      }),
    ];
  },
});

export const codeHighlight = defineEditorPlugin({
  core: codeHighlightCore,
  extensions: (ctx) => [
    CodeHighlight.configure(ctx.option<CodeHighlightEditorOptions>("codeHighlight") ?? {}),
  ],
});

export type { CodeHighlightOptions };
