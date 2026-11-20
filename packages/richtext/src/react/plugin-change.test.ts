// @vitest-environment jsdom
import type { Editor } from "@tiptap/core";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { doc, paragraph } from "../index";
import { fullEditorPlugins, minimalEditorPlugins } from "../plugins/editor/index";
import { RichTextEditor } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;

beforeEach(() => {
  const rect = { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
  Range.prototype.getBoundingClientRect = () => ({ ...rect, toJSON: () => ({}) }) as DOMRect;
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

describe("changing the plugins of a mounted editor", () => {
  it("builds a new editor and keeps the content, without throwing", async () => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    const editors: Editor[] = [];
    const value = doc(paragraph("kept"));
    const render = (plugins: typeof fullEditorPlugins) =>
      act(async () =>
        root?.render(
          h(RichTextEditor, { value, plugins, onReady: (e: Editor) => editors.push(e) }),
        ),
      );
    await render(fullEditorPlugins);
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    await render(minimalEditorPlugins);
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    await render([]);
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    expect(editors.length).toBeGreaterThanOrEqual(3);
    expect(editors.at(-1)?.getText()).toBe("kept");
    expect(host.querySelector(".fg-rt-content")?.textContent).toBe("kept");
  });
});
