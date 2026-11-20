// @vitest-environment jsdom
// The editor as a host of plugins (D-154): what a list of plugins makes of the interface, the keys
// that come with them, a plugin of its own with a tool and a view, the body that is rebuilt when
// the list changes, and the items no plugin of the editor knows.

import type { Item, NewItem } from "@forgeron/canvas";
import { Square01Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDrawStore, type DrawStore } from "../core/engine";
import { definePlugin, type DrawPlugin } from "../core/plugin";
import { n } from "../core/svg";
import type { DrawData, DrawItem } from "../core/types";
import { editorPresets } from "../plugins/editor/presets";
import { rectangle, text } from "../plugins/editor/index";
import { createEditorRegistry, defineEditorPlugin, type EditorPlugin } from "./plugin";
import { DrawEditor } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
beforeEach(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduce"),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type Props = { plugins?: ReadonlyArray<EditorPlugin>; variant?: "full" | "sketch" | "minimal" };

async function mount(store: DrawStore, props: Props = {}) {
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  await act(async () => r.render(h(DrawEditor, { store, label: "Test board", ...props })));
  return host.querySelector<HTMLElement>(".fg-canvas")!;
}

const rerender = async (store: DrawStore, props: Props) =>
  act(async () => root!.render(h(DrawEditor, { store, label: "Test board", ...props })));

const fire = async (el: Element, type: string, init: Record<string, unknown> = {}) =>
  act(async () => {
    const Ctor = (globalThis as { PointerEvent?: typeof MouseEvent }).PointerEvent ?? MouseEvent;
    el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0, ...init }));
  });

const click = async (el: Element, x: number, y: number) => {
  await fire(el, "pointerdown", { clientX: x, clientY: y });
  await fire(el, "pointerup", { clientX: x, clientY: y });
};

const press = async (el: Element, key: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
  });

const dockNames = () =>
  [...(host?.querySelectorAll('[aria-label="Drawing tools"] button') ?? [])].map(
    (b) => b.getAttribute("aria-label") ?? b.textContent ?? "",
  );

/* ------------------------------------------------------------------ A plugin of its own */

const STAR = "star";
const starCore: DrawPlugin = definePlugin({
  id: STAR,
  name: "Star",
  description: "A star.",
  kinds: {
    star: {
      type: "star",
      label: "Star",
      parse: (raw) => raw as unknown as DrawData,
      paint: (item, o) => [
        n("polygon", {
          points: `${item.bounds.x},${item.bounds.y} ${item.bounds.x + 10},${item.bounds.y + 20}`,
          fill: o.color("warning"),
        }),
      ],
    },
  },
});

const starEditor = defineEditorPlugin({
  core: starCore,
  kinds: { star: { content: () => h("span", { className: "star-label" }, "★") } },
  tools: () => [
    {
      id: "star",
      label: "Star",
      shortcut: "x",
      cursor: "crosshair",
      dock: { icon: Square01Icon, group: "star" },
      down(p, { store }) {
        return {
          up() {
            store.add(
              {
                kind: "star",
                bounds: { x: p.world.x, y: p.world.y, w: 40, h: 40 },
                data: { type: "star" } as unknown as DrawData,
              } as NewItem<DrawData>,
              { label: "Add star" },
            );
          },
        };
      },
    },
  ],
});

const starList = [rectangle, text, starEditor] as const;
const starPlugins: ReadonlyArray<EditorPlugin> = starList;

describe("the interface a list of plugins makes", () => {
  it("full has the dock of today, the inspector and the minimap", async () => {
    const store = createDrawStore();
    await mount(store);
    expect(dockNames()).toEqual([
      "Select",
      "Hand",
      "Rectangle",
      "Ellipse",
      "Diamond",
      "Sticky note",
      "Text",
      "Arrow",
      "Pixel pen",
      "Eraser",
      "Frame",
      "Image",
    ]);
    expect(host!.querySelector(".fg-minimap, [class*='minimap']")).not.toBeNull();
  });

  it("minimal is a rectangle and a text, with no inspector and no minimap", async () => {
    const store = createDrawStore({ plugins: editorPresets.minimal.map((p) => p.core) });
    const surface = await mount(store, { variant: "minimal" });
    expect(dockNames()).toEqual(["Select", "Hand", "Rectangle", "Text"]);
    expect(host!.querySelector(".fgd-inspector")).toBeNull();
    expect(host!.querySelector("[class*='minimap']")).toBeNull();
    // The keys of its tools work, the keys of the others do nothing.
    await press(surface, "r");
    expect(store.getState().tool).toBe("rectangle");
    await press(surface, "v");
    await press(surface, "a");
    expect(store.getState().tool).toBe("select");
  });

  it("sketch has no arrow and no frame tool", async () => {
    const store = createDrawStore({ plugins: editorPresets.sketch.map((p) => p.core) });
    const surface = await mount(store, { variant: "sketch" });
    expect(dockNames()).not.toContain("Arrow");
    expect(dockNames()).not.toContain("Frame");
    expect(dockNames()).toContain("Pixel pen");
    await press(surface, "f");
    expect(store.getState().tool).not.toBe("frame");
  });

  it("inspector={false} and minimap={false} leave the plugins out of any list", async () => {
    const store = createDrawStore();
    await act(async () => {
      host = document.createElement("div");
      document.body.append(host);
      root = createRoot(host);
      root.render(h(DrawEditor, { store, inspector: false, minimap: false }));
    });
    const [r] = store.add({
      kind: "rectangle",
      bounds: { x: 0, y: 0, w: 10, h: 10 },
      data: {
        type: "shape",
        fill: { type: "none" },
        stroke: { color: "ink", width: 2, dash: "solid" },
      },
    } as NewItem<DrawData>);
    await act(async () => store.select([r!.id]));
    expect(host!.querySelector(".fgd-inspector")).toBeNull();
    expect(host!.querySelector("[class*='minimap']")).toBeNull();
  });

  it("the tools of every preset have the keys they had", () => {
    const keys = (list: ReadonlyArray<EditorPlugin>) =>
      createEditorRegistry(list)
        .slots({} as never)
        .tools.map((t) => `${t.shortcut}:${t.id}`);
    expect(keys(editorPresets.full)).toEqual([
      "r:rectangle",
      "o:ellipse",
      "d:diamond",
      "s:sticky",
      "t:text",
      "a:arrow",
      "p:pen",
      "e:eraser",
      "f:frame",
    ]);
    expect(keys(editorPresets.sketch)).toEqual([
      "r:rectangle",
      "o:ellipse",
      "d:diamond",
      "s:sticky",
      "t:text",
      "p:pen",
      "e:eraser",
    ]);
    expect(keys(editorPresets.minimal)).toEqual(["r:rectangle", "t:text"]);
  });
});

describe("a plugin of the app's own", () => {
  it("brings a tool, a view and a kind: drawn, selectable, one undo step", async () => {
    const store = createDrawStore({
      plugins: starPlugins.map((p) => p.core),
      grid: { snap: false },
    });
    const surface = await mount(store, { plugins: starPlugins });
    await act(async () => store.setTool("star"));
    await click(surface, 120, 90);
    const [star] = store.getState().items as DrawItem[];
    expect(star?.kind).toBe("star");
    const el = surface.querySelector(`[data-canvas-item="${star!.id}"]`)!;
    expect(el.querySelector("polygon")).not.toBeNull();
    expect(el.querySelector(".star-label")?.textContent).toBe("★");
    await act(async () => store.undo());
    expect(store.getState().items).toHaveLength(0);
  });

  it("is added to a list per editor, and the body is rebuilt when the list changes", async () => {
    const store = createDrawStore({ plugins: starPlugins.map((p) => p.core) });
    await mount(store, { plugins: [...editorPresets.minimal] });
    expect(dockNames()).toEqual(["Select", "Hand", "Rectangle", "Text"]);
    await rerender(store, { plugins: [...editorPresets.minimal, starEditor] });
    expect(dockNames()).toEqual(["Select", "Hand", "Rectangle", "Text", "Star"]);
  });

  it("an editor of a broken list refuses it with a PluginError", () => {
    const needy = defineEditorPlugin({
      core: definePlugin({ id: "needy", name: "n", description: "n", requires: ["missing"] }),
    });
    expect(() => createEditorRegistry([needy])).toThrow(/requires "missing"/);
  });
});

describe("what no plugin of the editor knows", () => {
  const widget: Item<DrawData> = {
    id: "w",
    kind: "widget",
    bounds: { x: 20, y: 20, w: 120, h: 60 },
    z: 0,
    data: { type: "widget", secret: [1, 2, 3] } as unknown as DrawData,
  };

  it("is drawn as a labelled dashed box, selectable, named, and its JSON is untouched", async () => {
    const store = createDrawStore({ plugins: [], grid: { snap: false } });
    store.replace([widget]);
    const surface = await mount(store, { plugins: [rectangle] });
    const el = surface.querySelector(`[data-canvas-item="w"]`)!;
    expect(el.querySelector(".fgd-unknown")).not.toBeNull();
    expect(el.textContent).toContain("Unsupported item: widget");
    expect(el.getAttribute("aria-label")).toContain("Unsupported item: widget");
    await act(async () => store.select(["w"]));
    await act(async () =>
      store.update("w", { bounds: { x: 60, y: 20, w: 120, h: 60 } }, { label: "Move" }),
    );
    expect(store.get("w")!.data).toBe(widget.data);
    expect(JSON.parse(store.serialize()).items[0].data).toEqual({
      type: "widget",
      secret: [1, 2, 3],
    });
  });
});
