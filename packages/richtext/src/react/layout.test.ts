// @vitest-environment jsdom
import type { Editor } from "@tiptap/core";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type RichDoc,
  type RichNode,
  doc,
  heading,
  normalizeDoc,
  paragraph,
  toHtml,
  toMarkdown,
} from "../index";
import { contentPlugins, fullEditorPlugins } from "../plugins/editor/index";
import { callout, columns, emoji, layoutPlugins } from "../plugins/editor/layout";
import { layoutPlugins as layoutCores } from "../plugins/layout";
import { fullCorePlugins } from "../plugins/index";
import { applyBlock, currentBlock } from "../tiptap/commands";
import type { EditorPlugin, ToolbarItem } from "../tiptap/plugin";
import { RichTextEditor, RichTextView } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const wait = () => act(async () => new Promise((r) => setTimeout(r, 20)));

async function mount(props: Parameters<typeof RichTextEditor>[0]) {
  const el = document.createElement("div");
  document.body.append(el);
  const root = createRoot(el);
  hosts.push(el);
  roots.push(root);
  let editor: Editor | undefined;
  await act(async () =>
    root.render(h(RichTextEditor, { ...props, onReady: (e: Editor) => (editor = e) })),
  );
  for (let i = 0; i < 5 && !editor; i++) await wait();
  if (!editor) throw new Error("no editor");
  return { editor, el };
}

const page: ReadonlyArray<EditorPlugin> = [...fullEditorPlugins, ...layoutPlugins];
const json = (editor: Editor) => normalizeDoc(editor.getJSON() as RichDoc);
const types = (editor: Editor) => json(editor).content.map((n) => n.type);
const type = (editor: Editor, text: string) =>
  act(async () => {
    editor.chain().focus("end").insertContent(text).run();
  });
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const menu = () => document.querySelector('[role="listbox"]');
const labels = () => options().map((o) => o.querySelector(".fg-pop-label")?.textContent);
const pick = async (index: number) => {
  await act(async () => options()[index]?.click());
  await wait();
};
/** Where a node of this type starts in the document, the first one found. */
const posOf = (editor: Editor, name: string, nth = 0) => {
  let found = -1;
  let seen = 0;
  editor.state.doc.descendants((node, pos) => {
    if (found < 0 && node.type.name === name && seen++ === nth) found = pos;
  });
  return found;
};
/** A real key press on the editor: the handlers of the plugins run as they do for a user. */
const press = (editor: Editor, key: string) =>
  act(async () => {
    editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  });
const toolbarItems = (plugin: EditorPlugin): ToolbarItem[] => [
  ...(plugin.blockToolbar?.flatMap((t) => t.items) ?? []),
];
const item = (plugin: EditorPlugin, id: string) => {
  const found = toolbarItems(plugin).find((i) => i.id === id);
  if (!found) throw new Error(`no toolbar item ${id}`);
  return found;
};

describe("the slash entries", () => {
  it("are in the slash menu, found by name and by keyword", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: doc({ type: "paragraph" }) });
    await type(editor, "/col");
    await wait();
    expect(labels()).toEqual(expect.arrayContaining(["2 columns", "3 columns", "4 columns"]));
    expect(labels()).not.toContain("Callout");
  });

  it("create a callout from the menu, around the text of the block", async () => {
    const { editor, el } = await mount({ plugins: page, defaultValue: doc(paragraph("Hi ")) });
    await type(editor, "/callo");
    await wait();
    expect(labels()).toEqual(["Callout"]);
    await pick(0);
    expect(json(editor).content[0]).toEqual({
      type: "callout",
      attrs: { tone: "note" },
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hi " }] }],
    });
    expect(
      el.querySelector("aside.fg-rt-callout[data-tone='note'] .fg-rt-callout-body"),
    ).not.toBeNull();
    expect(currentBlock(editor)).toBe("callout");
  });

  it("create each block with applyBlock", async () => {
    const ids: Array<[string, string]> = [
      ["callout", "callout"],
      ["toggle", "toggle"],
      ["columns-2", "columns"],
      ["columns-3", "columns"],
      ["columns-4", "columns"],
      ["toc", "toc"],
    ];
    for (const [id, nodeType] of ids) {
      const { editor } = await mount({ plugins: page, defaultValue: doc({ type: "paragraph" }) });
      await act(async () => void applyBlock(editor, id));
      expect(types(editor)).toContain(nodeType);
    }
  });

  it("insert columns with that many empty columns, the caret in the first", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: doc({ type: "paragraph" }) });
    await act(async () => void applyBlock(editor, "columns-3"));
    const block = json(editor).content[0] as RichNode;
    expect(block.type).toBe("columns");
    expect(block.content?.map((c) => c.type)).toEqual(["column", "column", "column"]);
    expect(editor.state.selection.$from.node(2)?.type.name).toBe("column");
    await act(async () => void editor.commands.insertContent("typed"));
    expect(JSON.stringify(block.content?.[1])).not.toContain("typed");
    expect(JSON.stringify((json(editor).content[0] as RichNode).content?.[0])).toContain("typed");
  });

  it("do not nest columns", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: doc({ type: "paragraph" }) });
    await act(async () => void applyBlock(editor, "columns-2"));
    await act(async () => void applyBlock(editor, "columns-2"));
    expect(JSON.stringify(json(editor))).not.toMatch(/columns.*columns/s);
  });

  it("come after a block that has text instead of replacing it", async () => {
    const { editor } = await mount({
      plugins: page,
      defaultValue: doc(paragraph("Keep me")),
    });
    await act(async () => void editor.chain().focus("end").run());
    await act(async () => void applyBlock(editor, "columns-2"));
    expect(types(editor).slice(0, 2)).toEqual(["paragraph", "columns"]);
  });
});

describe("callout", () => {
  const start = doc({
    type: "callout",
    attrs: { tone: "info" },
    content: [paragraph("Boxed")],
  });

  it("renders the tone and an empty icon slot, and a custom emoji when there is one", async () => {
    const { editor, el } = await mount({ plugins: page, defaultValue: start });
    expect(el.querySelector(".fg-rt-callout")?.getAttribute("data-tone")).toBe("info");
    expect(el.querySelector(".fg-rt-callout-icon")?.textContent).toBe("");
    await act(async () => {
      editor.commands.setTextSelection(3);
      editor.commands.setCalloutIcon("💡");
    });
    expect(el.querySelector(".fg-rt-callout-icon")?.textContent).toBe("💡");
    expect(json(editor).content[0]?.attrs).toEqual({ tone: "info", icon: "💡" });
    await act(async () => void item(callout, "icon-reset").run?.(editor));
    expect(el.querySelector(".fg-rt-callout-icon")?.textContent).toBe("");
    expect(json(editor).content[0]?.attrs).toEqual({ tone: "info" });
  });

  it("switches tone from the toolbar, and says which one is active", async () => {
    const { editor, el } = await mount({ plugins: page, defaultValue: start });
    await act(async () => void editor.commands.setTextSelection(3));
    const tones = ["note", "info", "success", "warning", "danger"];
    expect(toolbarItems(callout).map((i) => i.id)).toEqual([
      ...tones.map((t) => `tone-${t}`),
      "icon-reset",
    ]);
    expect(item(callout, "tone-info").active?.(editor)).toBe(true);
    expect(item(callout, "tone-danger").active?.(editor)).toBe(false);
    expect(item(callout, "icon-reset").disabled?.(editor)).toBe(true);
    for (const tone of tones) {
      await act(async () => void item(callout, `tone-${tone}`).run?.(editor));
      expect(el.querySelector(".fg-rt-callout")?.getAttribute("data-tone")).toBe(tone);
      expect(json(editor).content[0]?.attrs?.["tone"]).toBe(tone);
    }
  });

  it("changes only the callout the cursor is in, not the one around it", async () => {
    const { editor } = await mount({
      plugins: page,
      defaultValue: doc({
        type: "callout",
        attrs: { tone: "note" },
        content: [
          paragraph("outer"),
          { type: "callout", attrs: { tone: "note" }, content: [paragraph("inner")] },
        ],
      }),
    });
    const inner = posOf(editor, "callout", 1);
    await act(async () => void editor.commands.setTextSelection(inner + 3));
    await act(async () => void item(callout, "tone-danger").run?.(editor));
    const outer = json(editor).content[0] as RichNode;
    expect(outer.attrs?.["tone"]).toBe("note");
    expect(outer.content?.[1]?.attrs?.["tone"]).toBe("danger");
  });

  it("undoes a tone change, and keeps rich content inside", async () => {
    const { editor } = await mount({
      plugins: page,
      defaultValue: doc({
        type: "callout",
        attrs: { tone: "note" },
        content: [
          paragraph("a"),
          { type: "bulletList", content: [{ type: "listItem", content: [paragraph("b")] }] },
          heading(2, "c"),
        ],
      }),
    });
    await act(async () => void editor.commands.setTextSelection(3));
    await act(async () => void editor.commands.setCalloutTone("success"));
    expect(json(editor).content[0]?.attrs?.["tone"]).toBe("success");
    await act(async () => void editor.commands.undo());
    expect(json(editor).content[0]?.attrs?.["tone"]).toBe("note");
    expect(json(editor).content[0]?.content?.map((n) => n.type)).toEqual([
      "paragraph",
      "bulletList",
      "heading",
    ]);
  });

  it("round trips through the HTML the editor writes", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: start });
    const html = editor.getHTML();
    expect(html).toContain('data-tone="info"');
    const { editor: other } = await mount({ plugins: page, defaultValue: doc(paragraph("x")) });
    await act(async () => void other.commands.setContent(html));
    expect(json(other).content[0]).toEqual({
      type: "callout",
      attrs: { tone: "info" },
      content: [{ type: "paragraph", content: [{ type: "text", text: "Boxed" }] }],
    });
  });
});

describe("toggle", () => {
  const start = doc({
    type: "toggle",
    attrs: { open: true },
    content: [
      { type: "toggleSummary", content: [{ type: "text", text: "More" }] },
      paragraph("Hidden"),
    ],
  });
  const button = (el: HTMLElement) => el.querySelector<HTMLButtonElement>(".fg-rt-toggle-btn");
  const openOf = (editor: Editor) => json(editor).content[0]?.attrs?.["open"];

  it("opens and closes with its chevron, and stores the state in the document", async () => {
    const onChange = vi.fn<(d: RichDoc) => void>();
    const { editor, el } = await mount({ plugins: page, defaultValue: start, onChange });
    const root = el.querySelector<HTMLElement>(".fg-rt-toggle");
    expect(root?.dataset["open"]).toBe("true");
    expect(button(el)?.getAttribute("aria-expanded")).toBe("true");
    await act(async () => button(el)?.click());
    expect(root?.dataset["open"]).toBe("false");
    expect(button(el)?.getAttribute("aria-expanded")).toBe("false");
    expect(openOf(editor)).toBe(false);
    expect(onChange.mock.lastCall?.[0].content[0]?.attrs).toEqual({ open: false });
    await act(async () => button(el)?.click());
    expect(openOf(editor)).toBe(true);
    expect(root?.dataset["open"]).toBe("true");
  });

  it("leaves the caret out of what it hides, and does not put the state on the undo stack", async () => {
    const { editor, el } = await mount({ plugins: page, defaultValue: start });
    const hidden = posOf(editor, "paragraph") + 1;
    await act(async () => void editor.commands.setTextSelection(hidden));
    await act(async () => button(el)?.click());
    expect(editor.state.selection.$from.parent.type.name).toBe("toggleSummary");
    await act(async () => void editor.commands.undo());
    expect(openOf(editor)).toBe(false);
  });

  it("is local in a read-only editor: the view changes, the document does not", async () => {
    const { editor, el } = await mount({ plugins: page, defaultValue: start, editable: false });
    const root = el.querySelector<HTMLElement>(".fg-rt-toggle");
    await act(async () => button(el)?.click());
    expect(root?.dataset["open"]).toBe("false");
    expect(openOf(editor)).toBe(true);
  });

  it("is created from a paragraph: its text becomes the summary, open, with room for a block", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: doc(paragraph("Title")) });
    await act(async () => void applyBlock(editor, "toggle"));
    expect(json(editor).content[0]).toEqual({
      type: "toggle",
      attrs: { open: true },
      content: [
        { type: "toggleSummary", content: [{ type: "text", text: "Title" }] },
        { type: "paragraph" },
      ],
    });
    expect(editor.state.selection.$from.parent.type.name).toBe("toggleSummary");
  });

  it("moves what follows the caret into the first block when Enter is pressed in the summary", async () => {
    const { editor } = await mount({
      plugins: page,
      defaultValue: doc({
        type: "toggle",
        attrs: { open: false },
        content: [{ type: "toggleSummary", content: [{ type: "text", text: "HeadTail" }] }],
      }),
    });
    await act(async () => void editor.commands.setTextSelection(1 + 4 + 1));
    await press(editor, "Enter");
    expect(json(editor).content[0]).toEqual({
      type: "toggle",
      attrs: { open: true },
      content: [
        { type: "toggleSummary", content: [{ type: "text", text: "Head" }] },
        { type: "paragraph", content: [{ type: "text", text: "Tail" }] },
      ],
    });
    expect(editor.state.selection.$from.parent.type.name).toBe("paragraph");
  });

  it("goes back to a paragraph and its blocks on Backspace at the start of the summary", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: start });
    await act(
      async () => void editor.commands.setTextSelection(posOf(editor, "toggleSummary") + 1),
    );
    await press(editor, "Backspace");
    expect(types(editor)).not.toContain("toggle");
    expect(types(editor).slice(0, 2)).toEqual(["paragraph", "paragraph"]);
    expect(editor.getText()).toContain("More");
    expect(editor.getText()).toContain("Hidden");
  });

  it("keeps nested toggles, each with its own state", async () => {
    const inner: RichNode = {
      type: "toggle",
      attrs: { open: false },
      content: [
        { type: "toggleSummary", content: [{ type: "text", text: "Inner" }] },
        paragraph("deep"),
      ],
    };
    const { editor, el } = await mount({
      plugins: page,
      defaultValue: doc({
        type: "toggle",
        attrs: { open: true },
        content: [{ type: "toggleSummary", content: [{ type: "text", text: "Outer" }] }, inner],
      }),
    });
    const toggles = el.querySelectorAll<HTMLElement>(".fg-rt-toggle");
    expect([...toggles].map((t) => t.dataset["open"])).toEqual(["true", "false"]);
    await act(async () => button(el)?.click());
    expect(json(editor).content[0]?.attrs?.["open"]).toBe(false);
    expect(json(editor).content[0]?.content?.[1]?.attrs?.["open"]).toBe(false);
  });
});

describe("columns", () => {
  const two = doc({
    type: "columns",
    content: [
      { type: "column", content: [paragraph("Left")] },
      { type: "column", content: [paragraph("Right")] },
    ],
  });
  const count = (editor: Editor) => (json(editor).content[0] as RichNode).content?.length;

  it("adds a column after the one the cursor is in, up to four", async () => {
    const { editor, el } = await mount({ plugins: page, defaultValue: two });
    await act(async () => void editor.commands.setTextSelection(posOf(editor, "paragraph") + 1));
    expect(item(columns, "column-add").disabled?.(editor)).toBe(false);
    await act(async () => void item(columns, "column-add").run?.(editor));
    expect(count(editor)).toBe(3);
    expect(el.querySelectorAll(".fg-rt-column")).toHaveLength(3);
    // The new one is second; the caret is in it.
    expect(
      editor.state.selection.$from.node(editor.state.selection.$from.depth - 1).type.name,
    ).toBe("column");
    await act(async () => void item(columns, "column-add").run?.(editor));
    expect(count(editor)).toBe(4);
    expect(item(columns, "column-add").disabled?.(editor)).toBe(true);
    await act(async () => void item(columns, "column-add").run?.(editor));
    expect(count(editor)).toBe(4);
  });

  it("removes the column the cursor is in, down to two", async () => {
    const three = doc({
      type: "columns",
      content: ["A", "B", "C"].map((t) => ({ type: "column", content: [paragraph(t)] })),
    });
    const { editor } = await mount({ plugins: page, defaultValue: three });
    await act(async () => void editor.commands.setTextSelection(posOf(editor, "paragraph", 1) + 1));
    await act(async () => void item(columns, "column-delete").run?.(editor));
    expect(count(editor)).toBe(2);
    expect(JSON.stringify(json(editor))).not.toContain('"B"');
    expect(JSON.stringify(json(editor))).toContain('"A"');
    expect(JSON.stringify(json(editor))).toContain('"C"');
    expect(item(columns, "column-delete").disabled?.(editor)).toBe(true);
    await act(async () => void item(columns, "column-delete").run?.(editor));
    expect(count(editor)).toBe(2);
  });

  it("deletes the whole block from its toolbar", async () => {
    const { editor } = await mount({
      plugins: page,
      defaultValue: doc(two.content[0] as RichNode, paragraph("After")),
    });
    await act(async () => void editor.commands.setTextSelection(posOf(editor, "paragraph") + 1));
    await act(async () => void item(columns, "delete").run?.(editor));
    expect(types(editor)).toEqual(["paragraph"]);
  });

  it("isolates the columns: Backspace at the start of one does not pull it into the other", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: two });
    await act(async () => void editor.commands.setTextSelection(posOf(editor, "paragraph", 1) + 1));
    await press(editor, "Backspace");
    expect(count(editor)).toBe(2);
    expect(editor.getText()).toContain("Right");
  });

  it("shows its columns in the static view too, with the same classes", async () => {
    const { el } = await mount({ plugins: page, defaultValue: two });
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    const root = createRoot(host);
    roots.push(root);
    await act(async () =>
      root.render(h(RichTextView, { value: two, plugins: [...fullCorePlugins, ...layoutCores] })),
    );
    for (const target of [el, host]) {
      expect(target.querySelector(".fg-rt-columns .fg-rt-columns-grid")).not.toBeNull();
      expect(target.querySelectorAll(".fg-rt-columns-grid > .fg-rt-column")).toHaveLength(2);
    }
  });
});

describe("table of contents", () => {
  const start = doc({ type: "toc" }, heading(1, "Intro"), paragraph("text"), heading(2, "Details"));
  const links = (el: HTMLElement) =>
    [...el.querySelectorAll<HTMLAnchorElement>(".fg-rt-toc a")].map((a) => [
      a.textContent,
      a.getAttribute("href"),
    ]);

  it("lists the headings, as links to their ids", async () => {
    const { el } = await mount({ plugins: page, defaultValue: start });
    expect(links(el)).toEqual([
      ["Intro", "#intro"],
      ["Details", "#details"],
    ]);
    expect(el.querySelector("h1")?.id).toBe("intro");
    expect(el.querySelector("h2")?.id).toBe("details");
    expect(el.querySelectorAll(".fg-rt-toc li")[1]?.getAttribute("data-level")).toBe("2");
  });

  it("follows the headings as they are edited: new, renamed, repeated, removed", async () => {
    const { editor, el } = await mount({ plugins: page, defaultValue: start });
    await act(async () => {
      editor
        .chain()
        .focus("end")
        .insertContent({
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Intro" }],
        })
        .run();
    });
    expect(links(el)).toEqual([
      ["Intro", "#intro"],
      ["Details", "#details"],
      ["Intro", "#intro-1"],
    ]);
    expect(el.querySelectorAll("h3")[0]?.id).toBe("intro-1");

    await act(async () => {
      editor.commands.setTextSelection(posOf(editor, "heading", 0) + 1);
      editor.commands.insertContent("New ");
    });
    expect(links(el)[0]).toEqual(["New Intro", "#new-intro"]);
    expect(links(el)[2]).toEqual(["Intro", "#intro"]);

    await act(async () => {
      editor.chain().focus().setNode("paragraph").run();
    });
    expect(links(el).map((l) => l[0])).toEqual(["Details", "Intro"]);
  });

  it("shows a line while there is no heading", async () => {
    const { editor, el } = await mount({
      plugins: page,
      defaultValue: doc({ type: "toc" }, paragraph("x")),
    });
    expect(el.querySelector(".fg-rt-toc-empty")?.textContent).toBe("No headings yet");
    await act(async () => void editor.chain().focus("end").insertContent(heading(2, "Late")).run());
    expect(links(el)).toEqual([["Late", "#late"]]);
  });

  it("does not store ids in the headings: the JSON of a heading is the same", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: start });
    expect(json(editor).content[1]).toEqual({
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Intro" }],
    });
  });

  it("moves the caret to the heading when a link is clicked", async () => {
    const { editor, el } = await mount({ plugins: page, defaultValue: start });
    const scroll = vi.fn<() => void>();
    (el.querySelector("h2") as HTMLElement).scrollIntoView = scroll;
    const second = el.querySelectorAll<HTMLAnchorElement>(".fg-rt-toc a")[1];
    await act(async () => second?.click());
    expect(editor.state.selection.$from.parent.type.name).toBe("heading");
    expect(editor.state.selection.$from.parent.textContent).toBe("Details");
    expect(scroll).toHaveBeenCalled();
  });

  it("is a block in the Markdown and the static view of the same page", async () => {
    const { editor } = await mount({ plugins: page, defaultValue: start });
    const value = json(editor);
    expect(toMarkdown(value, [...fullCorePlugins, ...layoutCores])).toBe(
      "[TOC]\n\n# Intro\n\ntext\n\n## Details",
    );
    expect(toHtml(value, [...fullCorePlugins, ...layoutCores])).toContain(
      '<a href="#details">Details</a>',
    );
  });
});

describe("emoji", () => {
  const base: ReadonlyArray<EditorPlugin> = [...contentPlugins, emoji];
  const start = doc(paragraph("Nice "));

  it("opens on `:` after a space, filters by name and keyword", async () => {
    const { editor } = await mount({ plugins: base, defaultValue: start });
    await type(editor, ":");
    await wait();
    expect(menu()).not.toBeNull();
    expect(labels()?.[0]).toBe("👍  thumbs up");
    await type(editor, "thumbs");
    await wait();
    expect(labels()?.[0]).toBe("👍  thumbs up");
    expect(labels()?.every((l) => /thumbs/.test(l ?? ""))).toBe(true);
  });

  it("finds by keyword, not only by name", async () => {
    const { editor } = await mount({ plugins: base, defaultValue: start });
    await type(editor, ":lol");
    await wait();
    expect(labels()).toContain("😂  joy");
  });

  it("inserts the character as plain text, no node, and removes what was typed", async () => {
    const onChange = vi.fn<(d: RichDoc) => void>();
    const { editor } = await mount({ plugins: base, defaultValue: start, onChange });
    await type(editor, ":tada");
    await wait();
    await pick(0);
    expect(menu()).toBeNull();
    expect(json(editor)).toEqual(doc(paragraph("Nice 🎉")));
    expect(toMarkdown(json(editor))).toBe("Nice 🎉");
  });

  it("works with the keyboard: the arrows move, Enter picks the highlighted row", async () => {
    const { editor } = await mount({ plugins: base, defaultValue: start });
    await type(editor, ":heart");
    await wait();
    const second = labels()?.[1]?.split("  ")[0];
    expect(second).toBeTruthy();
    await press(editor, "ArrowDown");
    await press(editor, "Enter");
    await wait();
    expect(editor.getText()).toBe(`Nice ${second}`);
    expect(menu()).toBeNull();
  });

  it("does not open in the middle of a word, in a URL or in code, and shows no menu for nothing", async () => {
    const { editor } = await mount({ plugins: base, defaultValue: doc(paragraph("at 10")) });
    await type(editor, ":30");
    await wait();
    expect(menu()).toBeNull();
    await type(editor, " http:");
    await wait();
    expect(menu()).toBeNull();

    const code = await mount({
      plugins: [...base],
      defaultValue: doc({ type: "codeBlock", content: [{ type: "text", text: "a " }] }),
    });
    await type(code.editor, ":smile");
    await wait();
    expect(menu()).toBeNull();
    const none = await mount({ plugins: base, defaultValue: start });
    await type(none.editor, ":zzzzz");
    await wait();
    expect(labels()).toEqual([]);
    expect(document.body.textContent).toContain("No emoji matches");
  });

  it("is part of no preset: without it `:` is just a character", async () => {
    const { editor } = await mount({ plugins: [...contentPlugins], defaultValue: start });
    await type(editor, ":smile");
    await wait();
    expect(menu()).toBeNull();
  });
});
