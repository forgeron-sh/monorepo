import { describe, expect, it } from "vitest";
import { callout } from "../fixtures/callout-core";
import {
  type CorePlugin,
  PluginError,
  blocksFor,
  createRegistry,
  definePlugin,
  diffReferences,
  doc,
  filterBlocks,
  fromMarkdown,
  heading,
  link,
  normalizeDoc,
  paragraph,
  parseDoc,
  referencesOf,
  registryOf,
  resolvePlugins,
  text,
  toHtml,
  toMarkdown,
  toPlainText,
  toTree,
  type RichDoc,
  type RichNode,
} from "../index";
import {
  bold,
  bulletList,
  corePresets,
  fullCorePlugins,
  heading as headingPlugin,
  listItem,
  minimalCorePlugins,
  references,
  taskList,
} from "../plugins/index";

const NONE: CorePlugin[] = [];
const mention = (id: string, label: string): RichNode => ({
  type: "mention",
  attrs: { id, label },
});

describe("the minimal core alone", () => {
  const page = doc(heading(1, "Title"), paragraph("Some ", text("bold", "bold"), " text"), {
    type: "horizontalRule",
  });

  it("knows paragraphs, text and line breaks, nothing else", () => {
    expect(blocksFor(NONE).map((b) => b.id)).toEqual(["paragraph"]);
    const registry = registryOf(NONE);
    expect(registry.knows("paragraph")).toBe(true);
    expect(registry.knows("heading")).toBe(false);
    expect(registry.hasMark("bold")).toBe(false);
  });

  it("degrades a heading, a divider and a mark to text without throwing", () => {
    expect(toMarkdown(page, NONE)).toBe("Title\n\nSome bold text");
    expect(toPlainText(page, {}, NONE)).toBe("Title\nSome bold text");
    const html = toHtml(page, NONE);
    expect(html).toContain('<div class="fg-rt-unknown" data-unknown="heading">Title</div>');
    expect(html).toContain("<p>Some bold text</p>");
    expect(html).toContain('data-unknown="horizontalRule"');
    expect(html).not.toContain("<strong>");
  });

  it("drops what it does not know when parsing foreign data, and keeps it when asked", () => {
    expect(parseDoc(page, NONE).content.map((n) => n.type)).toEqual(["paragraph"]);
    const kept = parseDoc(page, NONE, { unknown: "keep" });
    expect(kept).toEqual(normalizeDoc(page, NONE));
    expect(kept.content.map((n) => n.type)).toEqual(["heading", "paragraph", "horizontalRule"]);
  });

  it("reads Markdown as plain paragraphs", () => {
    const d = fromMarkdown("# Not a heading\n\n- not a list\n\n**not bold**", NONE);
    expect(d.content.map((n) => n.type)).toEqual(["paragraph", "paragraph", "paragraph"]);
    expect(toPlainText(d, {}, NONE)).toBe("# Not a heading\n- not a list\n**not bold**");
  });
});

describe("an unknown node type", () => {
  const input = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "kept" }] },
      { type: "futureChart", attrs: { series: [1, 2, 3] }, content: [{ type: "paragraph" }] },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "a " },
          { type: "emoji", attrs: { name: "tada", label: ":tada:" } },
          { type: "text", text: "b", marks: [{ type: "sparkle" }] },
        ],
      },
    ],
  };

  it("survives a round trip through JSON, untouched, when kept", () => {
    const once = parseDoc(input, undefined, { unknown: "keep" });
    expect(once.content[1]).toEqual({
      type: "futureChart",
      attrs: { series: [1, 2, 3] },
      content: [{ type: "paragraph" }],
    });
    expect(once.content[2]?.content?.[2]?.marks).toEqual([{ type: "sparkle" }]);
    expect(parseDoc(JSON.stringify(once), undefined, { unknown: "keep" })).toEqual(once);
    expect(normalizeDoc(once)).toEqual(once);
  });

  it("is dropped by default, with its marks", () => {
    const d = parseDoc(input);
    expect(d.content.map((n) => n.type)).toEqual(["paragraph", "paragraph"]);
    expect(d.content[1]?.content).toEqual([{ type: "text", text: "a b" }]);
  });

  it("renders as a placeholder or as nothing, never crashes, in every output", () => {
    const d = parseDoc(input, undefined, { unknown: "keep" }) as RichDoc;
    expect(toHtml(d)).toContain('data-unknown="futureChart"');
    expect(toHtml(d)).toContain(":tada:");
    expect(toTree(d)).toBeTruthy();
    expect(toMarkdown(d)).toContain("kept");
    expect(toPlainText(d)).toContain("kept");
    expect(toMarkdown(fromMarkdown(toMarkdown(d)))).toBe(toMarkdown(d));
  });
});

describe("plugin resolution", () => {
  const plugin = (id: string, requires: string[] = []): CorePlugin =>
    definePlugin({ id, name: id, description: id, requires });

  it("puts a dependency before what needs it, whatever the order given", () => {
    const ids = resolvePlugins([plugin("c", ["b"]), plugin("a"), plugin("b", ["a"])]).map(
      (p) => p.id,
    );
    expect(ids).toEqual(["a", "b", "c"]);
    expect(resolvePlugins([taskList, bulletList, listItem]).map((p) => p.id)).toEqual([
      "taskList",
      "listItem",
      "bulletList",
    ]);
  });

  it("refuses a duplicate id", () => {
    expect(() => createRegistry([plugin("a"), plugin("a")])).toThrow(PluginError);
    expect(() => createRegistry([bold, bold])).toThrow(/Duplicate plugin id "bold"/);
  });

  it("refuses a missing dependency and a cycle", () => {
    expect(() => createRegistry([bulletList])).toThrow(/requires "listItem", which is missing/);
    expect(() => createRegistry([plugin("a", ["b"]), plugin("b", ["a"])])).toThrow(
      /dependency cycle: a -> b -> a/,
    );
  });

  it("refuses two plugins that own the same type", () => {
    const twin = definePlugin({
      id: "twin",
      name: "Twin",
      description: "Owns `heading` too.",
      nodes: { heading: {} },
    });
    expect(() => createRegistry([headingPlugin, twin])).toThrow(/Node type "heading"/);
    const clash = definePlugin({ id: "bold2", name: "B", description: "B", marks: { bold: {} } });
    expect(() => createRegistry([bold, clash])).toThrow(/Mark type "bold"/);
    expect(() =>
      createRegistry([definePlugin({ id: "x", name: "x", description: "x", nodes: { doc: {} } })]),
    ).toThrow(PluginError);
  });

  it("the presets are plain lists that resolve", () => {
    expect(() => createRegistry(fullCorePlugins)).not.toThrow();
    expect(() => createRegistry(minimalCorePlugins)).not.toThrow();
    expect(corePresets.minimal).toBe(minimalCorePlugins);
    expect(blocksFor("minimal").map((b) => b.id)).toEqual([
      "paragraph",
      "bullet-list",
      "ordered-list",
      "task-list",
    ]);
  });
});

describe("a third-party plugin", () => {
  const plugins = [...fullCorePlugins, callout];
  const page = doc(
    paragraph("Before"),
    { type: "callout", content: [paragraph("Careful: ", text("hot", "bold"))] },
    paragraph("After"),
  );

  it("shows in the slash catalog and its filter", () => {
    expect(blocksFor(plugins).map((b) => b.id)).toContain("callout");
    expect(blocksFor(plugins).at(-1)?.id).toBe("callout");
    expect(filterBlocks(blocksFor(plugins), "note").map((b) => b.id)).toEqual(["callout"]);
    expect(blocksFor("full").map((b) => b.id)).not.toContain("callout");
  });

  it("writes and reads its own Markdown", () => {
    const md = toMarkdown(page, plugins);
    expect(md).toBe("Before\n\n:::callout\nCareful: **hot**\n:::\n\nAfter");
    expect(fromMarkdown(md, plugins)).toEqual(normalizeDoc(page, plugins));
    // Without the plugin the fences stay text.
    expect(fromMarkdown(md).content.every((n) => n.type === "paragraph")).toBe(true);
  });

  it("renders statically and gives plain text", () => {
    expect(toHtml(page, plugins)).toContain(
      '<aside class="fg-rt-callout"><p>Careful: <strong>hot</strong></p></aside>',
    );
    expect(toPlainText(page, {}, plugins)).toBe("Before\nCareful: hot\nAfter");
    // Without it, the callout degrades: its text stays.
    expect(toHtml(page)).toContain('<div class="fg-rt-unknown" data-unknown="callout">');
    expect(toPlainText(page)).toContain("Careful: hot");
  });

  it("accepts an extra plugin built on another one's mark order", () => {
    const withLink = doc(paragraph(text("x", "bold", "italic"), link("y", "https://a.dev")));
    expect(toMarkdown(withLink, plugins)).toBe("***x***[y](https://a.dev)");
  });
});

describe("references", () => {
  const ada = { type: "reference", attrs: { kind: "user", id: "u_1", label: "Ada" } };

  it("reads an old mention document as references of the kind user", () => {
    const old = doc(paragraph("Ping ", mention("u_1", "Ada"), " and ", mention("u_2", "Grace")));
    const now = normalizeDoc(old);
    expect(now.content[0]?.content?.[1]).toEqual(ada);
    expect(parseDoc(JSON.stringify(old))).toEqual(now);
    expect(referencesOf(old)).toEqual([
      { kind: "user", id: "u_1", label: "Ada" },
      { kind: "user", id: "u_2", label: "Grace" },
    ]);
  });

  it("keeps the Markdown form `[@Label](mention:id)` for users, both ways", () => {
    const old = doc(paragraph("Ping ", mention("u_1", "Ada")));
    expect(toMarkdown(old)).toBe("Ping [@Ada](mention:u_1)");
    expect(toMarkdown(doc(paragraph("Ping ", ada)))).toBe("Ping [@Ada](mention:u_1)");
    expect(fromMarkdown("Ping [@Ada](mention:u_1)")).toEqual(normalizeDoc(old));
    expect(toPlainText(old)).toBe("Ping @Ada");
    expect(toHtml(old)).toContain('class="fg-rt-mention" data-reference="u_1"');
    expect(toHtml(old)).toContain('data-mention="u_1"');
    expect(toHtml(old)).toContain(">@Ada</span>");
  });

  it("writes other kinds as `[Label](ref:kind:id)` and reads them back", () => {
    const page = { type: "reference", attrs: { kind: "page", id: "p/7", label: "Roadmap (Q1)" } };
    const d = doc(paragraph("See ", page));
    const md = toMarkdown(d);
    expect(md).toBe("See [Roadmap (Q1)](ref:page:p/7)");
    expect(fromMarkdown(md)).toEqual(normalizeDoc(d));
    expect(toPlainText(d)).toBe("See Roadmap (Q1)");
    expect(toHtml(d)).toContain('data-reference-kind="page"');
  });

  it("without the plugin, a reference is only its label", () => {
    const d = doc(paragraph("Ping ", ada));
    const without = fullCorePlugins.filter((p) => p !== references);
    expect(toHtml(d, without)).toContain('data-unknown="reference">Ada<');
    expect(toPlainText(d, {}, without)).toBe("Ping Ada");
    expect(toMarkdown(d, without)).toBe("Ping Ada");
  });

  it("diffs what was added and removed, once per kind and id", () => {
    const before = doc(
      paragraph(mention("u_1", "Ada"), mention("u_1", "Ada"), mention("u_2", "G")),
    );
    const after = doc(
      paragraph(ada, {
        type: "reference",
        attrs: { kind: "page", id: "u_1", label: "Same id, other kind" },
      }),
    );
    const change = diffReferences(before, after);
    expect(change.added).toEqual([{ kind: "page", id: "u_1", label: "Same id, other kind" }]);
    expect(change.removed).toEqual([{ kind: "user", id: "u_2", label: "G" }]);
    expect(change.all).toHaveLength(2);
    expect(diffReferences(after, after)).toMatchObject({ added: [], removed: [] });
  });
});
