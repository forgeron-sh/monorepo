import { describe, expect, it } from "vitest";
import { BLOCKS, type BlockDef } from "../core/blocks";
import { placePanel } from "./floating";
import { normalizeLink } from "./bubble-toolbar";
import { createSuggestionStore } from "./suggestion-store";

type Props = Parameters<
  ReturnType<ReturnType<typeof createSuggestionStore<BlockDef>>["render"]>["onStart"]
>[0];

const props = (query: string, items: BlockDef[], picked: BlockDef[] = []): Props =>
  ({
    items,
    query,
    clientRect: () => ({ left: 10, top: 20, right: 10, bottom: 38 }) as DOMRect,
    command: (item: BlockDef) => picked.push(item),
  }) as unknown as Props;

const key = (k: string) => ({ event: { key: k } }) as never;

describe("suggestion store", () => {
  it("opens on start, moves with the arrows, picks with Enter and closes on exit", () => {
    const store = createSuggestionStore<BlockDef>();
    const render = store.render();
    const picked: BlockDef[] = [];
    expect(store.get()).toBeNull();
    render.onStart(props("", BLOCKS.slice(0, 3), picked));
    expect(store.get()?.index).toBe(0);
    expect(render.onKeyDown(key("ArrowDown"))).toBe(true);
    expect(render.onKeyDown(key("ArrowDown"))).toBe(true);
    expect(render.onKeyDown(key("ArrowDown"))).toBe(true);
    expect(store.get()?.index).toBe(0);
    expect(render.onKeyDown(key("ArrowUp"))).toBe(true);
    expect(store.get()?.index).toBe(2);
    expect(render.onKeyDown(key("Enter"))).toBe(true);
    expect(picked).toEqual([BLOCKS[2]]);
    expect(render.onKeyDown(key("a"))).toBe(false);
    render.onExit();
    expect(store.get()).toBeNull();
    expect(render.onKeyDown(key("Enter"))).toBe(false);
  });

  it("keeps the highlight while the query is the same, resets it when it changes", () => {
    const store = createSuggestionStore<BlockDef>();
    const render = store.render();
    render.onStart(props("h", BLOCKS.slice(0, 4)));
    store.setIndex(2);
    render.onUpdate(props("h", BLOCKS.slice(0, 4)));
    expect(store.get()?.index).toBe(2);
    render.onUpdate(props("he", BLOCKS.slice(0, 2)));
    expect(store.get()?.index).toBe(0);
  });

  it("lets keys through when nothing matches", () => {
    const store = createSuggestionStore<BlockDef>();
    const render = store.render();
    render.onStart(props("zzz", []));
    expect(render.onKeyDown(key("Enter"))).toBe(false);
  });
});

describe("panel placement", () => {
  const viewport = { width: 800, height: 600 };
  it("opens below, flips above when there is no room, and stays inside", () => {
    const size = { width: 200, height: 100 };
    expect(placePanel({ left: 100, right: 100, top: 100, bottom: 118 }, size, viewport)).toEqual({
      left: 100,
      top: 124,
    });
    expect(placePanel({ left: 100, right: 100, top: 560, bottom: 578 }, size, viewport).top).toBe(
      454,
    );
    expect(placePanel({ left: 790, right: 790, top: 100, bottom: 118 }, size, viewport).left).toBe(
      592,
    );
    expect(
      placePanel({ left: 100, right: 160, top: 200, bottom: 218 }, size, viewport, "above").top,
    ).toBe(94);
  });
});

describe("link input", () => {
  it("adds https, keeps relative and mail links, refuses code", () => {
    expect(normalizeLink("example.com/a")).toBe("https://example.com/a");
    expect(normalizeLink(" /docs ")).toBe("/docs");
    expect(normalizeLink("mailto:a@b.dev")).toBe("mailto:a@b.dev");
    expect(normalizeLink("javascript:alert(1)")).toBeUndefined();
    expect(normalizeLink("  ")).toBeUndefined();
  });
});
