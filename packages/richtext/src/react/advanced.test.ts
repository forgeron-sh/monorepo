// @vitest-environment jsdom
// The advanced content plugins in a real editor (jsdom): code highlighting that loads lazily, the
// language selector, formulas and their inline editor, footnotes and their numbers, collaboration.
import type { Editor } from "@tiptap/core";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type RichDoc, type RichNode, doc, paragraph, text, toMarkdown } from "../index";
import { fullCorePlugins } from "../plugins/index";
import { advancedCorePlugins } from "../plugins/advanced";
import { createMath } from "../plugins/math";
import { createCodeHighlight } from "../plugins/code-highlight";
import { fullEditorPlugins } from "../plugins/editor/index";
import { advancedEditorPlugins } from "../plugins/editor/advanced";
import { loadHighlighter, tokenType } from "../plugins/editor/code-highlight";
import { type LocalPeer, createLocalSync, fromYDoc } from "../collab/index";
import { applyBlock } from "../tiptap/commands";
import { RichTextEditor, RichTextView } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// A grammar is imported the first time a block of its language is on the page, not before.
const imported = vi.hoisted(() => ({ rust: 0, python: 0 }));
vi.mock("highlight.js/lib/languages/rust", async (original) => {
  imported.rust++;
  return await original();
});
vi.mock("highlight.js/lib/languages/python", async (original) => {
  imported.python++;
  return await original();
});

const plugins = [...fullEditorPlugins, ...advancedEditorPlugins];
const cores = [...fullCorePlugins, ...advancedCorePlugins];

let hosts: HTMLElement[] = [];
let roots: Array<ReturnType<typeof createRoot>> = [];

beforeEach(() => {
  const rect = {
    x: 0,
    y: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  };
  Range.prototype.getBoundingClientRect = () => rect as DOMRect;
  Range.prototype.getClientRects = () =>
    ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: [][Symbol.iterator],
    }) as unknown as DOMRectList;
  document.elementFromPoint = () => null;
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q }));
});
afterEach(async () => {
  for (const r of roots) await act(async () => r.unmount());
  for (const el of hosts) el.remove();
  hosts = [];
  roots = [];
  vi.unstubAllGlobals();
});

async function mount(props: Record<string, unknown> = {}) {
  const el = document.createElement("div");
  document.body.append(el);
  const root = createRoot(el);
  hosts.push(el);
  roots.push(root);
  let editor: Editor | undefined;
  await act(async () =>
    root.render(h(RichTextEditor, { plugins, ...props, onReady: (e: Editor) => (editor = e) })),
  );
  for (let i = 0; i < 5 && !editor; i++) {
    await act(async () => new Promise((r) => setTimeout(r, 10)));
  }
  if (!editor) throw new Error("editor not created");
  return { editor, el, root };
}

const json = (editor: Editor) => editor.getJSON() as RichDoc;
const settle = (ms = 20) => act(async () => new Promise((r) => setTimeout(r, ms)));
const until = async (check: () => unknown, tries = 60) => {
  for (let i = 0; i < tries; i++) {
    if (check()) return;
    await settle(25);
  }
  expect(check()).toBeTruthy();
};

/** A key pressed in the editor: the first plugin that handles it wins, as in a browser. */
const press = (editor: Editor, key: string) =>
  editor.view.someProp("handleKeyDown", (f) =>
    f(editor.view, new KeyboardEvent("keydown", { key })),
  );

const code = (language: string | null, body: string): RichNode => ({
  type: "codeBlock",
  ...(language ? { attrs: { language } } : {}),
  content: [text(body)],
});

describe("code highlighting in the editor", () => {
  it("loads a grammar on first use and colours, without touching the document", async () => {
    const start = doc(code("rust", "fn main() { let x = 1; }"), paragraph("after"));
    expect(imported.rust).toBe(0);
    const { editor, el } = await mount({ defaultValue: start });
    // The block is in the page at once, plain, until the grammar arrives.
    expect(el.querySelector("pre code")?.textContent).toBe("fn main() { let x = 1; }");
    await until(() => el.querySelector(".fg-rt-tok-keyword"));
    expect(imported.rust).toBe(1);
    expect(el.querySelector(".fg-rt-tok-keyword")?.textContent).toBe("fn");
    expect(el.querySelector("pre code")?.textContent).toBe("fn main() { let x = 1; }");
    // Not Python's grammar: only the language of the block was fetched.
    expect(imported.python).toBe(0);
    expect(editor.getJSON().content?.[0]).toEqual(start.content[0]);
  });

  it("colours what is typed and recolours after an edit", async () => {
    const { editor, el } = await mount({ defaultValue: doc(code("rust", "let a = 1;")) });
    await until(() => el.querySelector(".fg-rt-tok-number"));
    await act(async () => {
      editor.chain().focus().setTextSelection(11).insertContent(" let b = 2;").run();
    });
    expect(el.querySelectorAll(".fg-rt-tok-number").length).toBe(2);
  });

  it("has a language selector that changes the attribute and the colours", async () => {
    const { editor, el } = await mount({ defaultValue: doc(code("rust", "x = 1")) });
    const select = el.querySelector<HTMLSelectElement>("select.fg-rt-lang");
    expect(select?.value).toBe("rust");
    expect(select?.getAttribute("aria-label")).toBe("Code language");
    expect(imported.python).toBe(0);
    await act(async () => {
      if (!select) return;
      select.value = "python";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(editor.getJSON().content?.[0]?.attrs?.["language"]).toBe("python");
    expect(toMarkdown(editor.getJSON() as RichDoc, cores).trimEnd()).toBe("```python\nx = 1\n```");
    await until(() => imported.python === 1);
    // The block under the selector is the same one; Plain text takes the attribute away.
    const again = el.querySelector<HTMLSelectElement>("select.fg-rt-lang");
    expect(again?.value).toBe("python");
    await act(async () => {
      if (!again) return;
      again.value = "";
      again.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(editor.getJSON().content?.[0]?.attrs?.["language"] ?? null).toBeNull();
    expect(el.querySelector('[class*="fg-rt-tok-"]')).toBeNull();
  });

  it("knows a language by its other names and keeps one it does not know", async () => {
    const { el } = await mount({
      defaultValue: doc(code("py", "a = 1"), code("klingon", "qapla")),
    });
    const selects = el.querySelectorAll<HTMLSelectElement>("select.fg-rt-lang");
    expect(selects[0]?.value).toBe("python");
    expect(selects[1]?.value).toBe("klingon");
  });

  it("shows a label, not a selector, when the editor is read-only", async () => {
    const { el } = await mount({ defaultValue: doc(code("json", "{}")), editable: false });
    expect(el.querySelector("select.fg-rt-lang")).toBeNull();
    expect(el.querySelector(".fg-rt-lang-label")?.textContent).toBe("JSON");
  });

  it("takes its options from pluginOptions", async () => {
    const { el } = await mount({
      defaultValue: doc(code("json", "{}")),
      pluginOptions: { codeHighlight: { selector: false, languages: ["json"] } },
    });
    expect(el.querySelector("select.fg-rt-lang")).toBeNull();
  });

  it("maps highlight.js scopes to a few kinds", () => {
    expect(tokenType(["hljs-keyword"])).toBe("keyword");
    expect(tokenType(["hljs-title", "function_"])).toBe("function");
    expect(tokenType(["hljs-title", "class_"])).toBe("type");
    expect(tokenType(["hljs-attr"])).toBe("attr");
    expect(tokenType(["hljs-unheard-of"])).toBeUndefined();
  });

  it("gives a synchronous function for a static view once the grammars are loaded", async () => {
    const highlight = await loadHighlighter(["rust"]);
    const tokens = highlight("let x = 1;", "rust");
    expect(tokens?.map((t) => t.text).join("")).toBe("let x = 1;");
    expect(tokens?.some((t) => t.type === "keyword")).toBe(true);
    expect(highlight("x", "klingon")).toBeUndefined();
    const view = createCodeHighlight({ highlight });
    const { el } = await mount({});
    void el;
    const out = document.createElement("div");
    document.body.append(out);
    hosts.push(out);
    const root = createRoot(out);
    roots.push(root);
    await act(async () =>
      root.render(
        h(RichTextView, {
          value: doc(code("rust", "let x = 1;")),
          plugins: [...fullCorePlugins, view],
        }),
      ),
    );
    expect(out.querySelector(".fg-rt-tok-keyword")?.textContent).toBe("let");
  });
});

describe("formulas in the editor", () => {
  const withMath = doc(paragraph("Area ", { type: "mathInline", attrs: { tex: "x^2" } }, " ok"));

  it("typesets with KaTeX, loaded on first use", async () => {
    const { el } = await mount({ defaultValue: withMath });
    expect(el.querySelector(".fg-rt-math-out")?.textContent).toContain("x^2");
    await until(() => el.querySelector(".fg-rt-math-out .katex"));
    expect(el.querySelector(".katex-mathml")).not.toBeNull();
  });

  it("opens an editor with a live preview and an error state for bad LaTeX", async () => {
    const { editor, el } = await mount({ defaultValue: withMath });
    await until(() => el.querySelector(".fg-rt-math-out .katex"));
    let at = -1;
    editor.state.doc.descendants((n, pos) => {
      if (n.type.name === "mathInline") at = pos;
    });
    await act(async () => void editor.commands.setNodeSelection(at));
    const area = el.querySelector<HTMLTextAreaElement>("textarea.fg-rt-math-input");
    expect(area?.value).toBe("x^2");
    expect(el.querySelector(".fg-rt-math-preview .katex")).not.toBeNull();

    const type = async (value: string) => {
      await act(async () => {
        if (!area) return;
        area.value = value;
        area.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };
    await type("\\frac{a");
    await until(() => !el.querySelector<HTMLElement>(".fg-rt-math-note")?.hidden);
    expect(area?.getAttribute("aria-invalid")).toBe("true");
    expect(el.querySelector(".fg-rt-math-note")?.getAttribute("role")).toBe("alert");
    expect(el.querySelector(".fg-rt-math-note")?.textContent).toMatch(/\S/);
    expect(el.querySelector(".fg-rt-math-preview")?.classList.contains("fg-rt-math-error")).toBe(
      true,
    );

    await type("\\frac{a}{b}");
    await until(() => el.querySelector<HTMLElement>(".fg-rt-math-note")?.hidden);
    expect(area?.getAttribute("aria-invalid")).toBe("false");
    expect(el.querySelector(".fg-rt-math-preview .katex")).not.toBeNull();

    // Enter applies.
    await act(async () => {
      area?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(el.querySelector(".fg-rt-math-edit")).toBeNull();
    expect(json(editor).content[0]?.content?.[1]?.attrs?.["tex"]).toBe("\\frac{a}{b}");
    await until(() => el.querySelector(".fg-rt-math-out")?.textContent?.includes("a"));
  });

  it("keeps a formula that is not valid, with its source and an error style", async () => {
    const { editor, el } = await mount({ defaultValue: withMath });
    let at = -1;
    editor.state.doc.descendants((n, pos) => {
      if (n.type.name === "mathInline") at = pos;
    });
    await act(async () => void editor.commands.setNodeSelection(at));
    const area = el.querySelector<HTMLTextAreaElement>("textarea.fg-rt-math-input");
    await act(async () => {
      if (!area) return;
      area.value = "\\notacommand{";
      area.dispatchEvent(new Event("input", { bubbles: true }));
      area.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(json(editor).content[0]?.content?.[1]?.attrs?.["tex"]).toBe("\\notacommand{");
    await until(() => el.querySelector(".fg-rt-math-out.fg-rt-math-error"));
    expect(el.querySelector(".fg-rt-math-out")?.textContent).toBe("\\notacommand{");
  });

  it("cancels with Escape and leaves the formula as it was", async () => {
    const { editor, el } = await mount({ defaultValue: withMath });
    let at = -1;
    editor.state.doc.descendants((n, pos) => {
      if (n.type.name === "mathInline") at = pos;
    });
    await act(async () => void editor.commands.setNodeSelection(at));
    const area = el.querySelector<HTMLTextAreaElement>("textarea.fg-rt-math-input");
    await act(async () => {
      if (!area) return;
      area.value = "zzz";
      area.dispatchEvent(new Event("input", { bubbles: true }));
      area.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(el.querySelector(".fg-rt-math-edit")).toBeNull();
    expect(json(editor).content[0]?.content?.[1]?.attrs?.["tex"]).toBe("x^2");
  });

  it("inserts a block formula from the slash entry and opens it", async () => {
    const { editor, el } = await mount({ defaultValue: doc(paragraph("start"), paragraph()) });
    await act(async () => {
      editor.commands.focus("end");
    });
    await act(async () => applyBlock(editor, "math-block"));
    expect(editor.getJSON().content?.some((n) => n.type === "mathBlock")).toBe(true);
    await until(() => el.querySelector(".fg-rt-math-block .fg-rt-math-edit"));
    expect(el.querySelector(".fg-rt-math-hint")?.textContent).toContain("Ctrl+Enter");
  });

  it("turns $...$ typed in a paragraph into an inline formula", async () => {
    const { editor } = await mount({ defaultValue: doc(paragraph("cost ")) });
    await act(async () => {
      editor.chain().focus("end").insertContent("$y").run();
    });
    const { from, to } = editor.state.selection;
    await act(async () => {
      editor.view.someProp("handleTextInput", (f) =>
        f(editor.view, from, to, "$", () => editor.state.tr),
      );
    });
    const para = editor.getJSON().content?.[0]?.content ?? [];
    expect(para.at(-1)).toEqual({ type: "mathInline", attrs: { tex: "y" } });
    // A price is not a formula.
    await act(async () => {
      editor.chain().focus("end").insertContent(" and $5 and ").run();
    });
    const at = editor.state.selection;
    await act(async () => {
      editor.view.someProp("handleTextInput", (f) =>
        f(editor.view, at.from, at.to, "$", () => editor.state.tr),
      );
    });
    expect(JSON.stringify(editor.getJSON())).not.toContain('"tex":"5');
  });
});

describe("footnotes in the editor", () => {
  const note = (id: string, body: string): RichNode => ({
    type: "footnote",
    attrs: { id },
    content: [text(body)],
  });
  const start = doc(paragraph("First", note("a", "Alpha")), paragraph("Second", note("b", "Beta")));
  const items = (el: HTMLElement) =>
    [...el.querySelectorAll(".fg-rt-footnotes li")].map((li) => li.textContent);
  const md = (editor: Editor) => toMarkdown(editor.getJSON() as RichDoc, cores);

  it("lists the notes at the foot, in the order of their markers", async () => {
    const { el } = await mount({ defaultValue: start });
    expect(items(el)).toEqual(["Alpha", "Beta"]);
    expect(el.querySelectorAll(".fg-rt-fn-mark")).toHaveLength(2);
  });

  it("renumbers when a footnote is inserted before the others", async () => {
    const { editor, el } = await mount({ defaultValue: start });
    expect(md(editor)).toContain("First[^1]");
    expect(md(editor)).toContain("Second[^2]");
    await act(async () => {
      editor.commands.setTextSelection(1);
    });
    await act(async () => applyBlock(editor, "footnote"));
    // The caret is in the new note, which is open.
    await until(() => el.querySelector(".fg-rt-fn-open"));
    await act(async () => {
      editor.commands.insertContent("Zero");
    });
    expect(items(el)).toEqual(["Zero", "Alpha", "Beta"]);
    const out = md(editor);
    expect(out).toMatch(/^\[\^1\]First\[\^2\]/);
    expect(out).toContain("Second[^3]");
    expect(out.endsWith("[^1]: Zero\n\n[^2]: Alpha\n\n[^3]: Beta")).toBe(true);
  });

  it("opens the note under the caret and closes it when the caret leaves", async () => {
    const { editor, el } = await mount({ defaultValue: start });
    expect(el.querySelector(".fg-rt-fn-open")).toBeNull();
    let at = -1;
    editor.state.doc.descendants((n, pos) => {
      if (n.type.name === "footnote" && at < 0) at = pos;
    });
    await act(async () => void editor.commands.setTextSelection(at + 2));
    expect(el.querySelectorAll(".fg-rt-fn-open")).toHaveLength(1);
    await act(async () => void editor.commands.setTextSelection(1));
    expect(el.querySelector(".fg-rt-fn-open")).toBeNull();
  });

  it("removes a footnote with Backspace in its empty note", async () => {
    const { editor, el } = await mount({ defaultValue: doc(paragraph("a")) });
    await act(async () => editor.commands.focus("end"));
    await act(async () => applyBlock(editor, "footnote"));
    expect(el.querySelectorAll(".fg-rt-fn-mark")).toHaveLength(1);
    await act(async () => void press(editor, "Backspace"));
    expect(el.querySelectorAll(".fg-rt-fn-mark")).toHaveLength(0);
    expect(el.querySelector(".fg-rt-footnotes")).toBeNull();
  });

  it("leaves the note with Enter, the caret behind the marker", async () => {
    const { editor, el } = await mount({ defaultValue: doc(paragraph("a")) });
    await act(async () => editor.commands.focus("end"));
    await act(async () => applyBlock(editor, "footnote"));
    await act(async () => void editor.commands.insertContent("note"));
    await act(async () => void press(editor, "Enter"));
    expect(el.querySelector(".fg-rt-fn-open")).toBeNull();
    expect(editor.state.selection.$from.parent.type.name).toBe("paragraph");
    expect(items(el)).toEqual(["note"]);
  });
});

describe("the static view needs the editor for none of it", () => {
  it("renders formulas typeset by the app, notes at the foot, code as it comes", async () => {
    const value = doc(
      paragraph(
        "E ",
        { type: "mathInline", attrs: { tex: "e" } },
        {
          type: "footnote",
          attrs: { id: "n" },
          content: [text("A note")],
        },
      ),
      code("rust", "fn x() {}"),
    );
    const list = [
      ...fullCorePlugins,
      createMath({ renderMath: (tex) => `<i class="t">${tex}</i>` }),
      ...advancedCorePlugins.slice(2),
    ];
    const out = document.createElement("div");
    document.body.append(out);
    hosts.push(out);
    const root = createRoot(out);
    roots.push(root);
    await act(async () => root.render(h(RichTextView, { value, plugins: list })));
    expect(out.querySelector(".fg-rt-math i.t")?.textContent).toBe("e");
    expect(out.querySelector(".fg-rt-footnotes li")?.textContent).toContain("A note");
    expect(out.querySelector("sup.fg-rt-fn-ref a")?.textContent).toBe("1");
    expect(out.querySelector("pre code")?.textContent).toBe("fn x() {}");
    expect(out.querySelector("select")).toBeNull();
  });
});

describe("collaboration", () => {
  async function peers() {
    const sync = createLocalSync(2);
    const [pa, pb] = sync.peers as [LocalPeer, LocalPeer];
    const a = await mount({
      collaboration: { doc: pa.doc, provider: { awareness: pa.awareness }, user: { name: "Ada" } },
    });
    const b = await mount({
      collaboration: {
        doc: pb.doc,
        provider: { awareness: pb.awareness },
        user: { name: "Grace" },
      },
    });
    return { sync, pa, pb, a: a.editor, b: b.editor };
  }

  it("converges with an inline formula, a block formula, a footnote and a code language", async () => {
    const { sync, pa, pb, a, b } = await peers();
    await act(async () => {
      a.chain()
        .focus()
        .insertContent([
          {
            type: "paragraph",
            content: [text("m "), { type: "mathInline", attrs: { tex: "a+b" } }],
          },
          { type: "mathBlock", attrs: { tex: "\\sum_i i" } },
          {
            type: "paragraph",
            content: [text("f"), { type: "footnote", attrs: { id: "z" }, content: [text("note")] }],
          },
          { type: "codeBlock", attrs: { language: "rust" }, content: [text("fn a() {}")] },
        ])
        .run();
    });
    expect(b.getJSON()).toEqual(a.getJSON());
    const types = JSON.stringify(b.getJSON());
    for (const t of ["mathInline", "mathBlock", "footnote", '"language":"rust"']) {
      expect(types).toContain(t);
    }
    // Concurrent edits: one types in the note, the other changes the language.
    sync.disconnect();
    let at = -1;
    a.state.doc.descendants((n, pos) => {
      if (n.type.name === "footnote") at = pos;
    });
    let codeAt = -1;
    b.state.doc.descendants((n, pos) => {
      if (n.type.name === "codeBlock") codeAt = pos;
    });
    await act(async () => {
      a.chain()
        .setTextSelection(at + 5)
        .insertContent("s")
        .run();
      b.view.dispatch(b.state.tr.setNodeAttribute(codeAt, "language", "python"));
    });
    sync.connect();
    await settle();
    expect(a.getJSON()).toEqual(b.getJSON());
    expect(JSON.stringify(fromYDoc(pa.doc, undefined, plugins))).toBe(
      JSON.stringify(fromYDoc(pb.doc, undefined, plugins)),
    );
    const final = a.getJSON();
    expect(JSON.stringify(final)).toContain("notes");
    expect(JSON.stringify(final)).toContain('"language":"python"');
    expect(toMarkdown(final as RichDoc, cores)).toContain("[^1]: notes");
    sync.destroy();
  });

  it("renumbers the same on both peers when one inserts a footnote first", async () => {
    const { sync, a, b } = await peers();
    await act(async () => {
      a.chain()
        .focus()
        .insertContent([
          {
            type: "paragraph",
            content: [text("one"), { type: "footnote", attrs: { id: "x" }, content: [text("X")] }],
          },
        ])
        .run();
    });
    await act(async () => {
      b.chain().focus("start").setTextSelection(1).run();
      applyBlock(b, "footnote");
    });
    await settle();
    expect(toMarkdown(a.getJSON() as RichDoc, cores)).toBe(
      toMarkdown(b.getJSON() as RichDoc, cores),
    );
    expect(toMarkdown(a.getJSON() as RichDoc, cores)).toContain("one[^2]");
    sync.destroy();
  });
});
