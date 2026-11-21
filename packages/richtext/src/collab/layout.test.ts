// @vitest-environment jsdom
import type { Editor } from "@tiptap/core";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type RichDoc, type RichNode, doc, heading, normalizeDoc, paragraph } from "../core/model";
import { contentPlugins } from "../plugins/editor/index";
import { layoutPlugins } from "../plugins/editor/layout";
import { RichTextEditor } from "../react/editor";
import type { EditorPlugin } from "../tiptap/plugin";
import { type LocalPeer, createLocalSync, createYDoc, fromYDoc, toYDoc } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const plugins: ReadonlyArray<EditorPlugin> = [...contentPlugins, ...layoutPlugins];

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

async function mountPeer(peer: LocalPeer, name: string) {
  const el = document.createElement("div");
  document.body.append(el);
  const root = createRoot(el);
  hosts.push(el);
  roots.push(root);
  let editor: Editor | undefined;
  await act(async () =>
    root.render(
      h(RichTextEditor, {
        collaboration: {
          doc: peer.doc,
          provider: { awareness: peer.awareness },
          user: { name, color: "#808080" },
        },
        plugins,
        onReady: (e: Editor) => (editor = e),
      }),
    ),
  );
  for (let i = 0; i < 5 && !editor; i++)
    await act(async () => new Promise((r) => setTimeout(r, 10)));
  if (!editor) throw new Error("no editor");
  return { editor, el };
}

async function pair(seed: RichDoc) {
  const sync = createLocalSync(2, [toYDoc(seed, undefined, plugins), createYDoc()]);
  const [pa, pb] = sync.peers as [LocalPeer, LocalPeer];
  const a = await mountPeer(pa, "Ada");
  const b = await mountPeer(pb, "Grace");
  return { sync, pa, pb, a, b };
}

const json = (editor: Editor) => normalizeDoc(editor.getJSON() as RichDoc, undefined);
const same = (x: Editor, y: Editor) => expect(x.getJSON()).toEqual(y.getJSON());
const posOf = (editor: Editor, name: string, nth = 0) => {
  let found = -1;
  let seen = 0;
  editor.state.doc.descendants((node, pos) => {
    if (found < 0 && node.type.name === name && seen++ === nth) found = pos;
  });
  return found;
};
const stored = (peer: LocalPeer) => fromYDoc(peer.doc, undefined, plugins);
const summary = (text: string): RichNode => ({
  type: "toggleSummary",
  content: [{ type: "text", text }],
});
const column = (...content: RichNode[]): RichNode => ({ type: "column", content });

describe("collaboration with the layout plugins", () => {
  it("seeds every node type, shows it to the other peer and reads it back from the Y.Doc", async () => {
    const seed = doc(
      { type: "toc" },
      heading(1, "Plan"),
      {
        type: "callout",
        attrs: { tone: "warning", icon: "🔥" },
        content: [
          paragraph("Careful"),
          { type: "bulletList", content: [{ type: "listItem", content: [paragraph("one")] }] },
        ],
      },
      {
        type: "toggle",
        attrs: { open: true },
        content: [summary("More"), paragraph("Body"), heading(2, "Inside")],
      },
      { type: "columns", content: [column(paragraph("L")), column(paragraph("R"))] },
    );
    const { sync, pa, pb, a, b } = await pair(seed);
    same(a.editor, b.editor);
    expect(
      json(b.editor)
        .content.map((n) => n.type)
        .slice(0, 5),
    ).toEqual(["toc", "heading", "callout", "toggle", "columns"]);
    expect(b.el.querySelector(".fg-rt-callout-icon")?.textContent).toBe("🔥");
    expect(b.el.querySelector(".fg-rt-columns-grid")?.children).toHaveLength(2);
    expect([...b.el.querySelectorAll(".fg-rt-toc a")].map((x) => x.getAttribute("href"))).toEqual([
      "#plan",
      "#inside",
    ]);
    expect(JSON.stringify(stored(pa))).toBe(JSON.stringify(stored(pb)));
    expect(stored(pa).content.map((n) => n.type)).toContain("columns");
    sync.destroy();
  });

  it("converges after concurrent typing inside a callout, a toggle and a column, with nested content", async () => {
    const seed = doc({
      type: "callout",
      attrs: { tone: "info" },
      content: [
        paragraph("callout"),
        {
          type: "toggle",
          attrs: { open: true },
          content: [
            summary("toggle"),
            { type: "columns", content: [column(paragraph("col1")), column(paragraph("col2"))] },
          ],
        },
      ],
    });
    const { sync, a, b } = await pair(seed);
    sync.disconnect();
    const at = (e: Editor, text: string) => {
      let pos = -1;
      e.state.doc.descendants((n, p) => {
        if (pos < 0 && n.isText && n.text === text) pos = p;
      });
      return pos;
    };
    await act(async () => {
      a.editor.commands.insertContentAt(at(a.editor, "callout") + "callout".length, " A");
      a.editor.commands.insertContentAt(at(a.editor, "col1"), "A-");
      b.editor.commands.insertContentAt(at(b.editor, "toggle") + "toggle".length, " B");
      b.editor.commands.insertContentAt(at(b.editor, "col1") + 4, "-B");
      b.editor.commands.insertContentAt(at(b.editor, "col2"), "B2-");
    });
    expect(a.editor.getText()).not.toBe(b.editor.getText());
    await act(async () => sync.connect());
    same(a.editor, b.editor);
    const text = a.editor.getText();
    for (const part of ["callout A", "toggle B", "A-col1-B", "B2-col2"])
      expect(text).toContain(part);
    sync.destroy();
  });

  it("shares the tone, the icon and the open state, and undo is the user's own", async () => {
    const seed = doc(
      { type: "callout", attrs: { tone: "note" }, content: [paragraph("Boxed")] },
      {
        type: "toggle",
        attrs: { open: false },
        content: [summary("Fold"), paragraph("Inside")],
      },
    );
    const { sync, a, b } = await pair(seed);
    await act(async () => {
      a.editor.commands.setTextSelection(3);
      a.editor.commands.setCalloutTone("danger");
      a.editor.commands.setCalloutIcon("🚨");
    });
    expect(b.el.querySelector(".fg-rt-callout")?.getAttribute("data-tone")).toBe("danger");
    expect(b.el.querySelector(".fg-rt-callout-icon")?.textContent).toBe("🚨");

    // Grace opens the toggle: Ada sees it open, the stored node says so.
    const button = b.el.querySelector<HTMLButtonElement>(".fg-rt-toggle-btn");
    expect(a.el.querySelector<HTMLElement>(".fg-rt-toggle")?.dataset["open"]).toBe("false");
    await act(async () => button?.click());
    expect(a.el.querySelector<HTMLElement>(".fg-rt-toggle")?.dataset["open"]).toBe("true");
    expect(json(a.editor).content[1]?.attrs?.["open"]).toBe(true);

    // Ada undoes her own changes (the icon, then the tone); Grace's open state stays.
    await act(async () => void a.editor.commands.undo());
    await act(async () => void a.editor.commands.undo());
    for (const e of [a, b]) {
      expect(e.el.querySelector(".fg-rt-callout")?.getAttribute("data-tone")).toBe("note");
      expect(e.el.querySelector(".fg-rt-callout-icon")?.textContent).toBe("");
    }
    expect(json(b.editor).content[1]?.attrs?.["open"]).toBe(true);
    same(a.editor, b.editor);
    sync.destroy();
  });

  it("undoes the creation of a block and the typing inside it", async () => {
    const { sync, a, b } = await pair(doc(paragraph("Start")));
    await act(async () => {
      a.editor
        .chain()
        .focus("end")
        .insertContent({
          type: "callout",
          attrs: { tone: "info" },
          content: [{ type: "paragraph" }],
        })
        .run();
    });
    // The undo manager groups edits made within half a second: wait to undo them one by one.
    await act(async () => new Promise((r) => setTimeout(r, 600)));
    expect(json(b.editor).content.map((n) => n.type)).toContain("callout");
    await act(async () => void a.editor.commands.insertContent("typed"));
    expect(b.editor.getText()).toContain("typed");
    await act(async () => void a.editor.commands.undo());
    expect(b.editor.getText()).not.toContain("typed");
    expect(json(b.editor).content.map((n) => n.type)).toContain("callout");
    await act(async () => void a.editor.commands.undo());
    expect(json(b.editor).content.map((n) => n.type)).not.toContain("callout");
    same(a.editor, b.editor);
    sync.destroy();
  });

  it("merges two columns added at once: the schema takes the extra one, the commands stop at four", async () => {
    const three = doc({
      type: "columns",
      content: [column(paragraph("1")), column(paragraph("2")), column(paragraph("3"))],
    });
    const { sync, a, b } = await pair(three);
    sync.disconnect();
    await act(async () => {
      a.editor.commands.setTextSelection(posOf(a.editor, "paragraph", 0) + 1);
      a.editor.commands.addColumn();
      b.editor.commands.setTextSelection(posOf(b.editor, "paragraph", 2) + 1);
      b.editor.commands.addColumn();
    });
    await act(async () => sync.connect());
    same(a.editor, b.editor);
    const count = (json(a.editor).content[0] as RichNode).content?.length;
    expect(count).toBe(5);
    // Over the limit after the merge: no further column is added, and one can be removed.
    await act(async () => void a.editor.commands.addColumn());
    expect((json(a.editor).content[0] as RichNode).content).toHaveLength(5);
    await act(async () => void a.editor.commands.removeColumn());
    expect((json(b.editor).content[0] as RichNode).content).toHaveLength(4);
    same(a.editor, b.editor);
    sync.destroy();
  });

  it("removes a column on one side while the other types in another", async () => {
    const three = doc({
      type: "columns",
      content: [column(paragraph("1")), column(paragraph("2")), column(paragraph("3"))],
    });
    const { sync, a, b } = await pair(three);
    sync.disconnect();
    await act(async () => {
      a.editor.commands.setTextSelection(posOf(a.editor, "paragraph", 1) + 1);
      a.editor.commands.removeColumn();
      b.editor.commands.setTextSelection(posOf(b.editor, "paragraph", 2) + 2);
      b.editor.commands.insertContent("x");
    });
    await act(async () => sync.connect());
    same(a.editor, b.editor);
    expect((json(a.editor).content[0] as RichNode).content).toHaveLength(2);
    expect(a.editor.getText()).toContain("3x");
    sync.destroy();
  });

  it("keeps the table of contents in step with the other peer's headings", async () => {
    const seed = doc({ type: "toc" }, heading(1, "One"), paragraph("x"));
    const { sync, a, b } = await pair(seed);
    const links = (el: HTMLElement) =>
      [...el.querySelectorAll<HTMLAnchorElement>(".fg-rt-toc a")].map((x) => x.textContent);
    expect(links(a.el)).toEqual(["One"]);
    await act(async () => {
      b.editor.chain().focus("end").insertContent(heading(2, "Two")).run();
    });
    expect(links(a.el)).toEqual(["One", "Two"]);
    expect(a.el.querySelector("h2")?.id).toBe("two");
    await act(async () => {
      a.editor.commands.setTextSelection(posOf(a.editor, "heading", 0) + 1);
      a.editor.commands.insertContent("Big ");
    });
    expect(links(b.el)).toEqual(["Big One", "Two"]);
    // The stored headings carry no id.
    expect(JSON.stringify(stored(sync.peers[0] as LocalPeer))).not.toContain("big-one");
    sync.destroy();
  });

  it("syncs an emoji as plain text", async () => {
    const { sync, a, b } = await pair(doc(paragraph("Hi ")));
    await act(async () => void a.editor.chain().focus("end").insertContent("🎉").run());
    expect(b.editor.getText()).toBe("Hi 🎉");
    expect(json(b.editor).content[0]?.content?.map((n) => n.type)).toEqual(["text"]);
    sync.destroy();
  });
});
