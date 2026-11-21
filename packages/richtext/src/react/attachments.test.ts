// @vitest-environment jsdom
import type { Editor } from "@tiptap/core";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalSync, fromYDoc } from "../collab/index";
import { type RichDoc, type RichNode, doc, paragraph } from "../index";
import {
  type UploadContext,
  type UploadFn,
  type UploadRejection,
  type UploadResult,
} from "../plugins/attachment";
import { attachmentsCorePlugins } from "../plugins/embed";
import { fullEditorPlugins } from "../plugins/editor/index";
import { attachmentsPlugins } from "../plugins/editor/embed";
import { type UploadController, uploadsOf } from "../plugins/editor/upload";
import { applyBlock } from "../tiptap/commands";
import { createContext, createHost } from "../tiptap/host";
import { fullCorePlugins } from "../plugins/index";
import { RichTextEditor, RichTextView } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const plugins = [...fullEditorPlugins, ...attachmentsPlugins];

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
  document.querySelectorAll("input[data-fg-rt-picker]").forEach((el) => el.remove());
  vi.unstubAllGlobals();
});

async function mount(props: Parameters<typeof RichTextEditor>[0]) {
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

interface Call {
  file: File;
  ctx: UploadContext;
  resolve(result: UploadResult): void;
  reject(error: unknown): void;
}

function fakeUpload() {
  const calls: Call[] = [];
  const upload: UploadFn = (file, ctx) =>
    new Promise((resolve, reject) => calls.push({ file, ctx, resolve, reject }));
  return { calls, upload };
}

const file = (name: string, type: string, size = 100) =>
  new File(["x".repeat(size)], name, { type });

const settle = () => act(async () => new Promise((r) => setTimeout(r, 0)));

function transfer(files: File[], text = "") {
  return {
    files,
    items: [],
    types: files.length ? ["Files"] : ["text/plain"],
    getData: (type: string) => (type === "text/plain" ? text : ""),
  };
}

function drop(editor: Editor, files: File[]) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: transfer(files) });
  editor.view.dom.dispatchEvent(event);
  return event;
}

function paste(editor: Editor, files: File[], text = "") {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: transfer(files, text) });
  editor.view.dom.dispatchEvent(event);
  return event;
}

const cards = (editor: Editor) =>
  Array.from(editor.view.dom.querySelectorAll<HTMLElement>(".fg-rt-pending"));
const types = (editor: Editor) => (editor.getJSON().content ?? []).map((n) => n.type);
const controller = (editor: Editor) => uploadsOf(editor) as UploadController;
const button = (card: HTMLElement, label: string) =>
  Array.from(card.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.getAttribute("aria-label") === label,
  ) as HTMLButtonElement;
const click = (el: HTMLElement) => act(async () => void el.click());

describe("drop and paste", () => {
  it("make the right block for each type, in the order dropped, whatever the order they end in", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    const ev = drop(editor, [
      file("photo.png", "image/png", 10),
      file("song.mp3", "audio/mpeg", 20),
      file("clip.mp4", "video/mp4", 30),
      file("report.pdf", "application/pdf", 2048),
    ]);
    expect(ev.defaultPrevented).toBe(true);
    await settle();
    expect(up.calls.map((c) => c.file.name)).toEqual([
      "photo.png",
      "song.mp3",
      "clip.mp4",
      "report.pdf",
    ]);
    expect(cards(editor)).toHaveLength(4);
    // They end in the reverse order.
    for (const [i, call] of [...up.calls.entries()].reverse()) {
      await act(async () => call.resolve({ src: `https://files.example/${i}` }));
    }
    expect(cards(editor)).toHaveLength(0);
    const content = editor.getJSON().content as RichNode[];
    expect(content.map((n) => n.type)).toEqual([
      "image",
      "audio",
      "video",
      "attachment",
      "paragraph",
    ]);
    expect(content[0]?.attrs).toMatchObject({ src: "https://files.example/0", alt: "photo.png" });
    expect(content[1]?.attrs).toMatchObject({ src: "https://files.example/1", title: "song.mp3" });
    expect(content[2]?.attrs).toMatchObject({ src: "https://files.example/2", title: "clip.mp4" });
    expect(content[3]?.attrs).toEqual({
      src: "https://files.example/3",
      name: "report.pdf",
      size: 2048,
      type: "application/pdf",
    });
  });

  it("uses the name, size and type the app returns", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    drop(editor, [file("raw.bin", "application/octet-stream", 5)]);
    await settle();
    await act(async () =>
      up.calls[0]?.resolve({
        src: "/files/9",
        name: "Quarterly.xlsx",
        size: 77,
        type: "application/vnd.ms-excel",
      }),
    );
    expect(editor.getJSON().content?.[0]?.attrs).toEqual({
      src: "/files/9",
      name: "Quarterly.xlsx",
      size: 77,
      type: "application/vnd.ms-excel",
    });
  });

  it("handle a paste of files, but leave a paste that carries text alone", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    const ev = paste(editor, [file("shot.png", "image/png")], "cells a b c");
    // The text is the browser's and the editor's to paste: no upload starts, no card appears.
    void ev;
    await settle();
    expect(up.calls).toHaveLength(0);
    expect(cards(editor)).toHaveLength(0);
    const ev2 = paste(editor, [file("shot.png", "image/png")]);
    expect(ev2.defaultPrevented).toBe(true);
    await settle();
    expect(up.calls).toHaveLength(1);
    expect(cards(editor)).toHaveLength(1);
    await act(async () => up.calls[0]?.resolve({ src: "/i/1" }));
    // The text of the first paste is on the page; the picture lands after it.
    expect(editor.getText()).toContain("cells a b c");
    expect(types(editor)).toEqual(["paragraph", "image", "paragraph"]);
  });

  it("do nothing without an upload function, or in a read-only editor", async () => {
    const bare = await mount({});
    const ev = drop(bare.editor, [file("a.pdf", "application/pdf")]);
    expect(ev.defaultPrevented).toBe(false);
    expect(cards(bare.editor)).toHaveLength(0);
    const up = fakeUpload();
    const readOnly = await mount({
      editable: false,
      pluginOptions: { upload: { upload: up.upload } },
    });
    drop(readOnly.editor, [file("a.pdf", "application/pdf")]);
    await settle();
    expect(up.calls).toHaveLength(0);
  });

  it("insert after the block the cursor is in, and keep what was typed", async () => {
    const up = fakeUpload();
    const { editor } = await mount({
      defaultValue: doc(paragraph("One"), paragraph("Two")),
      pluginOptions: { upload: { upload: up.upload } },
    });
    await act(async () => void editor.chain().focus().setTextSelection(2).run());
    paste(editor, [file("a.pdf", "application/pdf")]);
    await settle();
    await act(async () => up.calls[0]?.resolve({ src: "/f/a" }));
    expect(types(editor)).toEqual(["paragraph", "attachment", "paragraph"]);
    expect(editor.getText()).toContain("One");
    expect(editor.getText()).toContain("Two");
  });

  it("replace the empty paragraph a slash entry leaves, only that one", async () => {
    const up = fakeUpload();
    const { editor } = await mount({
      defaultValue: doc(paragraph("Intro"), { type: "paragraph" }, paragraph("Outro")),
      pluginOptions: { upload: { upload: up.upload } },
    });
    await act(async () => void editor.chain().focus().setTextSelection(8).run());
    drop(editor, [file("a.pdf", "application/pdf"), file("b.pdf", "application/pdf")]);
    await settle();
    for (const call of up.calls)
      await act(async () => call.resolve({ src: `/f/${call.file.name}` }));
    expect(types(editor)).toEqual(["paragraph", "attachment", "attachment", "paragraph"]);
    expect(editor.getText()).toContain("Outro");
  });
});

describe("while an upload runs", () => {
  it("shows a card with progress and keeps the document and onChange clean", async () => {
    const up = fakeUpload();
    const onChange = vi.fn<(d: RichDoc) => void>();
    const { editor } = await mount({ onChange, pluginOptions: { upload: { upload: up.upload } } });
    const before = JSON.stringify(editor.getJSON());
    drop(editor, [file("report.pdf", "application/pdf", 2048)]);
    await settle();
    const [card] = cards(editor);
    expect(card).toBeDefined();
    expect(card?.dataset["status"]).toBe("uploading");
    expect(card?.textContent).toContain("report.pdf");
    expect(card?.textContent).toContain("2 KB");
    expect(button(card as HTMLElement, "Cancel").hidden).toBe(false);
    expect(button(card as HTMLElement, "Retry").hidden).toBe(true);

    await act(async () => up.calls[0]?.ctx.onProgress(0.42));
    expect(card?.textContent).toContain("42%");
    const bar = card?.querySelector<HTMLElement>("[role=progressbar]");
    expect(bar?.getAttribute("aria-valuenow")).toBe("42");
    expect(bar?.querySelector<HTMLElement>(".fg-rt-progress-bar")?.style.width).toBe("42%");
    await act(async () => up.calls[0]?.ctx.onProgress(7));
    expect(bar?.getAttribute("aria-valuenow")).toBe("100");

    expect(JSON.stringify(editor.getJSON())).toBe(before);
    expect(JSON.stringify(editor.getJSON())).not.toContain("pending");
    expect(onChange).not.toHaveBeenCalled();
    expect(controller(editor).pending()).toHaveLength(1);

    await act(async () => up.calls[0]?.resolve({ src: "/f/report.pdf" }));
    expect(cards(editor)).toHaveLength(0);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(types(editor)).toEqual(["attachment", "paragraph"]);
  });

  it("keeps the card where it was while the document is edited around it", async () => {
    const up = fakeUpload();
    const { editor } = await mount({
      defaultValue: doc(paragraph("Top"), paragraph("Bottom")),
      pluginOptions: { upload: { upload: up.upload } },
    });
    await act(async () => void editor.chain().focus().setTextSelection(2).run());
    drop(editor, [file("a.pdf", "application/pdf")]);
    await settle();
    await act(async () => void editor.chain().insertContentAt(1, "Typed ").run());
    const order = Array.from(editor.view.dom.children).map((c) =>
      c.classList.contains("fg-rt-pending") ? "card" : (c.textContent ?? ""),
    );
    expect(order.slice(0, 3)).toEqual(["Typed Top", "card", "Bottom"]);
    await act(async () => up.calls[0]?.resolve({ src: "/f/a" }));
    expect(types(editor)).toEqual(["paragraph", "attachment", "paragraph"]);
  });

  it("shows a failure with Retry and Remove, and Retry uploads again", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    drop(editor, [file("a.pdf", "application/pdf")]);
    await settle();
    await act(async () => up.calls[0]?.reject(new Error("Storage is full")));
    const [card] = cards(editor) as [HTMLElement];
    expect(card.dataset["status"]).toBe("error");
    expect(card.textContent).toContain("Storage is full");
    expect(card.querySelector("[role=alert]")).not.toBeNull();
    expect(button(card, "Retry").hidden).toBe(false);
    expect(button(card, "Remove").hidden).toBe(false);
    expect(button(card, "Cancel").hidden).toBe(true);
    expect(card.querySelector<HTMLElement>("[role=progressbar]")?.hidden).toBe(true);
    expect(types(editor)).toEqual(["paragraph"]);

    await click(button(card, "Retry"));
    expect(up.calls).toHaveLength(2);
    expect(card.dataset["status"]).toBe("uploading");
    await act(async () => up.calls[1]?.resolve({ src: "/f/a" }));
    expect(cards(editor)).toHaveLength(0);
    expect(types(editor)).toEqual(["attachment", "paragraph"]);
  });

  it("removes a failed upload without a trace", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    drop(editor, [file("a.pdf", "application/pdf")]);
    await settle();
    await act(async () => up.calls[0]?.reject("nope"));
    const [card] = cards(editor) as [HTMLElement];
    expect(card.textContent).toContain("nope");
    await click(button(card, "Remove"));
    expect(cards(editor)).toHaveLength(0);
    expect(controller(editor).pending()).toHaveLength(0);
    expect(JSON.stringify(editor.getJSON())).toBe(
      JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
    );
    // A late answer of the removed upload changes nothing.
    await act(async () => up.calls[0]?.resolve({ src: "/f/late" }));
    expect(types(editor)).toEqual(["paragraph"]);
  });

  it("says a generic message when the upload fails with nothing to say", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    drop(editor, [file("a.pdf", "application/pdf")]);
    await settle();
    await act(async () => up.calls[0]?.reject(undefined));
    expect(cards(editor)[0]?.textContent).toContain("Upload failed");
    await act(async () => void controller(editor).retry(controller(editor).pending()[0]?.id ?? ""));
    await act(async () => up.calls[1]?.resolve({ src: "" }));
    expect(cards(editor)[0]?.textContent).toContain("no address");
  });

  it("aborts on Cancel: the signal fires, the card shows it, Retry is offered", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    drop(editor, [file("a.pdf", "application/pdf")]);
    await settle();
    const [card] = cards(editor) as [HTMLElement];
    await click(button(card, "Cancel"));
    expect(up.calls[0]?.ctx.signal.aborted).toBe(true);
    expect(card.dataset["status"]).toBe("error");
    expect(card.textContent).toContain("Upload cancelled");
    expect(button(card, "Retry").hidden).toBe(false);
    // The function ignores the signal and resolves anyway: nothing is inserted.
    await act(async () => up.calls[0]?.resolve({ src: "/f/a" }));
    expect(types(editor)).toEqual(["paragraph"]);
    expect(card.dataset["status"]).toBe("error");
  });

  it("treats an upload that rejects after an abort as cancelled", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    drop(editor, [file("a.pdf", "application/pdf")]);
    await settle();
    await act(
      async () => void controller(editor).cancel(controller(editor).pending()[0]?.id ?? ""),
    );
    await act(async () => up.calls[0]?.reject(new DOMException("Aborted", "AbortError")));
    expect(cards(editor)[0]?.textContent).toContain("Upload cancelled");
  });

  it("aborts a running upload when it is removed, and all of them when the editor goes away", async () => {
    const up = fakeUpload();
    const { editor, root } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    drop(editor, [file("a.pdf", "application/pdf"), file("b.pdf", "application/pdf")]);
    await settle();
    await act(
      async () => void controller(editor).remove(controller(editor).pending()[0]?.id ?? ""),
    );
    expect(up.calls[0]?.ctx.signal.aborted).toBe(true);
    expect(cards(editor)).toHaveLength(1);
    await act(async () => root.unmount());
    roots = roots.filter((r) => r !== root);
    await act(async () => new Promise((r) => setTimeout(r, 100)));
    expect(up.calls[1]?.ctx.signal.aborted).toBe(true);
  });

  it("does not insert anything when the app's function resolves after the editor is gone", async () => {
    const up = fakeUpload();
    const { editor, root } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    drop(editor, [file("a.pdf", "application/pdf")]);
    await settle();
    await act(async () => root.unmount());
    roots = roots.filter((r) => r !== root);
    await expect(
      (async () => void up.calls[0]?.resolve({ src: "/f/a" }))(),
    ).resolves.toBeUndefined();
  });
});

describe("accept and maxSize", () => {
  it("refuse a type that is not accepted, show it, tell the app, upload nothing", async () => {
    const up = fakeUpload();
    const onReject = vi.fn<(rejections: UploadRejection[]) => void>();
    const { editor } = await mount({
      pluginOptions: { upload: { upload: up.upload, accept: "image/*,.pdf", onReject } },
    });
    drop(editor, [
      file("tool.exe", "application/x-msdownload"),
      file("ok.png", "image/png"),
      file("ok.pdf", ""),
    ]);
    await settle();
    expect(up.calls.map((c) => c.file.name)).toEqual(["ok.png", "ok.pdf"]);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject.mock.calls[0]?.[0]).toEqual([
      { file: expect.objectContaining({ name: "tool.exe" }), reason: "type" },
    ]);
    const refused = cards(editor).find((c) => c.textContent?.includes("tool.exe")) as HTMLElement;
    expect(refused.dataset["status"]).toBe("error");
    expect(refused.textContent).toContain("not an accepted type");
    expect(button(refused, "Retry").hidden).toBe(true);
    expect(button(refused, "Remove").hidden).toBe(false);
    await click(button(refused, "Remove"));
    expect(cards(editor)).toHaveLength(2);
  });

  it("refuse a file over maxSize", async () => {
    const up = fakeUpload();
    const onReject = vi.fn<(rejections: UploadRejection[]) => void>();
    const { editor } = await mount({
      pluginOptions: { upload: { upload: up.upload, maxSize: 1024, onReject } },
    });
    paste(editor, [file("big.pdf", "application/pdf", 5000)]);
    await settle();
    expect(up.calls).toHaveLength(0);
    expect(onReject.mock.calls[0]?.[0]?.[0]).toMatchObject({ reason: "size" });
    expect(cards(editor)[0]?.textContent).toContain("larger than 1 KB");
    expect(types(editor)).toEqual(["paragraph"]);
  });

  it("let a file of exactly maxSize through", async () => {
    const up = fakeUpload();
    const { editor } = await mount({
      pluginOptions: { upload: { upload: up.upload, maxSize: 1024 } },
    });
    paste(editor, [file("edge.pdf", "application/pdf", 1024)]);
    await settle();
    expect(up.calls).toHaveLength(1);
  });
});

describe("the slash entries", () => {
  it("offer File only with an upload function, Audio and Video always", () => {
    const host = (options: Record<string, unknown>) => {
      const ctx = createContext({ options: () => options });
      const built = createHost(plugins, ctx);
      const available = (id: string) =>
        built.slots.blocks.find((b) => b.id === id)?.action.available?.(ctx) !== false;
      return { available, ids: built.slots.blocks.map((b) => b.id) };
    };
    const without = host({});
    expect(without.ids).toEqual(
      expect.arrayContaining(["file", "audio", "video", "embed", "image"]),
    );
    expect(without.available("file")).toBe(false);
    expect(without.available("audio")).toBe(true);
    expect(without.available("video")).toBe(true);
    expect(without.available("embed")).toBe(true);
    expect(without.available("image")).toBe(false);
    const withUpload = host({ upload: { upload: () => Promise.reject(new Error("x")) } });
    expect(withUpload.available("file")).toBe(true);
    expect(withUpload.available("image")).toBe(true);
  });

  it("File opens the file dialog and uploads what is chosen", async () => {
    const up = fakeUpload();
    const { editor } = await mount({
      pluginOptions: { upload: { upload: up.upload, accept: ".pdf" } },
    });
    await act(async () => void editor.chain().focus().insertContent("/fi").run());
    const from = editor.state.selection.from - 3;
    await act(async () => applyBlock(editor, "file", {}, { from, to: from + 3 }));
    const input = document.querySelector<HTMLInputElement>(
      "input[data-fg-rt-picker]",
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.type).toBe("file");
    expect(input.accept).toBe(".pdf");
    expect(input.multiple).toBe(true);
    Object.defineProperty(input, "files", { value: [file("a.pdf", "application/pdf")] });
    await act(async () => void input.dispatchEvent(new Event("change")));
    expect(document.querySelector("input[data-fg-rt-picker]")).toBeNull();
    expect(up.calls).toHaveLength(1);
    expect(editor.getText()).not.toContain("/fi");
    await act(async () => up.calls[0]?.resolve({ src: "/f/a" }));
    expect(types(editor)).toEqual(["attachment", "paragraph"]);
  });

  it("drops the place reserved for a dialog that was cancelled", async () => {
    const up = fakeUpload();
    const { editor } = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    await act(async () => applyBlock(editor, "file"));
    const input = document.querySelector<HTMLInputElement>(
      "input[data-fg-rt-picker]",
    ) as HTMLInputElement;
    await act(async () => void input.dispatchEvent(new Event("cancel")));
    expect(document.querySelector("input[data-fg-rt-picker]")).toBeNull();
    expect(up.calls).toHaveLength(0);
    expect(cards(editor)).toHaveLength(0);
  });

  it("Audio and Video pick audio and video files with an upload, ask for an address without", async () => {
    const up = fakeUpload();
    const withUpload = await mount({ pluginOptions: { upload: { upload: up.upload } } });
    await act(async () => applyBlock(withUpload.editor, "audio"));
    expect(document.querySelector<HTMLInputElement>("input[data-fg-rt-picker]")?.accept).toBe(
      "audio/*",
    );
    document.querySelector("input[data-fg-rt-picker]")?.remove();
    await act(async () => applyBlock(withUpload.editor, "video"));
    expect(document.querySelector<HTMLInputElement>("input[data-fg-rt-picker]")?.accept).toBe(
      "video/*",
    );

    const bare = await mount({});
    await act(async () => applyBlock(bare.editor, "audio"));
    expect(types(bare.editor)).toEqual(["audio", "paragraph"]);
    const form = bare.editor.view.dom.querySelector("form.fg-rt-address") as HTMLFormElement;
    expect(form).not.toBeNull();
    const input = form.querySelector("input") as HTMLInputElement;
    input.value = "javascript:alert(1)";
    await act(async () => void form.dispatchEvent(new Event("submit", { cancelable: true })));
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(bare.editor.getJSON().content?.[0]?.attrs?.["src"] ?? null).toBeNull();
    input.value = "https://files.example/a.mp3";
    await act(async () => void form.dispatchEvent(new Event("submit", { cancelable: true })));
    expect(bare.editor.getJSON().content?.[0]?.attrs).toMatchObject({
      src: "https://files.example/a.mp3",
    });
    expect(bare.editor.view.dom.querySelector("audio")?.getAttribute("src")).toBe(
      "https://files.example/a.mp3",
    );
    expect(bare.editor.view.dom.querySelector("audio")?.hasAttribute("controls")).toBe(true);
  });
});

describe("blocks in the editor", () => {
  const content = doc(
    {
      type: "attachment",
      attrs: {
        src: "https://files.example/r.pdf",
        name: "r.pdf",
        size: 2048,
        type: "application/pdf",
      },
    },
    { type: "audio", attrs: { src: "https://files.example/a.mp3", title: "Podcast" } },
    {
      type: "video",
      attrs: {
        src: "https://files.example/v.mp4",
        poster: "https://files.example/p.jpg",
        title: "Demo",
      },
    },
    { type: "attachment", attrs: { src: "javascript:alert(1)", name: "evil" } },
  );

  it("draw a file card, players and keep the JSON as given", async () => {
    const { editor } = await mount({ defaultValue: content });
    const dom = editor.view.dom;
    const file = dom.querySelector(".fg-rt-file") as HTMLElement;
    expect(file.dataset["kind"]).toBe("pdf");
    expect(file.querySelector(".fg-rt-file-name")?.textContent).toBe("r.pdf");
    expect(file.querySelector(".fg-rt-file-size")?.textContent).toBe("2 KB");
    expect(file.querySelector("svg")).not.toBeNull();
    expect(file.querySelector("a")?.getAttribute("href")).toBe("https://files.example/r.pdf");
    expect(dom.querySelector("audio")?.getAttribute("src")).toBe("https://files.example/a.mp3");
    expect(dom.querySelector("video")?.getAttribute("poster")).toBe("https://files.example/p.jpg");
    expect(dom.querySelector("figcaption")?.textContent).toBe("Podcast");
    const evil = dom.querySelectorAll(".fg-rt-file")[1] as HTMLElement;
    expect(evil.querySelector("a")?.hasAttribute("href")).toBe(false);
    expect(editor.getJSON().content?.slice(0, 3)).toEqual(content.content.slice(0, 3));
  });

  it("are shown by the read-only view from the core halves alone", async () => {
    const el = document.createElement("div");
    document.body.append(el);
    hosts.push(el);
    const root = createRoot(el);
    roots.push(root);
    await act(async () =>
      root.render(
        h(RichTextView, {
          value: content,
          plugins: [...fullCorePlugins, ...attachmentsCorePlugins],
        }),
      ),
    );
    expect(el.querySelector("a.fg-rt-file-link")?.getAttribute("href")).toBe(
      "https://files.example/r.pdf",
    );
    expect(el.querySelector("audio")?.hasAttribute("controls")).toBe(true);
    expect(el.querySelector("video")?.getAttribute("poster")).toBe("https://files.example/p.jpg");
    expect(el.innerHTML).not.toContain("javascript:");
  });
});

describe("embeds", () => {
  const submit = async (editor: Editor, url: string) => {
    const form = editor.view.dom.querySelector("form.fg-rt-address") as HTMLFormElement;
    (form.querySelector("input") as HTMLInputElement).value = url;
    await act(async () => void form.dispatchEvent(new Event("submit", { cancelable: true })));
  };

  it("asks the app to resolve the address and writes the answer into the block", async () => {
    let finish: (preview: object) => void = () => undefined;
    const resolveEmbed = vi.fn<(url: string, signal?: AbortSignal) => Promise<object>>(
      () => new Promise<object>((resolve) => (finish = resolve)),
    );
    const { editor } = await mount({ pluginOptions: { embed: { resolveEmbed } } });
    await act(async () => applyBlock(editor, "embed"));
    expect(types(editor)).toEqual(["embed", "paragraph"]);
    await submit(editor, "example.com/post");
    expect(resolveEmbed).toHaveBeenCalledTimes(1);
    expect(resolveEmbed.mock.calls[0]?.[0]).toBe("https://example.com/post");
    expect(resolveEmbed.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
    expect(editor.view.dom.querySelector(".fg-rt-embed-host")?.textContent).toBe("Loading preview");
    expect(editor.getJSON().content?.[0]?.attrs).toMatchObject({ url: "https://example.com/post" });
    await act(async () =>
      finish({
        title: "A post",
        description: "About things",
        image: "https://cdn.example/card.png",
      }),
    );
    expect(editor.getJSON().content?.[0]?.attrs).toEqual({
      url: "https://example.com/post",
      title: "A post",
      description: "About things",
      image: "https://cdn.example/card.png",
    });
    const dom = editor.view.dom;
    expect(dom.querySelector(".fg-rt-embed-title")?.textContent).toBe("A post");
    expect(dom.querySelector(".fg-rt-embed-description")?.textContent).toBe("About things");
    expect(dom.querySelector("a.fg-rt-embed-link")?.getAttribute("href")).toBe(
      "https://example.com/post",
    );
    expect(dom.querySelector("img.fg-rt-embed-image")?.getAttribute("src")).toBe(
      "https://cdn.example/card.png",
    );
    expect(dom.querySelector(".fg-rt-embed-host")?.textContent).toBe("example.com");
  });

  it("keeps the address when the resolver fails, and never stores an unsafe picture", async () => {
    const failing = await mount({
      pluginOptions: { embed: { resolveEmbed: () => Promise.reject(new Error("offline")) } },
    });
    await act(async () => applyBlock(failing.editor, "embed"));
    await submit(failing.editor, "https://example.com");
    expect(failing.editor.getJSON().content?.[0]?.attrs).toMatchObject({
      url: "https://example.com",
    });
    expect(failing.editor.getJSON().content?.[0]?.attrs?.["title"] ?? null).toBeNull();
    expect(failing.editor.view.dom.querySelector(".fg-rt-embed-host")?.textContent).toBe(
      "No preview available",
    );

    const unsafe = await mount({
      pluginOptions: {
        embed: { resolveEmbed: async () => ({ title: "T", image: "javascript:alert(1)" }) },
      },
    });
    await act(async () => applyBlock(unsafe.editor, "embed"));
    await submit(unsafe.editor, "https://example.com");
    await settle();
    expect(unsafe.editor.getJSON().content?.[0]?.attrs).toMatchObject({
      url: "https://example.com",
      title: "T",
      image: null,
    });
  });

  it("works with no resolver, refuses an address that can run code, and is read as is", async () => {
    const { editor } = await mount({});
    await act(async () => applyBlock(editor, "embed"));
    await submit(editor, "javascript:alert(1)");
    expect(editor.view.dom.querySelector("[aria-invalid=true]")).not.toBeNull();
    expect(editor.getJSON().content?.[0]?.attrs?.["url"] ?? null).toBeNull();
    await submit(editor, "https://example.com/x");
    expect(editor.getJSON().content?.[0]?.attrs).toMatchObject({ url: "https://example.com/x" });
    expect(editor.view.dom.querySelector(".fg-rt-embed-title")?.textContent).toBe(
      "https://example.com/x",
    );
  });

  it("does not write a late answer into a block whose address changed", async () => {
    let finish: (preview: object) => void = () => undefined;
    const { editor } = await mount({
      pluginOptions: { embed: { resolveEmbed: () => new Promise<object>((r) => (finish = r)) } },
    });
    await act(async () => applyBlock(editor, "embed"));
    await submit(editor, "https://example.com/one");
    await act(async () => {
      const pos = 0;
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(pos, undefined, { url: "https://example.com/two" }),
      );
    });
    await act(async () => finish({ title: "Stale" }));
    expect(editor.getJSON().content?.[0]?.attrs).toMatchObject({
      url: "https://example.com/two",
      title: null,
    });
  });
});

describe("collaboration", () => {
  async function peer(
    p: { doc: import("yjs").Doc; awareness: unknown },
    name: string,
    options?: Record<string, unknown>,
  ) {
    return mount({
      collaboration: {
        doc: p.doc,
        provider: { awareness: p.awareness },
        user: { name, color: "#808080" },
      },
      ...(options ? { pluginOptions: options } : {}),
    });
  }

  it("keeps a pending upload local to the uploader and converges when it ends", async () => {
    const up = fakeUpload();
    const sync = createLocalSync(2);
    const [pa, pb] = sync.peers as [(typeof sync.peers)[number], (typeof sync.peers)[number]];
    const a = await peer(pa, "Ada", { upload: { upload: up.upload } });
    const b = await peer(pb, "Grace");
    await act(async () => void a.editor.chain().focus().insertContent("first").run());
    expect(b.editor.getText()).toContain("first");

    paste(a.editor, [file("report.pdf", "application/pdf", 10)]);
    await settle();
    expect(cards(a.editor)).toHaveLength(1);
    // Nobody else sees it, and it is in nobody's document.
    expect(cards(b.editor)).toHaveLength(0);
    expect(types(a.editor)).toEqual(["paragraph"]);
    expect(types(b.editor)).toEqual(["paragraph"]);
    expect(JSON.stringify(fromYDoc(pb.doc, undefined, plugins))).not.toContain("attachment");

    // The other person edits above it: the card keeps its place after "first".
    await act(async () => void b.editor.chain().focus("start").insertContent("B-").run());
    expect(a.editor.getText()).toContain("B-first");
    const order = Array.from(a.editor.view.dom.children).map((c) =>
      c.classList.contains("fg-rt-pending") ? "card" : (c.textContent ?? ""),
    );
    expect(order[0]).toBe("B-first");
    expect(order[1]).toBe("card");

    await act(async () => up.calls[0]?.ctx.onProgress(0.5));
    expect(cards(b.editor)).toHaveLength(0);

    await act(async () => up.calls[0]?.resolve({ src: "https://files.example/report.pdf" }));
    expect(cards(a.editor)).toHaveLength(0);
    expect(types(a.editor)).toEqual(["paragraph", "attachment", "paragraph"]);
    expect(types(b.editor)).toEqual(["paragraph", "attachment", "paragraph"]);
    expect(a.editor.getJSON()).toEqual(b.editor.getJSON());
    expect(JSON.stringify(fromYDoc(pa.doc, undefined, plugins))).toBe(
      JSON.stringify(fromYDoc(pb.doc, undefined, plugins)),
    );
    expect(fromYDoc(pb.doc, undefined, plugins).content[1]?.attrs).toMatchObject({
      src: "https://files.example/report.pdf",
      name: "report.pdf",
    });
    sync.destroy();
  });

  it("leaves the shared document alone when an upload fails", async () => {
    const up = fakeUpload();
    const sync = createLocalSync(2);
    const [pa, pb] = sync.peers as [(typeof sync.peers)[number], (typeof sync.peers)[number]];
    const a = await peer(pa, "Ada", { upload: { upload: up.upload } });
    const b = await peer(pb, "Grace");
    paste(a.editor, [file("a.png", "image/png")]);
    await settle();
    await act(async () => up.calls[0]?.reject(new Error("no")));
    expect(cards(a.editor)).toHaveLength(1);
    expect(a.editor.getJSON()).toEqual(b.editor.getJSON());
    await click(button(cards(a.editor)[0] as HTMLElement, "Remove"));
    expect(a.editor.getJSON()).toEqual(b.editor.getJSON());
    sync.destroy();
  });
});
