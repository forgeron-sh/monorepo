// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import type { Editor } from "@tiptap/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { doc, heading, paragraph, text } from "../core/model";
import { callout } from "../fixtures/callout-editor";
import { contentPlugins } from "../plugins/editor/index";
import { RichTextEditor } from "../react/editor";
import type { EditorPlugin } from "../tiptap/plugin";
import { type LocalPeer, createLocalSync, createYDoc, fromYDoc, toYDoc } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("JSON <-> Y.Doc", () => {
  it("round-trips a document", () => {
    const d = doc(heading(2, "Plan"), paragraph("Hello ", text("world", "bold")), {
      type: "taskList",
      content: [{ type: "taskItem", attrs: { checked: true }, content: [paragraph("x")] }],
    });
    const back = fromYDoc(toYDoc(d));
    expect(JSON.stringify(back)).toContain("Hello ");
    expect(back.content.map((n) => n.type)).toEqual(["heading", "paragraph", "taskList"]);
    expect(back.content[0]?.attrs?.["level"]).toBe(2);
    expect(back.content[2]?.content?.[0]?.attrs?.["checked"]).toBe(true);
  });

  it("reads an empty Y.Doc as the empty document", () => {
    expect(fromYDoc(createYDoc()).content).toEqual([{ type: "paragraph" }]);
  });

  it("uses another field name", () => {
    const y = toYDoc(doc(paragraph("a")), "notes");
    expect(fromYDoc(y, "notes").content[0]?.content?.[0]?.text).toBe("a");
    expect(fromYDoc(y).content).toEqual([{ type: "paragraph" }]);
  });
});

describe("local sync", () => {
  it("relays edits both ways and converges after a split", () => {
    const sync = createLocalSync(2, [toYDoc(doc(paragraph("seed"))), createYDoc()]);
    const [a, b] = sync.peers;
    expect(fromYDoc((b as { doc: Y.Doc }).doc).content[0]?.content?.[0]?.text).toBe("seed");

    sync.disconnect();
    (a as { doc: Y.Doc }).doc.getMap("m").set("a", 1);
    (b as { doc: Y.Doc }).doc.getMap("m").set("b", 2);
    expect((a as { doc: Y.Doc }).doc.getMap("m").has("b")).toBe(false);
    sync.connect();
    expect((a as { doc: Y.Doc }).doc.getMap("m").toJSON()).toEqual({ a: 1, b: 2 });
    expect((b as { doc: Y.Doc }).doc.getMap("m").toJSON()).toEqual({ a: 1, b: 2 });
    sync.destroy();
  });

  it("relays presence", () => {
    const sync = createLocalSync(2);
    const [a, b] = sync.peers as unknown as [LocalPeer, LocalPeer];
    a.awareness.setLocalStateField("user", { name: "Ada" });
    expect(
      [...b.awareness.getStates().values()].some(
        (s) => (s["user"] as { name: string } | undefined)?.name === "Ada",
      ),
    ).toBe(true);
    sync.destroy();
  });
});

describe("two editors on two documents", () => {
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

  async function mountPeer(
    peer: { doc: Y.Doc; awareness: unknown },
    name: string,
    plugins?: ReadonlyArray<EditorPlugin>,
  ): Promise<Editor> {
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
          ...(plugins ? { plugins } : {}),
          onReady: (e: Editor) => (editor = e),
        }),
      ),
    );
    for (let i = 0; i < 5 && !editor; i++) {
      await act(async () => new Promise((r) => setTimeout(r, 10)));
    }
    if (!editor) throw new Error("no editor");
    return editor;
  }

  it("types in one and sees it in the other, in both directions", async () => {
    const sync = createLocalSync(2);
    const [pa, pb] = sync.peers as [(typeof sync.peers)[number], (typeof sync.peers)[number]];
    const a = await mountPeer(pa, "Ada");
    const b = await mountPeer(pb, "Grace");

    await act(async () => {
      a.chain().focus("end").insertContent("from Ada").run();
    });
    expect(b.getText()).toContain("from Ada");

    await act(async () => {
      b.chain().focus("end").insertContent(" and Grace").run();
    });
    expect(a.getText()).toContain("and Grace");
    expect(a.getJSON()).toEqual(b.getJSON());
    expect(JSON.stringify(fromYDoc(pa.doc))).toBe(JSON.stringify(fromYDoc(pb.doc)));
  });

  it("converges after concurrent edits while disconnected", async () => {
    const sync = createLocalSync(2);
    const [pa, pb] = sync.peers as [(typeof sync.peers)[number], (typeof sync.peers)[number]];
    const a = await mountPeer(pa, "Ada");
    const b = await mountPeer(pb, "Grace");
    await act(async () => {
      a.chain().focus().insertContent("base").run();
    });
    sync.disconnect();
    await act(async () => {
      a.chain().focus("start").insertContent("A-").run();
      b.chain().focus("end").insertContent("-B").run();
    });
    expect(a.getText()).not.toBe(b.getText());
    await act(async () => sync.connect());
    expect(a.getText()).toBe(b.getText());
    expect(a.getText()).toContain("A-base-B");
  });

  it("converges with a plugin of its own, seeded from JSON, and keeps what a peer cannot show", async () => {
    const plugins = [...contentPlugins, callout];
    const page = doc(paragraph("Intro"), {
      type: "callout",
      content: [paragraph("Boxed")],
    });
    const sync = createLocalSync(2, [toYDoc(page, undefined, plugins), createYDoc()]);
    const [pa, pb] = sync.peers as [(typeof sync.peers)[number], (typeof sync.peers)[number]];
    const a = await mountPeer(pa, "Ada", plugins);
    const b = await mountPeer(pb, "Grace", plugins);
    expect(b.getJSON().content?.[1]?.type).toBe("callout");
    await act(async () => {
      a.chain().focus("start").insertContent("A: ").run();
      b.chain().focus("end").insertContent(" :B").run();
    });
    expect(a.getJSON()).toEqual(b.getJSON());
    expect(JSON.stringify(fromYDoc(pa.doc, undefined, plugins))).toBe(
      JSON.stringify(fromYDoc(pb.doc, undefined, plugins)),
    );
    expect(fromYDoc(pa.doc, undefined, plugins).content[1]?.type).toBe("callout");
    // A reader that has no callout plugin gets the node back untouched, not an empty page.
    const poorer = contentPlugins;
    const wrapped = toYDoc(page, undefined, poorer);
    expect(fromYDoc(wrapped, undefined, poorer).content[1]).toEqual({
      type: "callout",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Boxed" }] }],
    });
    sync.destroy();
  });
});
