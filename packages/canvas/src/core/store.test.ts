import { describe, expect, it, vi } from "vitest";
import { applyPatches, createHistory, invertPatches, record, seal, undo } from "./history";
import { runCommand } from "./keymap";
import { createCanvasStore } from "./store";
import type { Item } from "./types";

const item = (id: string, x: number, y: number, z = 0, extra: Partial<Item> = {}): Item => ({
  id,
  kind: "box",
  bounds: { x, y, w: 100, h: 60 },
  z,
  data: { title: id },
  ...extra,
});

const make = (items: Item[] = [item("a", 0, 0, 0), item("b", 200, 0, 1)]) => {
  const store = createCanvasStore({ items });
  store.setSize({ w: 800, h: 600 });
  return store;
};
const pos = (store: ReturnType<typeof make>, id: string) => {
  const b = store.get(id)!.bounds;
  return [b.x, b.y];
};

describe("history patches", () => {
  it("inverts and applies", () => {
    const items = [item("a", 0, 0)];
    const patches = [
      { op: "update" as const, id: "a", before: { z: 0 }, after: { z: 5 } },
      { op: "add" as const, item: item("b", 1, 1) },
    ];
    const next = applyPatches(items, patches);
    expect(next.map((i) => [i.id, i.z])).toEqual([
      ["a", 5],
      ["b", 0],
    ]);
    expect(applyPatches(next, invertPatches(patches))).toEqual(items);
  });
  it("merges entries with the same key until sealed", () => {
    let h = createHistory<unknown>();
    const step = (x: number) => ({
      patches: [{ op: "update" as const, id: "a", before: { z: x - 1 }, after: { z: x } }],
      coalesce: "k",
    });
    h = record(h, step(1));
    h = record(h, step(2));
    expect(h.past).toHaveLength(1);
    expect(undo(h).patches).toEqual([{ op: "update", id: "a", before: { z: 2 }, after: { z: 0 } }]);
    h = record(seal(h), step(3));
    expect(h.past).toHaveLength(2);
  });
  it("keeps at most `limit` entries", () => {
    let h = createHistory<unknown>(2);
    for (let i = 0; i < 5; i++)
      h = record(h, { patches: [{ op: "add", item: item(`i${i}`, 0, 0) }] });
    expect(h.past).toHaveLength(2);
  });
});

describe("the store", () => {
  it("notifies subscribers and keeps items in z order", () => {
    const store = make();
    const heard = vi.fn<() => void>();
    const stop = store.subscribe(heard);
    store.add({ kind: "box", bounds: { x: 0, y: 0, w: 10, h: 10 }, data: null, z: -1 });
    expect(heard).toHaveBeenCalledTimes(1);
    expect(store.getState().items.map((i) => i.id)).toEqual(["box-1", "a", "b"]);
    stop();
    store.selectAll();
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it("gives new ids without clashing", () => {
    const store = createCanvasStore({ items: [item("box-1", 0, 0)] });
    const [created] = store.add({ kind: "box", bounds: { x: 0, y: 0, w: 1, h: 1 }, data: null });
    expect(created?.id).toBe("box-2");
    expect(created?.z).toBe(1);
  });

  it("undoes and redoes, selecting what changed", () => {
    const store = make();
    store.moveBy(["a"], 20, 0);
    expect(pos(store, "a")).toEqual([20, 0]);
    expect(store.getState().canUndo).toBe(true);
    store.clearSelection();
    expect(store.undo()).toBe(true);
    expect(pos(store, "a")).toEqual([0, 0]);
    expect([...store.getState().selection]).toEqual(["a"]);
    expect(store.redo()).toBe(true);
    expect(pos(store, "a")).toEqual([20, 0]);
    expect(store.redo()).toBe(false);
  });

  it("records a whole drag as one entry", () => {
    const store = make();
    store.beginGesture("Move");
    for (let i = 1; i <= 5; i++) store.moveBy(["a", "b"], 10, 0);
    store.endGesture();
    expect(pos(store, "a")).toEqual([50, 0]);
    store.undo();
    expect(pos(store, "a")).toEqual([0, 0]);
    expect(pos(store, "b")).toEqual([200, 0]);
    expect(store.getState().canUndo).toBe(false);
  });

  it("cancels a gesture without a trace", () => {
    const store = make();
    store.beginGesture();
    store.moveBy(["a"], 10, 10);
    store.add({ kind: "box", bounds: { x: 0, y: 0, w: 1, h: 1 }, data: null });
    store.remove(["b"]);
    store.cancelGesture();
    expect(store.getState().items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(pos(store, "a")).toEqual([0, 0]);
    expect(store.getState().canUndo).toBe(false);
  });

  it("merges repeated nudges of one selection into one step", () => {
    const store = make();
    store.select(["a"]);
    runCommand(store, "nudge-right");
    runCommand(store, "nudge-right");
    runCommand(store, "nudge-down-far");
    expect(pos(store, "a")).toEqual([2, 10]);
    store.undo();
    expect(pos(store, "a")).toEqual([0, 0]);
  });

  it("never moves, nudges or deletes a locked item, and select-all skips it", () => {
    const store = make([item("a", 0, 0, 0, { locked: true }), item("b", 200, 0, 1)]);
    store.select(["a"]);
    runCommand(store, "nudge-left");
    runCommand(store, "delete");
    expect(pos(store, "a")).toEqual([0, 0]);
    store.selectAll();
    expect([...store.getState().selection]).toEqual(["b"]);
  });

  it("deletes the selection and brings it back with undo", () => {
    const store = make();
    store.select(["a", "b"]);
    runCommand(store, "delete");
    expect(store.getState().items).toHaveLength(0);
    expect(store.getState().selection.size).toBe(0);
    store.undo();
    expect(store.getState().items).toHaveLength(2);
  });

  it("duplicates one cell away and selects the copies", () => {
    const store = make();
    store.select(["a"]);
    const [copy] = store.duplicateSelection();
    expect(copy?.bounds).toMatchObject({ x: 20, y: 20 });
    expect(copy?.data).toEqual({ title: "a" });
    expect([...store.getState().selection]).toEqual([copy?.id]);
    expect(copy!.z).toBeGreaterThan(1);
  });

  it("copies and pastes, each paste one cell further, or at a point", () => {
    const store = make();
    store.select(["a"]);
    expect(runCommand(store, "copy")).toBe(true);
    const [p1] = store.paste();
    const [p2] = store.paste();
    expect(p1?.bounds.x).toBe(20);
    expect(p2?.bounds.x).toBe(40);
    const [p3] = store.paste(undefined, { x: 500, y: 400 });
    expect(p3?.bounds).toMatchObject({ x: 500, y: 400 });
    expect(new Set(store.getState().items.map((i) => i.id)).size).toBe(5);
  });

  it("cuts", () => {
    const store = make();
    store.select(["b"]);
    store.cut();
    expect(store.get("b")).toBeUndefined();
    const [back] = store.paste();
    expect(back?.data).toEqual({ title: "b" });
  });

  it("changes the stacking order", () => {
    const store = make([item("a", 0, 0, 0), item("b", 0, 0, 1), item("c", 0, 0, 2)]);
    store.select(["a"]);
    store.bringToFront();
    expect(store.getState().items.map((i) => i.id)).toEqual(["b", "c", "a"]);
    store.select(["c"]);
    store.sendToBack();
    expect(store.getState().items.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("zooms in steps around the centre, resets and fits", () => {
    const store = make();
    store.zoomIn();
    expect(store.getState().viewport.zoom).toBe(1.5);
    store.zoomOut();
    store.zoomOut();
    expect(store.getState().viewport.zoom).toBe(0.75);
    store.resetZoom();
    expect(store.getState().viewport.zoom).toBe(1);
    store.fitView({ padding: 0 });
    const v = store.getState().viewport;
    expect(v.zoom).toBe(1);
    expect(v.x).toBe(Math.round((800 - 300) / 2));
  });

  it("serialises and loads, clearing the history", () => {
    const store = make();
    store.moveBy(["a"], 5, 5);
    const json = store.serialize({ viewport: true });
    const other = createCanvasStore();
    other.load(json);
    expect(other.get("a")?.bounds.x).toBe(5);
    expect(other.getState().canUndo).toBe(false);
  });

  it("changes nothing when read-only", () => {
    const store = createCanvasStore({ items: [item("a", 0, 0)], readOnly: true });
    store.select(["a"]);
    store.moveBy(["a"], 10, 0);
    expect(runCommand(store, "delete")).toBe(false);
    expect(store.get("a")?.bounds.x).toBe(0);
    expect(store.getState().selection.size).toBe(1);
  });
});
