// @vitest-environment jsdom
import type { Editor } from "@tiptap/core";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalSync, createYDoc, fromYDoc, toYDoc } from "../collab/index";
import {
  type ReferenceItem,
  type ReferencesChange,
  type RichDoc,
  doc,
  paragraph,
  referencesOf,
  toMarkdown,
} from "../index";
import { fullCorePlugins } from "../plugins/index";
import { datesEditor } from "../plugins/editor/dates";
import { contentPlugins } from "../plugins/editor/index";
import { pagesEditor } from "../plugins/editor/pages";
import { tagsEditor } from "../plugins/editor/tags";
import type { EditorPlugin } from "../tiptap/plugin";
import { datesPanel } from "./date-panel";
import { RichTextEditor } from "./index";

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

async function mount(props: Parameters<typeof RichTextEditor>[0]): Promise<Editor> {
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
  return editor;
}

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
const lastChange = (fn: { mock: { calls: ReferencesChange[][] } }): ReferencesChange => {
  const call = fn.mock.calls.at(-1);
  if (!call?.[0]) throw new Error("onReferences was not called");
  return call[0];
};
const refsOf = (editor: Editor) => referencesOf(editor.getJSON() as RichDoc);

const PAGES = [
  { id: "p_1", label: "Launch plan", hint: "Projects" },
  { id: "p_2", label: "Retro" },
];
const search = vi.fn<(q: string) => ReferenceItem[]>((q) =>
  PAGES.filter((p) => p.label.toLowerCase().includes(q.trim().toLowerCase())),
);
const TAGS = [{ id: "t_1", label: "urgent" }];
const NOW = new Date(2026, 10, 20, 9, 30); // Friday 2026-11-20

const base: ReadonlyArray<EditorPlugin> = contentPlugins;

describe("pages: [[", () => {
  it("opens the menu on the trigger, filters while typing and inserts a chip on pick", async () => {
    const plugins = [...base, pagesEditor({ search })];
    const editor = await mount({ plugins, defaultValue: doc(paragraph("See ")) });
    await type(editor, "[[");
    await wait();
    expect(menu()).not.toBeNull();
    expect(labels()).toEqual(["Launch plan", "Retro"]);
    await type(editor, "Re");
    await wait();
    expect(search).toHaveBeenLastCalledWith("Re");
    expect(labels()).toEqual(["Retro"]);
    await pick(0);
    expect(menu()).toBeNull();
    expect(refsOf(editor)).toEqual([{ kind: "page", id: "p_2", label: "Retro" }]);
    expect(editor.getText()).not.toContain("[[");
    expect(toMarkdown(editor.getJSON() as RichDoc)).toContain("[Retro](ref:page:p_2)");
  });

  it("finds a page whose title has spaces", async () => {
    const editor = await mount({
      plugins: [...base, pagesEditor({ search })],
      defaultValue: doc(paragraph("x ")),
    });
    await type(editor, "[[launch pl");
    await wait();
    expect(labels()).toEqual(["Launch plan"]);
  });

  it("says so when nothing matches, and offers nothing without a search source", async () => {
    const editor = await mount({
      plugins: [...base, pagesEditor({ search: () => [], empty: "Nothing here" })],
      defaultValue: doc(paragraph("x ")),
    });
    await type(editor, "[[zzz");
    await wait();
    expect(document.body.textContent).toContain("Nothing here");
  });

  it("is not part of an editor that does not list it", async () => {
    const editor = await mount({ plugins: base, defaultValue: doc(paragraph("x ")) });
    await type(editor, "[[");
    await wait();
    expect(menu()).toBeNull();
  });

  it("does not open inside a code block", async () => {
    const editor = await mount({
      plugins: [...base, pagesEditor({ search })],
      defaultValue: doc({
        type: "codeBlock",
        content: [{ type: "text", text: "a " }],
      }),
    });
    await type(editor, "[[");
    await wait();
    expect(menu()).toBeNull();
  });
});

describe("tags: #", () => {
  it("suggests existing tags and inserts the picked one", async () => {
    const editor = await mount({
      plugins: [...base, tagsEditor({ search: (q) => TAGS.filter((t) => t.label.startsWith(q)) })],
      defaultValue: doc(paragraph("Mark ")),
    });
    await type(editor, "#ur");
    await wait();
    expect(labels()).toEqual(["#urgent"]);
    await pick(0);
    expect(refsOf(editor)).toEqual([{ kind: "tag", id: "t_1", label: "urgent" }]);
    expect(toMarkdown(editor.getJSON() as RichDoc)).toContain("[urgent](ref:tag:t_1)");
  });

  it("creates a tag from the typed text with onCreate, and not when it exists or when not allowed", async () => {
    const onCreate = vi.fn<(label: string) => ReferenceItem>((label) => ({
      id: `t_${label}`,
      label,
    }));
    const editor = await mount({
      plugins: [
        ...base,
        tagsEditor({ search: (q) => TAGS.filter((t) => t.label.startsWith(q)), onCreate }),
      ],
      defaultValue: doc(paragraph("Mark ")),
    });
    await type(editor, "#urgent");
    await wait();
    expect(labels()).toEqual(["#urgent"]); // exists: no creation row
    await type(editor, "er");
    await wait();
    expect(labels()).toEqual(["Create #urgenter"]);
    await pick(0);
    expect(onCreate).toHaveBeenCalledWith("urgenter");
    expect(refsOf(editor)).toEqual([{ kind: "tag", id: "t_urgenter", label: "urgenter" }]);
    expect(editor.getText()).not.toContain("#urgenter");

    const closed = await mount({
      plugins: [...base, tagsEditor({ search: () => [] })],
      defaultValue: doc(paragraph("x ")),
    });
    await type(closed, "#fresh");
    await wait();
    expect(labels()).toEqual([]);
  });

  it("waits for an asynchronous onCreate and replaces the typed text", async () => {
    let finish: (v: { id: string; label: string } | null) => void = () => undefined;
    const editor = await mount({
      plugins: [...base, tagsEditor({ onCreate: () => new Promise((r) => (finish = r)) })],
      defaultValue: doc(paragraph("Mark ")),
    });
    await type(editor, "#slow");
    await wait();
    await pick(0);
    expect(refsOf(editor)).toEqual([]);
    await act(async () => finish({ id: "t_slow", label: "slow" }));
    await wait();
    expect(refsOf(editor)).toEqual([{ kind: "tag", id: "t_slow", label: "slow" }]);
    expect(editor.getText()).not.toContain("#slow");
  });

  it("leaves the typed text when the creation is cancelled", async () => {
    const editor = await mount({
      plugins: [...base, tagsEditor({ onCreate: () => null })],
      defaultValue: doc(paragraph("Mark ")),
    });
    await type(editor, "#nope");
    await wait();
    await pick(0);
    expect(refsOf(editor)).toEqual([]);
    expect(editor.getText()).toContain("#nope");
  });
});

describe("dates: !", () => {
  const dates = (extra: Parameters<typeof datesEditor>[0] = {}) =>
    datesEditor({ today: () => NOW, ...extra });

  it("offers today, tomorrow, next week and the picker, then inserts the shortcut", async () => {
    const editor = await mount({
      plugins: [...base, dates(), datesPanel],
      defaultValue: doc(paragraph("Due ")),
    });
    await type(editor, "!");
    await wait();
    expect(labels()).toEqual(["Today", "Tomorrow", "Next week", "Pick a date…"]);
    await pick(1);
    expect(refsOf(editor)).toEqual([{ kind: "date", id: "2026-11-21", label: "2026-11-21" }]);
    expect(toMarkdown(editor.getJSON() as RichDoc)).toContain("[2026-11-21](ref:date:2026-11-21)");
  });

  it("filters typed shortcuts, weekdays, offsets and a typed ISO date", async () => {
    const editor = await mount({
      plugins: [...base, dates(), datesPanel],
      defaultValue: doc(paragraph("Due ")),
    });
    await type(editor, "!to");
    await wait();
    expect(labels()).toEqual(["Today", "Tomorrow"]);
    await type(editor, "day");
    await wait();
    expect(labels()).toEqual(["Today"]);
    await pick(0);
    expect(refsOf(editor)[0]?.id).toBe("2026-11-20");

    await type(editor, "!fri");
    await wait();
    expect(labels()).toEqual(["Friday"]);
    await type(editor, "day");
    await pick(0);
    expect(refsOf(editor).map((r) => r.id)).toEqual(["2026-11-20", "2026-11-27"]);

    await type(editor, "!+3");
    await wait();
    expect(labels()).toEqual(["2026-11-23"]);
    await type(editor, "d");
    await pick(0);

    await type(editor, "!2026-12-01T14:30");
    await wait();
    expect(labels()).toEqual(["2026-12-01 14:30"]);
    await pick(0);
    expect(refsOf(editor).map((r) => r.id)).toEqual([
      "2026-11-20",
      "2026-11-27",
      "2026-11-23",
      "2026-12-01T14:30",
    ]);
  });

  it("writes the label with the app's format", async () => {
    const editor = await mount({
      plugins: [
        ...base,
        dates({
          format: ({ date, time }) =>
            `le ${date.split("-").reverse().join("/")}${time ? ` à ${time}` : ""}`,
        }),
      ],
      defaultValue: doc(paragraph("Due ")),
    });
    await type(editor, "!tomorrow");
    await wait();
    await pick(0);
    expect(refsOf(editor)).toEqual([{ kind: "date", id: "2026-11-21", label: "le 21/11/2026" }]);
  });

  it("says a typed word that is no date matches nothing", async () => {
    const editor = await mount({
      plugins: [...base, dates(), datesPanel],
      defaultValue: doc(paragraph("Due ")),
    });
    await type(editor, "!zzz");
    await wait();
    expect(labels()).toEqual([]);
    expect(document.body.textContent).toContain("Not a date");
  });

  it("opens a calendar panel, picks a day and a time, and inserts the chip", async () => {
    const editor = await mount({
      plugins: [...base, dates(), datesPanel],
      defaultValue: doc(paragraph("Due ")),
    });
    await type(editor, "!");
    await wait();
    await pick(3);
    expect(menu()).toBeNull();
    const panel = document.querySelector('[role="dialog"]');
    expect(panel).not.toBeNull();
    expect(editor.getText()).not.toContain("!");
    const insert = [...document.querySelectorAll("button")].find((b) => b.textContent === "Insert");
    expect(insert?.disabled).toBe(true);
    await act(async () =>
      document.querySelector<HTMLButtonElement>('[data-day="2026-11-25"]')?.click(),
    );
    expect(insert?.disabled).toBe(false);
    await act(async () => insert?.click());
    await wait();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(refsOf(editor)).toEqual([{ kind: "date", id: "2026-11-25", label: "2026-11-25" }]);
  });

  it("closes the panel with Escape and inserts nothing", async () => {
    const editor = await mount({
      plugins: [...base, dates(), datesPanel],
      defaultValue: doc(paragraph("Due ")),
    });
    await type(editor, "!");
    await wait();
    await pick(3);
    const grid = document.querySelector('[role="grid"]') as HTMLElement;
    await act(async () => {
      grid.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(refsOf(editor)).toEqual([]);
  });

  it("marks an overdue chip with fg-rt-past, and only that one", async () => {
    const editor = await mount({
      plugins: [...base, dates({ isPast: (p) => p.date < "2026-11-20" })],
      defaultValue: doc(
        paragraph(
          { type: "reference", attrs: { kind: "date", id: "2026-11-01", label: "Nov 1" } },
          " ",
          { type: "reference", attrs: { kind: "date", id: "2026-12-01", label: "Dec 1" } },
        ),
      ),
    });
    const chips = [...editor.view.dom.querySelectorAll('[data-type="reference"]')];
    expect(chips.map((c) => c.classList.contains("fg-rt-past"))).toEqual([true, false]);
  });
});

describe("onReferences", () => {
  it("reports the added and removed references of each kind", async () => {
    const onReferences = vi.fn<(c: ReferencesChange) => void>();
    const editor = await mount({
      plugins: [...base, pagesEditor({ search }), tagsEditor(), datesEditor({ today: () => NOW })],
      defaultValue: doc(paragraph("x ")),
      onReferences,
    });
    expect(onReferences).not.toHaveBeenCalled();

    const kinds = [
      { kind: "page", id: "p_1", label: "Launch plan" },
      { kind: "tag", id: "t_1", label: "urgent" },
      { kind: "date", id: "2026-11-20", label: "2026-11-20" },
    ];
    for (const attrs of kinds) {
      await act(async () => {
        editor.chain().focus("end").insertContent({ type: "reference", attrs }).run();
      });
      expect(lastChange(onReferences).added).toEqual([attrs]);
    }
    expect(onReferences).toHaveBeenCalledTimes(3);
    expect(lastChange(onReferences).all).toEqual(kinds);

    await act(async () => {
      editor.commands.setContent(doc(paragraph("gone")));
    });
    const removed = lastChange(onReferences);
    expect(removed.removed).toEqual(kinds);
    expect(removed.all).toEqual([]);
  });

  it("reports a chip made by the menu as well", async () => {
    const onReferences = vi.fn<(c: ReferencesChange) => void>();
    const editor = await mount({
      plugins: [...base, tagsEditor({ onCreate: (label) => ({ id: label, label }) })],
      defaultValue: doc(paragraph("x ")),
      onReferences,
    });
    await type(editor, "#new");
    await wait();
    await pick(0);
    expect(lastChange(onReferences).added).toEqual([{ kind: "tag", id: "new", label: "new" }]);
  });
});

describe("collaboration", () => {
  it("converges with a reference of each kind, and reads back in both editors", async () => {
    const plugins = [...base, pagesEditor({ search }), tagsEditor(), datesEditor()];
    const seed = doc(paragraph("Start"));
    const sync = createLocalSync(2, [toYDoc(seed, undefined, plugins), createYDoc()]);
    const [pa, pb] = sync.peers as [(typeof sync.peers)[number], (typeof sync.peers)[number]];
    const mountPeer = (peer: typeof pa, name: string) =>
      mount({
        plugins,
        collaboration: {
          doc: peer.doc,
          provider: { awareness: peer.awareness },
          user: { name, color: "#808080" },
        },
      });
    const a = await mountPeer(pa, "Ada");
    const b = await mountPeer(pb, "Grace");

    await act(async () => {
      a.chain()
        .focus("end")
        .insertContent([
          { type: "reference", attrs: { kind: "page", id: "p_1", label: "Launch plan" } },
          { type: "reference", attrs: { kind: "tag", id: "t_1", label: "urgent" } },
        ])
        .run();
    });
    await act(async () => {
      b.chain()
        .focus("end")
        .insertContent({
          type: "reference",
          attrs: { kind: "date", id: "2026-11-21T14:30", label: "2026-11-21 14:30" },
        })
        .run();
    });
    await wait();
    const ids = (e: Editor) => refsOf(e).map((r) => `${r.kind}:${r.id}`);
    expect(ids(a).sort()).toEqual(["date:2026-11-21T14:30", "page:p_1", "tag:t_1"]);
    expect(ids(b).sort()).toEqual(ids(a).sort());
    expect(JSON.stringify(a.getJSON())).toBe(JSON.stringify(b.getJSON()));
    const saved = fromYDoc(pa.doc, undefined, plugins);
    expect(
      referencesOf(saved)
        .map((r) => r.kind)
        .sort(),
    ).toEqual(["date", "page", "tag"]);
    sync.destroy();
  });
});

describe("the date panel", () => {
  it("is a plugin of the interface that needs the dates plugin", async () => {
    expect(datesPanel.core.requires).toEqual(["dates"]);
    await expect(mount({ plugins: [...base, datesPanel] })).rejects.toThrow(/requires "dates"/);
  });

  it("is not drawn without it: the row opens nothing", async () => {
    const editor = await mount({
      plugins: [...base, datesEditor({ today: () => NOW })],
      defaultValue: doc(paragraph("Due ")),
    });
    await type(editor, "!");
    await wait();
    await pick(3);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("a read-only place", () => {
  it("lists the core halves without any editor code", () => {
    expect(fullCorePlugins.some((p) => p.id === "pages")).toBe(false);
    expect(pagesEditor({ search }).core.requires).toEqual(["references"]);
  });
});
