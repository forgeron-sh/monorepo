// The advanced content family, core halves: Markdown round trips, footnote numbering, the maths
// fallback and its `renderMath` hook, and the static view of code with and without a highlighter.
import { describe, expect, it } from "vitest";
import {
  type RichNode,
  doc,
  fromMarkdown,
  normalizeDoc,
  paragraph,
  text,
  toHtml,
  toMarkdown,
  toPlainText,
  toTree,
} from "../index";
import { advancedCorePlugins } from "./advanced";
import { createCodeHighlight, type Highlighter } from "./code-highlight";
import { footnote, footnotesOf } from "./footnote";
import { createMath, math } from "./math";
import { fullCorePlugins } from "./index";
import { advancedDocs } from "./docs/advanced";

const plugins = [...fullCorePlugins, ...advancedCorePlugins];
const roundTrip = (md: string) => toMarkdown(fromMarkdown(md, plugins), plugins);

const note = (id: string, body: string): RichNode => ({
  type: "footnote",
  attrs: { id },
  content: [text(body)],
});

describe("the advanced family is opt-in", () => {
  it("is not in the full preset", () => {
    const ids = fullCorePlugins.map((p) => p.id);
    for (const p of advancedCorePlugins) expect(ids).not.toContain(p.id);
    expect(advancedCorePlugins.map((p) => p.id)).toEqual(["codeHighlight", "math", "footnote"]);
  });

  it("documents each plugin", () => {
    expect(advancedDocs.map((d) => d.id)).toEqual(["codeHighlight", "math", "footnote"]);
    for (const d of advancedDocs) {
      expect(d.usage.length).toBeGreaterThan(20);
      expect(d.notes?.length).toBeGreaterThan(0);
      expect(d.core).toContain("@forgeron/richtext/plugins/");
      expect(d.editor).toContain("@forgeron/richtext/plugins/editor/");
    }
  });
});

describe("math", () => {
  it("reads and writes inline and block formulas", () => {
    const md = "The area is $\\pi r^2$ here.\n\n$$\n\\int_0^1 x\\,dx = \\frac{1}{2}\n$$";
    const d = fromMarkdown(md, plugins);
    expect(d.content[0]?.content?.[1]).toEqual({ type: "mathInline", attrs: { tex: "\\pi r^2" } });
    expect(d.content[1]).toEqual({
      type: "mathBlock",
      attrs: { tex: "\\int_0^1 x\\,dx = \\frac{1}{2}" },
    });
    expect(toMarkdown(d, plugins)).toBe(md);
  });

  it("reads a one-line block formula and a multi-line one", () => {
    expect(fromMarkdown("$$ a = b $$", plugins).content).toEqual([
      { type: "mathBlock", attrs: { tex: "a = b" } },
    ]);
    const multi = fromMarkdown("$$\na &= b \\\\\n  c &= d\n$$", plugins).content[0];
    expect(multi?.attrs?.["tex"]).toBe("a &= b \\\\\n  c &= d");
  });

  it("keeps prices as text", () => {
    const md = "It costs $5 and then $10 more.";
    const d = fromMarkdown(md, plugins);
    expect(d.content[0]?.content).toEqual([text(md)]);
    expect(roundTrip("a $x$ b")).toBe("a $x$ b");
  });

  it("does not turn an unclosed $$ into a formula", () => {
    const d = fromMarkdown("$$\nnot closed", plugins);
    expect(d.content[0]?.type).toBe("paragraph");
  });

  it("falls back to the LaTeX source in a code element", () => {
    const d = doc(paragraph("See ", { type: "mathInline", attrs: { tex: "x^2" } }), {
      type: "mathBlock",
      attrs: { tex: "a<b" },
    });
    const html = toHtml(d, plugins);
    expect(html).toContain(
      '<span class="fg-rt-math" data-math="inline" data-tex="x^2"><code>x^2</code></span>',
    );
    expect(html).toContain("<code>a&lt;b</code>");
  });

  it("gives the plain text as the source", () => {
    const d = doc(paragraph("a ", { type: "mathInline", attrs: { tex: "x^2" } }));
    expect(toPlainText(d, {}, plugins)).toBe("a x^2");
  });

  it("typesets with renderMath, and falls back when it throws", () => {
    const withRender = [
      ...fullCorePlugins,
      createMath({
        renderMath: (tex, display) => {
          if (tex === "bad") throw new Error("nope");
          return `<b data-display="${display}">${tex}</b>`;
        },
      }),
    ];
    const d = doc(
      paragraph({ type: "mathInline", attrs: { tex: "x" } }),
      { type: "mathBlock", attrs: { tex: "y" } },
      paragraph({ type: "mathInline", attrs: { tex: "bad" } }),
    );
    const html = toHtml(d, withRender);
    expect(html).toContain(
      '<span class="fg-rt-math" data-math="inline" data-tex="x"><b data-display="false">x</b></span>',
    );
    expect(html).toContain('<b data-display="true">y</b>');
    expect(html).toContain("fg-rt-math fg-rt-math-error");
    expect(html).toContain("<code>bad</code>");
    // The tree carries the trusted HTML as `html`, so the React view can place it.
    const first = toTree(d, withRender)[0] as { children?: Array<{ html?: string }> };
    expect(first.children?.[0]?.html).toBe('<b data-display="false">x</b>');
  });

  it("offers a Math block entry", () => {
    expect(math.blocks?.map((b) => b.label)).toEqual(["Math block"]);
  });
});

describe("footnote", () => {
  it("round-trips [^1] and [^1]: text", () => {
    const md = "One[^1] and two[^2].\n\n[^1]: First note.\n\n[^2]: Second **bold** note.";
    const d = fromMarkdown(md, plugins);
    const refs = footnotesOf(d);
    expect(refs).toHaveLength(2);
    expect(refs[1]?.content?.[1]).toEqual({
      type: "text",
      text: "bold",
      marks: [{ type: "bold" }],
    });
    expect(toMarkdown(d, plugins)).toBe(md);
  });

  it("reads the label as the id and writes numbers from the order", () => {
    const d = fromMarkdown("A[^b] B[^a].\n\n[^a]: Alpha\n\n[^b]: Beta", plugins);
    expect(footnotesOf(d).map((n) => n.attrs?.["id"])).toEqual(["b", "a"]);
    expect(toMarkdown(d, plugins)).toBe("A[^1] B[^2].\n\n[^1]: Beta\n\n[^2]: Alpha");
  });

  it("numbers by position: inserting one first renumbers the others", () => {
    const before = doc(paragraph("a", note("x", "X"), " b", note("y", "Y")));
    expect(toMarkdown(before, plugins)).toBe("a[^1] b[^2]\n\n[^1]: X\n\n[^2]: Y");
    const after = doc(paragraph(note("n", "New"), "a", note("x", "X"), " b", note("y", "Y")));
    expect(toMarkdown(after, plugins)).toBe("[^1]a[^2] b[^3]\n\n[^1]: New\n\n[^2]: X\n\n[^3]: Y");
    expect(toPlainText(after, {}, plugins)).toBe("[1]a[2] b[3]\n\n[1] New\n[2] X\n[3] Y");
  });

  it("numbers notes across blocks and nested lists in reading order", () => {
    const d = doc(
      paragraph("one", note("a", "A")),
      {
        type: "bulletList",
        content: [{ type: "listItem", content: [paragraph("two", note("b", "B"))] }],
      },
      paragraph("three", note("c", "C")),
    );
    expect(footnotesOf(d).map((n) => n.attrs?.["id"])).toEqual(["a", "b", "c"]);
    expect(toMarkdown(d, plugins)).toContain("two[^2]");
    expect(toMarkdown(d, plugins).endsWith("[^3]: C")).toBe(true);
  });

  it("renders the notes at the foot of the static view", () => {
    const d = doc(paragraph("a", note("x", "First"), " b", note("y", "Second")));
    const html = toHtml(d, plugins);
    expect(html).toContain('<sup class="fg-rt-fn-ref" id="fnref-1"><a href="#fn-1">1</a></sup>');
    expect(html).toContain('<sup class="fg-rt-fn-ref" id="fnref-2"><a href="#fn-2">2</a></sup>');
    const section = html.slice(html.indexOf('<section class="fg-rt-footnotes"'));
    expect(section.indexOf("First")).toBeLessThan(section.indexOf("Second"));
    expect(section).toContain('<li id="fn-1" data-footnote="x">First');
    // No footnote, no section.
    expect(toHtml(doc(paragraph("a")), plugins)).not.toContain("footnotes");
  });

  it("keeps a reference without a definition as text and a lone definition as a paragraph", () => {
    expect(fromMarkdown("see[^z]", plugins).content[0]?.content).toEqual([
      { type: "text", text: "see[^z]" },
    ]);
    const d = fromMarkdown("hello\n\n[^q]: orphan", plugins);
    expect(toMarkdown(d, plugins)).toBe("hello\n\n\\[^q\\]: orphan");
    expect(footnotesOf(d)).toHaveLength(0);
  });

  it("normalises like any document and offers a Footnote entry", () => {
    const d = doc(paragraph("a", note("x", "X")));
    expect(normalizeDoc(d, plugins)).toEqual(d);
    expect(footnote.blocks?.map((b) => b.label)).toEqual(["Footnote"]);
  });
});

describe("code highlight, static view", () => {
  const code = doc({
    type: "codeBlock",
    attrs: { language: "ts" },
    content: [text("const a = 1;")],
  });
  const tokens: Highlighter = (source, language) =>
    language === "ts" ? [{ text: "const", type: "keyword" }, { text: source.slice(5) }] : undefined;

  it("renders plain without a highlighter", () => {
    expect(toHtml(code, plugins)).toBe(
      '<pre class="fg-rt-code"><code data-language="ts">const a = 1;</code></pre>',
    );
  });

  it("colours with the function the app gives", () => {
    const list = [...fullCorePlugins, createCodeHighlight({ highlight: tokens })];
    expect(toHtml(code, list)).toBe(
      '<pre class="fg-rt-code"><code data-language="ts"><span class="fg-rt-tok-keyword">const</span> a = 1;</code></pre>',
    );
  });

  it("stays plain for an unknown language, a throwing highlighter and a block without language", () => {
    const list = [
      ...fullCorePlugins,
      createCodeHighlight({
        highlight: (_c, l) => {
          if (l === "boom") throw new Error("x");
          return undefined;
        },
      }),
    ];
    const plain = doc(
      { type: "codeBlock", attrs: { language: "boom" }, content: [text("x")] },
      { type: "codeBlock", attrs: { language: "zz" }, content: [text("y")] },
      { type: "codeBlock", content: [text("z")] },
    );
    const html = toHtml(plain, list);
    expect(html).toContain(">x</code>");
    expect(html).toContain(">y</code>");
    expect(html).toContain("<code>z</code>");
  });

  it("colours code nested in other blocks and keeps the Markdown fence", () => {
    const list = [...fullCorePlugins, createCodeHighlight({ highlight: tokens })];
    const nested = doc({
      type: "blockquote",
      content: [code.content[0] as RichNode],
    });
    expect(toHtml(nested, list)).toContain("fg-rt-tok-keyword");
    expect(toMarkdown(code, plugins)).toBe("```ts\nconst a = 1;\n```");
  });

  it("requires the code block plugin", () => {
    expect(createCodeHighlight().requires).toEqual(["codeBlock"]);
  });
});
