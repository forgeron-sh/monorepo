import { describe, expect, it } from "vitest";
import {
  type RichNode,
  createRegistry,
  doc,
  fromMarkdown,
  heading,
  normalizeDoc,
  paragraph,
  toHtml,
  toMarkdown,
  toPlainText,
} from "../index";
import { blockquote } from "./blockquote";
import { callout } from "./callout";
import { columns } from "./columns";
import { core } from "./core";
import { emoji, emojiPicker } from "./emoji";
import { EMOJI } from "./emoji-data";
import { heading as headingPlugin } from "./heading";
import { fullCorePlugins } from "./index";
import { layoutPlugins } from "./layout";
import { bulletList, listItem } from "./lists";
import { bold, italic } from "./marks";
import { slugify, toc, tocEntries, uniqueSlugs } from "./toc";
import { toggle } from "./toggle";

const all = [...fullCorePlugins, ...layoutPlugins];
const note = (tone: string, ...content: RichNode[]): RichNode => ({
  type: "callout",
  attrs: { tone },
  content,
});
const summary = (text: string): RichNode => ({
  type: "toggleSummary",
  content: [{ type: "text", text }],
});
const column = (...content: RichNode[]): RichNode => ({ type: "column", content });
const bullets = (...items: string[]): RichNode => ({
  type: "bulletList",
  content: items.map((t) => ({ type: "listItem", content: [paragraph(t)] })),
});

/** Markdown out and back in: the same document. */
const roundTrip = (page: RichNode, plugins = all) => {
  const md = toMarkdown(page, plugins);
  expect(normalizeDoc(fromMarkdown(md, plugins), plugins)).toEqual(
    normalizeDoc(page as never, plugins),
  );
  return md;
};

describe("the layout family", () => {
  it("is opt-in: none of its plugins is in the full preset, all resolve together", () => {
    const ids = layoutPlugins.map((p) => p.id);
    expect(ids).toEqual(["callout", "toggle", "columns", "toc", "emoji"]);
    for (const id of ids) expect(fullCorePlugins.map((p) => p.id)).not.toContain(id);
    expect(() => createRegistry([core, ...all])).not.toThrow();
  });

  it("adds its slash entries, among the others", () => {
    const labels = createRegistry([core, ...all]).blocks.map((b) => b.label);
    expect(labels).toEqual(
      expect.arrayContaining(["Callout", "Toggle", "2 columns", "3 columns", "Table of contents"]),
    );
  });
});

describe("callout", () => {
  it("is written as a GitHub alert and reads back, for every tone", () => {
    for (const tone of ["note", "info", "success", "warning", "danger"]) {
      const md = roundTrip(doc(note(tone, paragraph("Watch out"))));
      expect(md).toBe(`> [!${tone.toUpperCase()}]\n> Watch out`);
    }
  });

  it("holds rich content: marks, lists, several blocks, a nested callout", () => {
    const page = doc(
      paragraph("Before"),
      note(
        "warning",
        paragraph("Be ", { type: "text", text: "careful", marks: [{ type: "bold" }] }),
        bullets("one", "two"),
        note("info", paragraph("Inner")),
      ),
      paragraph("After"),
    );
    const md = roundTrip(page);
    expect(md).toContain(
      "> [!WARNING]\n> Be **careful**\n>\n> - one\n> - two\n>\n> > [!INFO]\n> > Inner",
    );
  });

  it("keeps an emoji icon after the tag, and reads text after the tag as a paragraph", () => {
    const withIcon = doc({
      type: "callout",
      attrs: { tone: "info", icon: "💡" },
      content: [paragraph("Idea")],
    });
    expect(roundTrip(withIcon)).toBe("> [!INFO] 💡\n> Idea");
    const titled = fromMarkdown("> [!NOTE] Read me\n> Body", all);
    expect(titled.content[0]?.attrs).toEqual({ tone: "note" });
    expect(titled.content[0]?.content?.map((b) => toPlainText(b, {}, all))).toEqual([
      "Read me",
      "Body",
    ]);
  });

  it("reads the other names GitHub uses, and any case", () => {
    expect(fromMarkdown("> [!tip]\n> x", all).content[0]?.attrs?.["tone"]).toBe("success");
    expect(fromMarkdown("> [!IMPORTANT]\n> x", all).content[0]?.attrs?.["tone"]).toBe("info");
    expect(fromMarkdown("> [!Caution]\n> x", all).content[0]?.attrs?.["tone"]).toBe("danger");
  });

  it("degrades to a plain quote without the callout plugin, and still reads without the quote plugin", () => {
    const md = "> [!WARNING]\n> Careful";
    const plain = fromMarkdown(md, fullCorePlugins);
    expect(plain.content[0]?.type).toBe("blockquote");
    expect(toPlainText(plain, {}, fullCorePlugins)).toContain("Careful");

    const alone = [core, callout];
    const read = fromMarkdown(md, alone);
    expect(read.content[0]?.type).toBe("callout");
    expect(toMarkdown(read, alone)).toBe(md);
    // A callout in the JSON of an editor without the plugin is written as the text it holds.
    expect(toMarkdown(doc(note("info", paragraph("Kept"))), fullCorePlugins)).toBe("Kept");
  });

  it("has a static view with the tone, an icon slot and the body", () => {
    const html = toHtml(doc(note("danger", paragraph("Stop"))), all);
    expect(html).toBe(
      '<aside class="fg-rt-callout" data-tone="danger" role="note"><span class="fg-rt-callout-icon" aria-hidden="true"></span><div class="fg-rt-callout-body"><p>Stop</p></div></aside>',
    );
    const emojiHtml = toHtml(
      doc({ type: "callout", attrs: { tone: "note", icon: "🔥" }, content: [paragraph("x")] }),
      all,
    );
    expect(emojiHtml).toContain('aria-hidden="true">🔥</span>');
  });

  it("falls back to the note tone for an unknown or missing tone", () => {
    expect(toHtml(doc({ type: "callout", content: [paragraph("x")] }), all)).toContain(
      'data-tone="note"',
    );
    expect(toMarkdown(doc(note("purple", paragraph("x"))), all)).toBe("> [!NOTE]\n> x");
  });

  it("is not a paragraph's continuation: it interrupts one", () => {
    const read = fromMarkdown("Intro\n> [!INFO]\n> Boxed", all);
    expect(read.content.map((b) => b.type)).toEqual(["paragraph", "callout"]);
  });
});

describe("toggle", () => {
  const closed: RichNode = {
    type: "toggle",
    attrs: { open: false },
    content: [summary("More"), paragraph("Hidden")],
  };

  it("is written as details and summary and reads back, open or closed", () => {
    expect(roundTrip(doc(closed))).toBe(
      "<details>\n<summary>More</summary>\n\nHidden\n\n</details>",
    );
    const open = { ...closed, attrs: { open: true } };
    expect(roundTrip(doc(open))).toBe(
      "<details open>\n<summary>More</summary>\n\nHidden\n\n</details>",
    );
  });

  it("holds several blocks and nested toggles", () => {
    const page = doc(
      {
        type: "toggle",
        attrs: { open: true },
        content: [
          summary("Outer"),
          paragraph("a"),
          bullets("x", "y"),
          {
            type: "toggle",
            attrs: { open: false },
            content: [summary("Inner"), paragraph("deep")],
          },
        ],
      },
      paragraph("after"),
    );
    expect(roundTrip(page)).toContain("<details open>\n<summary>Outer</summary>");
  });

  it("keeps marks in the summary, and a toggle without a body", () => {
    const page = doc({
      type: "toggle",
      attrs: { open: false },
      content: [
        {
          type: "toggleSummary",
          content: [
            { type: "text", text: "Use " },
            { type: "text", text: "this", marks: [{ type: "italic" }] },
          ],
        },
      ],
    });
    expect(roundTrip(page)).toBe("<details>\n<summary>Use *this*</summary>\n</details>");
  });

  it("reads the summary on the opening line, and leaves an unclosed tag as text", () => {
    const read = fromMarkdown("<details open><summary>Hi</summary>\n\nBody\n\n</details>", all);
    expect(read.content[0]).toEqual({
      type: "toggle",
      attrs: { open: true },
      content: [summary("Hi"), paragraph("Body")],
    });
    const broken = fromMarkdown("<details>\n<summary>Hi</summary>\n\nBody", all);
    expect(broken.content.every((b) => b.type !== "toggle")).toBe(true);
    expect(toPlainText(broken, {}, all)).toContain("Body");
  });

  it("degrades to the raw HTML lines without the plugin, and is written as its text without it", () => {
    const md = "<details>\n<summary>More</summary>\n\nHidden\n\n</details>";
    const without = fromMarkdown(md, fullCorePlugins);
    expect(without.content.every((b) => b.type === "paragraph")).toBe(true);
    expect(toMarkdown(doc(closed), fullCorePlugins)).toBe("More\n\nHidden");
  });

  it("has a static view that is a details element", () => {
    expect(toHtml(doc({ ...closed, attrs: { open: true } }), all)).toBe(
      '<details class="fg-rt-toggle" open><summary>More</summary><div class="fg-rt-toggle-body"><p>Hidden</p></div></details>',
    );
    expect(toHtml(doc(closed), all)).not.toContain(" open");
  });

  it("reads plain text as the summary then the blocks", () => {
    expect(toPlainText(doc(closed), {}, all)).toBe("More\nHidden");
  });
});

describe("columns", () => {
  const two = (a: RichNode[], b: RichNode[]): RichNode => ({
    type: "columns",
    content: [column(...a), column(...b)],
  });

  it("is written as the columns one after the other and reads back", () => {
    const md = roundTrip(doc(two([paragraph("Left")], [paragraph("Right")])));
    expect(md).toBe("<!-- columns -->\n\nLeft\n\n<!-- column -->\n\nRight\n\n<!-- /columns -->");
  });

  it("round trips three columns with rich content, an empty one and a following block", () => {
    const page = doc(
      paragraph("Top"),
      {
        type: "columns",
        content: [
          column(heading(2, "A"), bullets("one", "two")),
          column({ type: "paragraph" }),
          column(note("info", paragraph("C"))),
        ],
      },
      paragraph("Bottom"),
    );
    expect(roundTrip(page)).toContain("<!-- column -->");
  });

  it("nests: columns inside a column keep their own columns", () => {
    const inner = two([paragraph("i1")], [paragraph("i2")]);
    expect(roundTrip(doc(two([inner, paragraph("x")], [paragraph("y")])))).toContain(
      "<!-- columns -->\n\ni1",
    );
  });

  it("degrades to the content one after the other without the plugin", () => {
    const page = doc(two([paragraph("Left")], [paragraph("Right")]));
    expect(toMarkdown(page, fullCorePlugins)).toBe("Left\n\nRight");
    expect(toPlainText(page, {}, fullCorePlugins)).toBe("Left\nRight");
    // The markers are comments: a reader without the plugin reads them as text, content kept.
    const md = "<!-- columns -->\n\nLeft\n\n<!-- column -->\n\nRight\n\n<!-- /columns -->";
    expect(toPlainText(fromMarkdown(md, fullCorePlugins), {}, fullCorePlugins)).toContain("Right");
  });

  it("leaves an unclosed marker as text", () => {
    const read = fromMarkdown("<!-- columns -->\n\nLeft", all);
    expect(read.content.every((b) => b.type !== "columns")).toBe(true);
  });

  it("has a static view of a grid in a container", () => {
    const html = toHtml(doc(two([paragraph("L")], [paragraph("R")])), all);
    expect(html).toBe(
      '<div class="fg-rt-columns" data-type="columns"><div class="fg-rt-columns-grid"><div class="fg-rt-column" data-type="column"><p>L</p></div><div class="fg-rt-column" data-type="column"><p>R</p></div></div></div>',
    );
  });
});

describe("table of contents", () => {
  it("makes slugs from the text", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("  Café  au   lait ")).toBe("cafe-au-lait");
    expect(slugify("日本語 の 見出し")).toBe("日本語-の-見出し");
    expect(slugify("???")).toBe("");
  });

  it("makes ids unique, in order, and never takes an id a later heading has", () => {
    expect(uniqueSlugs(["Intro", "Intro", "Intro"])).toEqual(["intro", "intro-1", "intro-2"]);
    expect(uniqueSlugs(["Intro", "Intro", "Intro 1"])).toEqual(["intro", "intro-1", "intro-1-1"]);
    expect(uniqueSlugs(["Intro 1", "Intro", "Intro"])).toEqual(["intro-1", "intro", "intro-2"]);
    expect(uniqueSlugs(["", "  ", "!!"])).toEqual(["", "", "section"]);
    // Deterministic: the same texts, the same ids.
    expect(uniqueSlugs(["A", "A"])).toEqual(uniqueSlugs(["A", "A"]));
  });

  it("lists the headings with text, nested ones too", () => {
    const page = doc(
      heading(1, "Title"),
      { type: "toc" },
      note("info", heading(2, "Inside")),
      { type: "heading", attrs: { level: 2 } },
      heading(3, "Title"),
    );
    expect(tocEntries(page)).toEqual([
      { id: "title", level: 1, text: "Title" },
      { id: "inside", level: 2, text: "Inside" },
      { id: "title-1", level: 3, text: "Title" },
    ]);
  });

  it("is `[TOC]` in Markdown and reads back", () => {
    const page = doc(heading(1, "A"), { type: "toc" }, paragraph("x"));
    expect(roundTrip(page)).toBe("# A\n\n[TOC]\n\nx");
    expect(fromMarkdown("[toc]", all).content).toEqual([{ type: "toc" }]);
  });

  it("is a list of links in the static view, and the headings get the same ids", () => {
    const page = doc(
      { type: "toc" },
      heading(1, "Intro"),
      paragraph("x"),
      heading(2, "Intro"),
      heading(2, "Other"),
    );
    const html = toHtml(page, all);
    expect(html).toContain(
      '<nav class="fg-rt-toc" aria-label="Table of contents"><ul><li data-level="1"><a href="#intro">Intro</a></li><li data-level="2"><a href="#intro-1">Intro</a></li><li data-level="2"><a href="#other">Other</a></li></ul></nav>',
    );
    expect(html).toContain('<h1 id="intro">Intro</h1>');
    expect(html).toContain('<h2 id="intro-1">Intro</h2>');
    expect(html).toContain('<h2 id="other">Other</h2>');
  });

  it("shows a line when there is no heading, and adds no id to a page without headings", () => {
    expect(toHtml(doc({ type: "toc" }, paragraph("x")), all)).toContain("No headings yet");
  });

  it("does not change a heading's JSON, nor its Markdown", () => {
    const page = doc(heading(2, "Plain"));
    expect(toMarkdown(page, all)).toBe(toMarkdown(page, fullCorePlugins));
    expect(JSON.stringify(normalizeDoc(page, all))).toBe(JSON.stringify(page));
  });

  it("works without the heading plugin: no crash, the list reads the heading nodes, no ids are guessed", () => {
    const plugins = [core, toc];
    const page = doc({ type: "toc" }, heading(1, "Hidden"));
    const html = toHtml(page, plugins);
    expect(html).toContain('<a href="#hidden">Hidden</a>');
    expect(html).not.toContain(' id="');
    expect(toPlainText(page, {}, plugins)).toBe("Hidden");
    // The heading plugin alone: ids appear only with the toc plugin.
    expect(toHtml(doc(heading(1, "A")), [core, headingPlugin])).toBe("<h1>A</h1>");
  });

  it("writes nothing in plain text", () => {
    expect(toPlainText(doc({ type: "toc" }, paragraph("x")), {}, all)).toBe("x");
  });
});

describe("emoji", () => {
  it("has a table with unique names and characters, written for this package", () => {
    expect(EMOJI.length).toBeGreaterThan(300);
    const names = EMOJI.map((e) => e.name);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
    const chars = EMOJI.map((e) => e.char);
    expect(chars.filter((c, i) => chars.indexOf(c) !== i)).toEqual([]);
    for (const e of EMOJI) expect(e.name).toMatch(/^[a-z0-9_]+$/);
  });

  it("searches by name and by keyword, best match first", () => {
    expect(emojiPicker.search("thumbs")[0]?.char).toBe("👍");
    expect(emojiPicker.search("rocket")[0]?.name).toBe("rocket");
    expect(emojiPicker.search("lol").map((e) => e.name)).toContain("joy");
    expect(emojiPicker.search("thumbs up")[0]?.name).toBe("thumbs_up");
    expect(emojiPicker.search(":fire:")[0]?.name).toBe("fire");
    expect(emojiPicker.search("zzzzzz")).toEqual([]);
    // Every word has to match.
    expect(emojiPicker.search("heart blue").map((e) => e.name)).toContain("blue_heart");
    expect(emojiPicker.search("heart").length).toBeGreaterThan(5);
    expect(emojiPicker.search("heart", 3)).toHaveLength(3);
  });

  it("offers the common ones before anything is typed, and finds by name or character", () => {
    expect(emojiPicker.search("").length).toBeGreaterThan(5);
    expect(emojiPicker.search("")[0]?.name).toBe("thumbs_up");
    expect(emojiPicker.find(":tada:")?.char).toBe("🎉");
    expect(emojiPicker.find("🎉")?.name).toBe("tada");
    expect(emojiPicker.find("nope")).toBeUndefined();
    expect(emojiPicker.groups).toContain("symbols");
    expect(emojiPicker.group("symbols").length).toBeGreaterThan(20);
  });

  it("owns no node: an emoji is text, in Markdown, plain text and the static view", () => {
    expect(emoji).not.toHaveProperty("nodes");
    const page = doc(paragraph("Done 🎉"));
    expect(toMarkdown(page, all)).toBe("Done 🎉");
    expect(toPlainText(page, {}, all)).toBe("Done 🎉");
    expect(toHtml(page, all)).toBe("<p>Done 🎉</p>");
    expect(roundTrip(page)).toBe("Done 🎉");
  });
});

describe("graceful degradation with few siblings", () => {
  it("works with only the core, and with lists but no marks", () => {
    for (const plugins of [
      [core, ...layoutPlugins],
      [core, listItem, bulletList, bold, italic, ...layoutPlugins],
    ]) {
      const page = doc(note("info", paragraph("x")), {
        type: "toggle",
        attrs: { open: true },
        content: [summary("s"), paragraph("b")],
      });
      expect(() => toMarkdown(page, plugins)).not.toThrow();
      expect(() => toHtml(page, plugins)).not.toThrow();
      expect(normalizeDoc(fromMarkdown(toMarkdown(page, plugins), plugins), plugins)).toEqual(
        normalizeDoc(page as never, plugins),
      );
    }
  });

  it("keeps the block handle's quote reader out of the callout's way", () => {
    const plugins = [core, blockquote, callout];
    expect(
      fromMarkdown("> plain\n\n> [!NOTE]\n> boxed", plugins).content.map((b) => b.type),
    ).toEqual(["blockquote", "callout"]);
  });

  it("columns, toc and toggle alone read their own syntax", () => {
    for (const [plugin, md, type] of [
      [columns, "<!-- columns -->\n\nA\n\n<!-- column -->\n\nB\n\n<!-- /columns -->", "columns"],
      [toggle, "<details>\n<summary>S</summary>\n\nB\n\n</details>", "toggle"],
      [toc, "[TOC]", "toc"],
    ] as const) {
      expect(fromMarkdown(md, [core, plugin]).content[0]?.type).toBe(type);
    }
  });
});
