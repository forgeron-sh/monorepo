// @vitest-environment jsdom
import type { Editor } from "@tiptap/core";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callout } from "../fixtures/callout-editor";
import { callout as calloutCore } from "../fixtures/callout-core";
import {
  type ReferencesChange,
  type RichDoc,
  doc,
  heading,
  normalizeDoc,
  paragraph,
  toHtml,
  toMarkdown,
} from "../index";
import {
  bold,
  bubble,
  contentPlugins,
  editorPresets,
  fullEditorPlugins,
  heading as headingPlugin,
  references,
  slash,
} from "../plugins/editor/index";
import { corePresets } from "../plugins/index";
import { applyBlock, currentBlock } from "../tiptap/commands";
import { buildExtensions, createContext } from "../tiptap/host";
import { RichTextEditor, RichTextView } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;

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
  await act(async () => root?.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
  vi.unstubAllGlobals();
});

async function mountEditor(props: Parameters<typeof RichTextEditor>[0]) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  let editor: Editor | undefined;
  await act(async () =>
    root?.render(h(RichTextEditor, { ...props, onReady: (e: Editor) => (editor = e) })),
  );
  for (let i = 0; i < 5 && !editor; i++) {
    await act(async () => new Promise((r) => setTimeout(r, 10)));
  }
  if (!editor) throw new Error("editor not created");
  return { editor, el: host };
}

const names = (editor: Editor) => editor.extensionManager.extensions.map((e) => e.name);
const ADA = { kind: "user", id: "u_1", label: "Ada" };
const people = [
  { id: "u_1", label: "Ada" },
  { id: "u_2", label: "Grace" },
];

describe("the presets", () => {
  it("are lists of plugins whose core halves are the core presets, in the same order", () => {
    for (const variant of ["full", "minimal"] as const) {
      expect(editorPresets[variant].map((p) => p.core.id)).toEqual(
        corePresets[variant].map((p) => p.id),
      );
    }
    expect(fullEditorPlugins.map((p) => p.core.id)).toContain("blockHandle");
  });
});

describe("the minimal core alone", () => {
  it("has paragraphs, text and a history, nothing else", async () => {
    const { editor } = await mountEditor({ plugins: [] });
    const own = names(editor).filter((n) => !n.startsWith("fg"));
    expect(own).toEqual(
      expect.arrayContaining(["doc", "paragraph", "text", "hardBreak", "undoRedo"]),
    );
    for (const gone of ["bold", "link", "heading", "bulletList", "table", "image", "reference"]) {
      expect(own).not.toContain(gone);
    }
    expect(editor.schema.marks["bold"]).toBeUndefined();
    expect(editor.schema.nodes["heading"]).toBeUndefined();
  });

  it("shows a heading as a placeholder, keeps it in the JSON and keeps the rest editable", async () => {
    const onChange = vi.fn<(d: RichDoc) => void>();
    const start = doc(
      heading(2, "Kept"),
      { type: "futureChart", attrs: { series: [1, 2] } },
      paragraph("Plain"),
    );
    const { editor, el } = await mountEditor({ plugins: [], defaultValue: start, onChange });
    expect(el.querySelectorAll(".fg-rt-unknown")).toHaveLength(2);
    expect(el.querySelector('[data-unknown="heading"]')?.textContent).toContain("heading");
    await act(async () => {
      editor.chain().focus("end").insertContent(" more").run();
    });
    const out = onChange.mock.calls.at(-1)?.[0] as RichDoc;
    expect(out.content[0]).toEqual(start.content[0]);
    expect(out.content[1]).toEqual(start.content[1]);
    expect(JSON.stringify(out.content[2])).toContain("Plain more");
  });
});

describe("an old document with mentions", () => {
  it("opens as references of the kind user, and saves them so", async () => {
    const onChange = vi.fn<(d: RichDoc) => void>();
    const old = doc(
      paragraph("Hi ", { type: "mention", attrs: { id: "u_1", label: "Ada" } }, " there"),
    );
    const { editor, el } = await mountEditor({ defaultValue: old, onChange, mentions: people });
    expect(el.querySelector(".fg-rt-mention")?.textContent).toBe("@Ada");
    await act(async () => {
      editor.chain().focus("end").insertContent("!").run();
    });
    const out = onChange.mock.calls.at(-1)?.[0] as RichDoc;
    expect(out.content[0]?.content?.[1]).toEqual({ type: "reference", attrs: ADA });
    expect(toMarkdown(out)).toContain("[@Ada](mention:u_1)");
  });
});

describe("onReferences", () => {
  it("reports what was added and what was removed, and nothing else", async () => {
    const onReferences = vi.fn<(c: ReferencesChange) => void>();
    const { editor } = await mountEditor({
      defaultValue: doc(paragraph("Start")),
      mentions: people,
      onReferences,
    });
    await act(async () => {
      editor.chain().focus("end").insertContent(" text").run();
    });
    expect(onReferences).not.toHaveBeenCalled();
    await act(async () => {
      editor
        .chain()
        .focus("end")
        .insertContent({ type: "reference", attrs: { kind: "user", id: "u_2", label: "Grace" } })
        .insertContent({ type: "reference", attrs: { kind: "page", id: "p_9", label: "Plan" } })
        .run();
    });
    const added = onReferences.mock.calls.at(-1)?.[0] as ReferencesChange;
    expect(added.added.map((r) => `${r.kind}:${r.id}`)).toEqual(["user:u_2", "page:p_9"]);
    expect(added.removed).toEqual([]);
    expect(onReferences).toHaveBeenCalledTimes(1);
    await act(async () => {
      editor.chain().focus().selectAll().deleteSelection().run();
    });
    const removed = onReferences.mock.calls.at(-1)?.[0] as ReferencesChange;
    expect(removed.removed).toHaveLength(2);
    expect(removed.all).toEqual([]);
  });

  it("does not report the references a controlled value brings", async () => {
    const onReferences = vi.fn<(c: ReferencesChange) => void>();
    const first = doc(paragraph("none"));
    const { el } = await mountEditor({ value: first, onReferences });
    const next = doc(paragraph({ type: "reference", attrs: ADA }));
    await act(async () => root?.render(h(RichTextEditor, { value: next, onReferences })));
    expect(el.querySelector(".fg-rt-mention")).not.toBeNull();
    expect(onReferences).not.toHaveBeenCalled();
  });
});

describe("a provider of another kind", () => {
  it("gets its own trigger character and menu", async () => {
    const pages = {
      kind: "page",
      char: "#",
      items: () => [{ id: "p_1", label: "Roadmap" }],
    };
    const { editor } = await mountEditor({ references: [pages], mentions: people });
    expect(names(editor)).toContain("suggestion-reference-page");
    expect(names(editor)).toContain("suggestion-reference-user");
  });
});

describe("a third-party plugin", () => {
  const plugins = [...fullEditorPlugins, callout];

  it("appears in the slash menu next to the bundled blocks", () => {
    const ctx = createContext({ requestImage: () => undefined });
    const { host: built } = buildExtensions({ plugins, ctx });
    const slashSpec = built.suggestions.find((s) => s.id === "slash");
    if (!slashSpec) throw new Error("no slash menu");
    const ids = async (q: string) =>
      ((await slashSpec.items(q)) as Array<{ id: string }>).map((b) => b.id);
    return Promise.all([ids("note"), ids("")]).then(([note, all]) => {
      expect(note).toEqual(["callout"]);
      expect(all).toContain("callout");
      // The image block waits for a way to ask for a picture.
      expect(all).not.toContain("image");
    });
  });

  it("wraps the text in the editor, and shows in the Markdown and the static view", async () => {
    const { editor, el } = await mountEditor({
      plugins,
      defaultValue: doc(paragraph("Boxed")),
    });
    await act(async () => void applyBlock(editor, "callout"));
    const json = editor.getJSON() as RichDoc;
    expect(json.content[0]?.type).toBe("callout");
    expect(currentBlock(editor)).toBe("callout");
    expect(el.querySelector("aside.fg-rt-callout")?.textContent).toBe("Boxed");
    expect(
      toMarkdown(
        json,
        plugins.map((p) => p.core),
      ).trim(),
    ).toBe(":::callout\nBoxed\n:::");
    expect(
      toHtml(
        json,
        plugins.map((p) => p.core),
      ),
    ).toContain('<aside class="fg-rt-callout">');
  });

  it("is rendered by the read-only view from the core half alone", async () => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    const page = doc({ type: "callout", content: [paragraph("Seen")] });
    await act(async () => root?.render(h(RichTextView, { value: page, plugins: [calloutCore] })));
    expect(host.querySelector("aside.fg-rt-callout")?.textContent).toBe("Seen");
    expect(host.querySelector(".ProseMirror")).toBeNull();
    await act(async () => root?.render(h(RichTextView, { value: page, plugins: [] })));
    expect(host.querySelector('[data-unknown="callout"]')?.textContent).toBe("Seen");
  });
});

describe("plugins on the editor", () => {
  it("add and remove features per instance", async () => {
    const small = [bold, slash];
    const { editor } = await mountEditor({ plugins: small });
    expect(names(editor)).toContain("bold");
    expect(names(editor)).not.toContain("italic");
    expect(editor.schema.nodes["heading"]).toBeUndefined();
    expect(names(editor)).toContain("suggestion-slash");
    // `heading` and `bold` together: the heading's slash entries work.
    await act(async () => root?.unmount());
    root = undefined;
    host?.remove();
    const withHeading = await mountEditor({
      plugins: [headingPlugin, slash],
      defaultValue: doc(paragraph("x")),
    });
    await act(async () => void applyBlock(withHeading.editor, "heading-1"));
    expect(withHeading.editor.getJSON().content?.[0]?.type).toBe("heading");
    // A block no plugin offers does nothing.
    await act(async () => void applyBlock(withHeading.editor, "table"));
    expect(withHeading.editor.getJSON().content?.some((n) => n.type === "table")).toBe(false);
  });

  it("refuses a plugin whose dependency is missing", async () => {
    const { bulletList } = await import("../plugins/editor/index");
    expect(() => buildExtensions({ plugins: [bulletList], ctx: createContext() })).toThrow(
      /requires "listItem"/,
    );
  });

  it("the interface plugins are optional", async () => {
    const { el } = await mountEditor({
      plugins: [...contentPlugins.filter((p) => p !== references)],
      defaultValue: doc(paragraph("x")),
    });
    expect(el.querySelector(".fg-rt-handle")).toBeNull();
    expect(bubble.ui).toHaveLength(1);
  });

  it("normalises like the model does", () => {
    expect(normalizeDoc(doc(paragraph("a")))).toEqual(doc(paragraph("a")));
  });
});
