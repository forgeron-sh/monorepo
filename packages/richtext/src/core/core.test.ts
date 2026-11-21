import { describe, expect, it } from "vitest";
import {
  BLOCKS,
  blocksFor,
  doc,
  emptyDoc,
  filterBlocks,
  filterMentions,
  fromMarkdown,
  heading,
  isEmptyDoc,
  link,
  normalizeDoc,
  paragraph,
  parseDoc,
  safeUrl,
  text,
  toHtml,
  toMarkdown,
  toPlainText,
  toTree,
  type RichDoc,
  type RichNode,
} from "../index";

const bullet = (...items: RichNode[][]): RichNode => ({
  type: "bulletList",
  content: items.map((content) => ({ type: "listItem", content })),
});
const task = (checked: boolean, ...content: RichNode[]): RichNode => ({
  type: "taskItem",
  attrs: { checked },
  content,
});

const sample: RichDoc = doc(
  heading(1, "Release notes"),
  paragraph(
    "Plain, ",
    text("bold", "bold"),
    " ",
    text("italic", "italic"),
    " ",
    text("both", "bold", "italic"),
    " ",
    text("gone", "strike"),
    " ",
    text("under", "underline"),
    " ",
    text("x = 1", "code"),
    " and ",
    link("a link", "https://example.com/a_(b)"),
    ".",
  ),
  heading(2, "Lists"),
  bullet(
    [paragraph("one"), bullet([paragraph("nested a")], [paragraph("nested b")])],
    [paragraph("two")],
  ),
  {
    type: "orderedList",
    attrs: { start: 3 },
    content: [
      { type: "listItem", content: [paragraph("third")] },
      { type: "listItem", content: [paragraph("fourth")] },
    ],
  },
  {
    type: "taskList",
    content: [task(true, paragraph("done")), task(false, paragraph("to do"))],
  },
  { type: "blockquote", content: [paragraph("quoted ", text("text", "bold"))] },
  {
    type: "codeBlock",
    attrs: { language: "ts" },
    content: [{ type: "text", text: "const a = 1;\n\nconst b = `x`;" }],
  },
  { type: "horizontalRule" },
  {
    type: "table",
    content: [
      {
        type: "tableRow",
        content: [
          { type: "tableHeader", content: [paragraph("Name")] },
          { type: "tableHeader", content: [paragraph("Role")] },
        ],
      },
      {
        type: "tableRow",
        content: [
          { type: "tableCell", content: [paragraph("Ada | A")] },
          { type: "tableCell", content: [paragraph(text("lead", "bold"))] },
        ],
      },
    ],
  },
  { type: "image", attrs: { src: "https://example.com/i.png", alt: "A [chart]", title: "Q1" } },
  paragraph("Ping ", { type: "mention", attrs: { id: "u_1", label: "Ada" } }, " please."),
);

describe("model", () => {
  it("normalises marks order, merges text and drops empties", () => {
    const messy: RichDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a", marks: [{ type: "italic" }, { type: "bold" }] },
            { type: "text", text: "b", marks: [{ type: "bold" }, { type: "italic" }] },
            { type: "text", text: "" },
          ],
        },
      ],
    };
    expect(normalizeDoc(messy).content[0]?.content).toEqual([
      { type: "text", text: "ab", marks: [{ type: "bold" }, { type: "italic" }] },
    ]);
  });

  it("reads foreign values without throwing", () => {
    expect(parseDoc(null)).toEqual(emptyDoc());
    expect(parseDoc("{not json")).toEqual(emptyDoc());
    expect(parseDoc(JSON.stringify(sample))).toEqual(normalizeDoc(sample));
    const dirty = parseDoc({
      type: "doc",
      content: [{ type: "script" }, { type: "paragraph", content: [{ type: "text", text: "ok" }] }],
    });
    expect(dirty.content).toHaveLength(1);
  });

  it("knows an empty document", () => {
    expect(isEmptyDoc(emptyDoc())).toBe(true);
    expect(isEmptyDoc(doc(paragraph("x")))).toBe(false);
  });
});

describe("block catalog", () => {
  it("has unique ids and an icon, a group and a label for each", () => {
    const ids = BLOCKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BLOCKS) {
      expect(b.label).toBeTruthy();
      expect(b.icon).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("offers lists and text in the minimal variant, everything in the full one", () => {
    expect(blocksFor("minimal").map((b) => b.id)).toEqual([
      "paragraph",
      "bullet-list",
      "ordered-list",
      "task-list",
    ]);
    expect(blocksFor("full")).toHaveLength(BLOCKS.length);
  });

  it("filters the slash menu: label prefix, label contains, keyword; accents and case ignored", () => {
    const ids = (q: string) => filterBlocks(BLOCKS, q).map((b) => b.id);
    expect(ids("")).toHaveLength(BLOCKS.length);
    expect(ids("head")).toEqual(["heading-1", "heading-2", "heading-3"]);
    expect(ids("H2")).toEqual(["heading-2"]);
    expect(ids("TODO")).toEqual(["task-list"]);
    expect(ids("list")[0]).toBe("bullet-list");
    expect(ids("hr")).toEqual(["divider"]);
    expect(ids("zzz")).toEqual([]);
    expect(ids("tablé")).toEqual(["table"]);
  });

  it("filters mentions by label then hint and caps the list", () => {
    const people = [
      { id: "1", label: "Grace Hopper", hint: "grace@example.com" },
      { id: "2", label: "Ada Lovelace", hint: "ada@example.com" },
      { id: "3", label: "Alan Turing" },
    ];
    expect(filterMentions(people, "a").map((p) => p.id)).toEqual(["2", "3", "1"]);
    expect(filterMentions(people, "grace@").map((p) => p.id)).toEqual(["1"]);
    expect(filterMentions(people, "", 2)).toHaveLength(2);
  });
});

describe("markdown", () => {
  it("round-trips a rich document", () => {
    const md = toMarkdown(sample);
    expect(fromMarkdown(md)).toEqual(normalizeDoc(sample));
    // Writing what was read changes nothing.
    expect(toMarkdown(fromMarkdown(md))).toBe(md);
  });

  it("writes the expected Markdown", () => {
    const md = toMarkdown(
      doc(
        heading(2, "Title"),
        paragraph(text("bold ", "bold"), text("both", "bold", "italic"), " tail"),
        { type: "taskList", content: [task(true, paragraph("x")), task(false, paragraph("y"))] },
      ),
    );
    expect(md).toBe("## Title\n\n**bold *both*** tail\n\n- [x] x\n- [ ] y");
  });

  it("keeps spaces outside the delimiters", () => {
    const md = toMarkdown(doc(paragraph("a", text(" b ", "bold"), "c")));
    expect(md).toBe("a **b** c");
  });

  it("escapes what would read as Markdown", () => {
    const d = doc(
      paragraph("1. not a list *nor* [a](link) <u>"),
      paragraph("# not a heading"),
      paragraph("- no"),
    );
    const md = toMarkdown(d);
    expect(fromMarkdown(md)).toEqual(normalizeDoc(d));
  });

  it("round-trips hard breaks, code with backticks and underscores in words", () => {
    const d = doc(
      paragraph("line one", { type: "hardBreak" }, "line two"),
      paragraph(text("a `tick` b", "code"), " snake_case_name"),
    );
    expect(fromMarkdown(toMarkdown(d))).toEqual(normalizeDoc(d));
  });

  it("reads common Markdown from elsewhere", () => {
    const d = fromMarkdown(
      "# One\n\n#### Four\n\nSome __strong__ and _em_ text\nover two lines.\n\n* a\n* b\n\n1) x\n2) y\n\n***\n\n```js\nlet a;\n```\n\n| A | B |\n|---|:-:|\n| 1 | 2 |",
    );
    const types = d.content.map((n) => n.type);
    expect(types).toEqual([
      "heading",
      "heading",
      "paragraph",
      "bulletList",
      "orderedList",
      "horizontalRule",
      "codeBlock",
      "table",
    ]);
    expect(d.content[1]?.attrs).toEqual({ level: 3 });
    expect(toPlainText(d.content[2] as RichNode)).toBe("Some strong and em text over two lines.");
    expect(d.content[7]?.content?.[0]?.content?.[0]?.type).toBe("tableHeader");
  });

  it("turns text it does not know into plain paragraphs and never throws", () => {
    const d = fromMarkdown("**unclosed and [broken](link\n\n<div>html</div>");
    expect(d.content).toHaveLength(2);
    expect(toPlainText(d)).toContain("unclosed");
    expect(fromMarkdown("").content).toEqual([{ type: "paragraph" }]);
  });

  it("keeps loose lists and multi-paragraph items together", () => {
    const d = doc(bullet([paragraph("a"), paragraph("a2")], [paragraph("b")]), {
      type: "codeBlock",
      content: [{ type: "text", text: "x" }],
    });
    expect(fromMarkdown(toMarkdown(d))).toEqual(normalizeDoc(d));
  });
});

describe("plain text", () => {
  it("puts blocks on lines, writes mentions as @label, cells with tabs", () => {
    expect(toPlainText(sample)).toContain(
      "Release notes\nPlain, bold italic both gone under x = 1 and a link.",
    );
    expect(toPlainText(sample)).toContain("Ping @Ada please.");
    expect(toPlainText(sample)).toContain("Name\tRole");
  });

  it("can be cut", () => {
    expect(toPlainText(doc(paragraph("0123456789")), { maxLength: 5 })).toBe("0123…");
  });
});

describe("static renderer", () => {
  it("renders HTML with marks nested in order", () => {
    const html = toHtml(
      doc(paragraph(text("hi", "bold", "italic"), " ", link("go", "https://a.dev"))),
    );
    expect(html).toBe(
      '<p><strong><em>hi</em></strong> <a href="https://a.dev" rel="noopener noreferrer nofollow">go</a></p>',
    );
  });

  it("renders every block", () => {
    const html = toHtml(sample);
    for (const tag of [
      "<h1>",
      "<ul>",
      '<ol start="3">',
      'data-type="taskItem"',
      "<blockquote>",
      '<pre class="fg-rt-code">',
      "<hr>",
      "<table>",
      "<img",
      'class="fg-rt-mention"',
      "<th>",
    ]) {
      expect(html).toContain(tag);
    }
    expect(html).toContain('<input type="checkbox" disabled checked');
  });

  it("escapes text and drops unsafe URLs", () => {
    const html = toHtml(
      doc(
        paragraph('<script>alert(1)</script> & "q"', link("x", "javascript:alert(1)")),
        { type: "image", attrs: { src: "javascript:alert(1)", alt: "x" } },
        { type: "image", attrs: { src: "https://ok.dev/a.png", alt: "<b>" } },
      ),
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain('alt="&lt;b&gt;"');
  });

  it("checks URL schemes", () => {
    expect(safeUrl("https://a.dev")).toBeDefined();
    expect(safeUrl("mailto:a@b.dev")).toBeDefined();
    expect(safeUrl("/path")).toBe("/path");
    expect(safeUrl("//evil.dev")).toBeUndefined();
    expect(safeUrl("data:text/html;base64,AAA")).toBeUndefined();
    expect(safeUrl("data:image/png;base64,AAA", "image")).toBeDefined();
    expect(safeUrl("data:image/png;base64,AAA", "link")).toBeUndefined();
  });

  it("gives a tree without any DOM", () => {
    const tree = toTree(doc(paragraph("a")));
    expect(tree).toEqual([{ tag: "p", children: ["a"] }]);
  });
});
