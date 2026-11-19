// @vitest-environment jsdom
import type { Editor } from "@tiptap/core";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { doc, emptyDoc, heading, paragraph, text, type RichDoc } from "../core/model";
import { moveBlock } from "./block-handle";
import { applyBlock, currentBlock } from "../tiptap/commands";
import { RichTextEditor, RichTextView } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;

beforeEach(() => {
  // jsdom has no layout: ProseMirror measures ranges, so give them empty boxes.
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

async function mount(node: ReturnType<typeof h>) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root?.render(node));
  return host;
}

async function mountEditor(props: Parameters<typeof RichTextEditor>[0]) {
  let editor: Editor | undefined;
  const el = await mount(h(RichTextEditor, { ...props, onReady: (e: Editor) => (editor = e) }));
  for (let i = 0; i < 5 && !editor; i++) {
    await act(async () => new Promise((r) => setTimeout(r, 10)));
  }
  if (!editor) throw new Error("editor not created");
  return { editor, el };
}

describe("RichTextEditor", () => {
  it("shows the starting content and reports edits as JSON", async () => {
    const onChange = vi.fn<(doc: RichDoc) => void>();
    const start = doc(heading(1, "Hello"), paragraph("World"));
    const { editor, el } = await mountEditor({ defaultValue: start, onChange });
    expect(el.querySelector("h1")?.textContent).toBe("Hello");
    await act(async () => {
      editor.chain().focus("end").insertContent(" again").run();
    });
    const last = onChange.mock.calls.at(-1)?.[0] as RichDoc;
    expect(last.type).toBe("doc");
    expect(JSON.stringify(last)).toContain("World again");
  });

  it("follows a controlled value without echoing it", async () => {
    const onChange = vi.fn<(doc: RichDoc) => void>();
    const first = doc(paragraph("one"));
    const { editor, el } = await mountEditor({ value: first, onChange });
    expect(editor.getText()).toBe("one");
    await act(async () =>
      root?.render(h(RichTextEditor, { value: doc(paragraph("two")), onChange })),
    );
    expect(el.textContent).toContain("two");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("types marks through shortcuts of the schema", async () => {
    const { editor } = await mountEditor({ defaultValue: emptyDoc() });
    await act(async () => {
      editor.chain().focus().toggleBold().insertContent("strong").run();
    });
    expect(editor.getJSON().content?.[0]?.content?.[0]).toMatchObject({
      text: "strong",
      marks: [{ type: "bold" }],
    });
  });

  it("is read-only when not editable", async () => {
    const { editor, el } = await mountEditor({
      defaultValue: doc(paragraph("fixed")),
      editable: false,
    });
    expect(editor.isEditable).toBe(false);
    expect(el.querySelector(".fg-rt-handle")).toBeNull();
  });

  it("minimal variant keeps lists and marks but not headings or tables", async () => {
    const { editor } = await mountEditor({ variant: "minimal" });
    const names = editor.extensionManager.extensions.map((e) => e.name);
    expect(names).toContain("bulletList");
    expect(names).toContain("taskList");
    expect(names).toContain("bold");
    expect(names).not.toContain("heading");
    expect(names).not.toContain("table");
    expect(names).not.toContain("codeBlock");
  });

  it("drops history and adds collaboration when a doc is given", async () => {
    const { createYDoc } = await import("../collab/index");
    const ydoc = createYDoc();
    const { editor } = await mountEditor({ collaboration: { doc: ydoc } });
    const names = editor.extensionManager.extensions.map((e) => e.name);
    expect(names).toContain("collaboration");
    expect(names).not.toContain("undoRedo");
  });

  it("mentions only exist when a source is given", async () => {
    // A mention is the reference of the kind `user` (D-152).
    const without = await mountEditor({});
    expect(without.editor.extensionManager.extensions.map((e) => e.name)).not.toContain(
      "suggestion-reference-user",
    );
    await act(async () => root?.unmount());
    root = undefined;
    host?.remove();
    const withList = await mountEditor({ mentions: [{ id: "1", label: "Ada" }] });
    const names = withList.editor.extensionManager.extensions.map((e) => e.name);
    expect(names).toContain("reference");
    expect(names).toContain("suggestion-reference-user");
  });
});

describe("block operations", () => {
  const texts = (editor: Editor) =>
    (editor.getJSON() as RichDoc).content.map((n) => n.content?.[0]?.text);

  it("moves a block up and down among its siblings", async () => {
    const { editor } = await mountEditor({
      defaultValue: doc(paragraph("a"), paragraph("b"), paragraph("c")),
    });
    const pos = (i: number) => {
      let at = 0;
      editor.state.doc.forEach((node, offset, index) => {
        if (index === i) at = offset;
      });
      return at;
    };
    await act(async () => void moveBlock(editor, pos(1), "up"));
    expect(texts(editor)).toEqual(["b", "a", "c"]);
    await act(async () => void moveBlock(editor, pos(1), "down"));
    expect(texts(editor)).toEqual(["b", "c", "a"]);
    expect(moveBlock(editor, pos(0), "up")).toBe(false);
    expect(moveBlock(editor, pos(2), "down")).toBe(false);
  });

  it("turns a paragraph into a heading and a list, and back", async () => {
    const { editor } = await mountEditor({ defaultValue: doc(paragraph("x")) });
    await act(async () => void applyBlock(editor, "heading-2"));
    expect(editor.getJSON().content?.[0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
    expect(currentBlock(editor)).toBe("heading-2");
    await act(async () => void applyBlock(editor, "task-list"));
    expect(editor.getJSON().content?.[0]?.type).toBe("taskList");
    await act(async () => void applyBlock(editor, "bullet-list"));
    expect(editor.getJSON().content?.[0]?.type).toBe("bulletList");
    await act(async () => void applyBlock(editor, "paragraph"));
    expect(editor.getJSON().content?.[0]?.type).toBe("paragraph");
  });

  it("inserts a divider and a table", async () => {
    const { editor } = await mountEditor({ defaultValue: doc(paragraph("x")) });
    await act(async () => void applyBlock(editor, "divider"));
    expect(editor.getJSON().content?.some((n) => n.type === "horizontalRule")).toBe(true);
    await act(async () => void applyBlock(editor, "table"));
    expect(editor.getJSON().content?.some((n) => n.type === "table")).toBe(true);
  });

  it("asks for an image only when a request handler exists", async () => {
    const { editor } = await mountEditor({ defaultValue: doc(paragraph("x")) });
    await act(async () => void applyBlock(editor, "image"));
    expect(editor.getJSON().content?.some((n) => n.type === "image")).toBe(false);
    await act(async () => {
      applyBlock(editor, "image", {
        requestImage: async () => ({ src: "https://example.com/a.png", alt: "a" }),
      });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(editor.getJSON().content?.some((n) => n.type === "image")).toBe(true);
  });
});

describe("RichTextView", () => {
  it("renders the static tree without an editor", async () => {
    const el = await mount(
      h(RichTextView, {
        value: doc(heading(2, "Title"), paragraph(text("bold", "bold"), " tail"), {
          type: "taskList",
          content: [{ type: "taskItem", attrs: { checked: true }, content: [paragraph("done")] }],
        }),
      }),
    );
    expect(el.querySelector("h2")?.textContent).toBe("Title");
    expect(el.querySelector("strong")?.textContent).toBe("bold");
    const box = el.querySelector("input") as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(el.querySelector(".ProseMirror")).toBeNull();
  });
});
