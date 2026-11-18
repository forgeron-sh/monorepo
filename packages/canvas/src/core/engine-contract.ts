// The behaviour every `CanvasEngine` must have, written against the interface only (dispatch,
// query, getState, serialize, load). `engine.test.ts` runs it on the TypeScript engine; the Rust
// engine of D-148 runs the same suite through its WebAssembly binding.

import { describe, expect, it } from "vitest";
import type { CanvasEngine } from "./engine";
import type { GridOptions } from "./grid";
import type { ResizeRule } from "./kinds";
import type { Item } from "./types";

/** What a test sets up: data only, so a WebAssembly engine can take it as JSON. */
interface ContractSetup {
  items: Item<{ title: string }>[];
  readOnly?: boolean;
  grid?: Partial<GridOptions>;
  kinds?: Record<string, { resize?: false | ResizeRule; movable?: boolean; selectable?: boolean }>;
}

export type EngineFactory = (setup: ContractSetup) => CanvasEngine<{ title: string }>;

const item = (id: string, x: number, y: number, z: number, extra: Partial<Item> = {}) =>
  ({ id, kind: "box", bounds: { x, y, w: 100, h: 60 }, z, data: { title: id }, ...extra }) as Item<{
    title: string;
  }>;

export function engineContract(name: string, create: EngineFactory): void {
  const two = () => [item("a", 0, 0, 0), item("b", 200, 0, 1)];
  const make = (setup: Partial<ContractSetup> = {}) => {
    const e = create({ items: two(), ...setup });
    e.dispatch({ type: "set-size", size: { w: 800, h: 600 } });
    return e;
  };
  const at = (e: CanvasEngine<{ title: string }>, id: string) => {
    const b = e.get(id)!.bounds;
    return [b.x, b.y];
  };
  const sel = (e: CanvasEngine<{ title: string }>) => [...e.getState().selection].sort();

  describe(`CanvasEngine contract: ${name}`, () => {
    it("notifies subscribers and keeps items bottom first", () => {
      const e = make();
      let heard = 0;
      const stop = e.subscribe(() => heard++);
      e.dispatch({
        type: "add",
        items: [{ kind: "box", bounds: { x: 0, y: 0, w: 10, h: 10 }, data: { title: "c" }, z: -1 }],
      });
      expect(heard).toBe(1);
      expect(e.getState().items[0]?.data.title).toBe("c");
      stop();
      e.dispatch({ type: "select-all" });
      expect(heard).toBe(1);
    });

    it("answers hit, box, lasso and culling queries", () => {
      const e = make();
      expect(e.query({ type: "hit", point: { x: 210, y: 10 } })?.id).toBe("b");
      expect(e.query({ type: "hit", point: { x: 150, y: 10 } })).toBeNull();
      expect(e.query({ type: "in-rect", rect: { x: -10, y: -10, w: 120, h: 100 } })).toEqual(["a"]);
      const lasso = [
        { x: 150, y: -50 },
        { x: 400, y: -50 },
        { x: 400, y: 100 },
        { x: 150, y: 100 },
      ];
      expect(e.query({ type: "in-lasso", polygon: lasso })).toEqual(["b"]);
      e.dispatch({ type: "set-viewport", viewport: { x: -150, y: 0, zoom: 1 } });
      expect(e.query({ type: "visible", size: { w: 100, h: 100 } })).toEqual(["b"]);
      expect(e.query({ type: "bounds" })).toEqual({ x: 0, y: 0, w: 300, h: 60 });
    });

    it("undoes and redoes, selecting what changed", () => {
      const e = make();
      e.dispatch({ type: "move", ids: ["a"], dx: 20, dy: 0 });
      expect(at(e, "a")).toEqual([20, 0]);
      expect(e.dispatch({ type: "undo" }).ok).toBe(true);
      expect(at(e, "a")).toEqual([0, 0]);
      expect(sel(e)).toEqual(["a"]);
      expect(e.dispatch({ type: "redo" }).ok).toBe(true);
      expect(at(e, "a")).toEqual([20, 0]);
      expect(e.dispatch({ type: "redo" }).ok).toBe(false);
    });

    it("records a drag as one step, snapping the anchor to the grid", () => {
      const e = make();
      const from = [
        ["a", e.get("a")!.bounds],
        ["b", e.get("b")!.bounds],
      ] as const;
      e.dispatch({ type: "gesture", phase: "begin", label: "Move" });
      for (const dx of [7, 13, 27]) {
        e.dispatch({ type: "drag", from, anchor: from[0][1], dx, dy: 3, snap: true });
      }
      e.dispatch({ type: "gesture", phase: "end" });
      expect(at(e, "a")).toEqual([20, 0]);
      expect(at(e, "b")).toEqual([220, 0]);
      e.dispatch({ type: "undo" });
      expect(at(e, "a")).toEqual([0, 0]);
      expect(e.getState().canUndo).toBe(false);
    });

    it("cancels a gesture without a trace", () => {
      const e = make();
      e.dispatch({ type: "gesture", phase: "begin" });
      e.dispatch({ type: "move", ids: ["a"], dx: 10, dy: 10 });
      e.dispatch({ type: "remove", ids: ["b"] });
      e.dispatch({ type: "gesture", phase: "cancel" });
      expect(e.getState().items.map((i) => i.id)).toEqual(["a", "b"]);
      expect(at(e, "a")).toEqual([0, 0]);
      expect(e.getState().canUndo).toBe(false);
    });

    it("resizes from a handle within the kind's rule", () => {
      const e = make({ kinds: { box: { resize: { minW: 80, handles: ["e", "se"] } } } });
      e.dispatch({ type: "select", ids: ["a"] });
      expect(e.query({ type: "handles", id: "a" })).toEqual(["e", "se"]);
      expect(e.query({ type: "handle-at", point: { x: 101, y: 30 }, tolerance: 4 })).toEqual({
        itemId: "a",
        handle: "e",
      });
      const from = e.get("a")!.bounds;
      e.dispatch({
        type: "resize-handle",
        id: "a",
        handle: "e",
        from,
        dx: -90,
        dy: 0,
        keepAspect: false,
        snap: false,
      });
      expect(e.get("a")!.bounds.w).toBe(80);
    });

    it("merges repeated nudges of one selection into one step", () => {
      const e = make();
      e.dispatch({ type: "select", ids: ["a"] });
      e.dispatch({ type: "nudge", dx: 1, dy: 0 });
      e.dispatch({ type: "nudge", dx: 1, dy: 0 });
      e.dispatch({ type: "nudge", dx: 0, dy: 10 });
      expect(at(e, "a")).toEqual([2, 10]);
      e.dispatch({ type: "undo" });
      expect(at(e, "a")).toEqual([0, 0]);
    });

    it("never moves or deletes a locked item; select-all skips it", () => {
      const e = make({ items: [item("a", 0, 0, 0, { locked: true }), item("b", 200, 0, 1)] });
      e.dispatch({ type: "select", ids: ["a"] });
      e.dispatch({ type: "nudge", dx: -1, dy: 0 });
      e.dispatch({ type: "delete-selection" });
      expect(at(e, "a")).toEqual([0, 0]);
      expect(e.query({ type: "movable", ids: ["a", "b"] })).toEqual(["b"]);
      e.dispatch({ type: "select-all" });
      expect(sel(e)).toEqual(["b"]);
    });

    it("duplicates, copies and pastes one cell further each time", () => {
      const e = make();
      e.dispatch({ type: "select", ids: ["a"] });
      const [dup] = e.dispatch({ type: "duplicate-selection" }).created;
      expect(dup?.bounds).toMatchObject({ x: 20, y: 20 });
      expect(sel(e)).toEqual([dup!.id]);
      e.dispatch({ type: "select", ids: ["b"] });
      const json = e.dispatch({ type: "copy" }).json;
      expect(json).toContain('"version":1');
      const [p1] = e.dispatch({ type: "paste" }).created;
      const [p2] = e.dispatch({ type: "paste" }).created;
      expect([p1?.bounds.x, p2?.bounds.x]).toEqual([220, 240]);
      const [p3] = e.dispatch({ type: "paste", at: { x: 500, y: 400 } }).created;
      expect(p3?.bounds).toMatchObject({ x: 500, y: 400 });
      expect(new Set(e.getState().items.map((i) => i.id)).size).toBe(6);
    });

    it("changes the stacking order", () => {
      const e = make({ items: [item("a", 0, 0, 0), item("b", 0, 0, 1), item("c", 0, 0, 2)] });
      e.dispatch({ type: "select", ids: ["a"] });
      e.dispatch({ type: "bring-to-front" });
      expect(e.getState().items.map((i) => i.id)).toEqual(["b", "c", "a"]);
      expect(e.query({ type: "hit", point: { x: 5, y: 5 } })?.id).toBe("a");
    });

    it("zooms by presets around the centre, fits, keeps whole pixels", () => {
      const e = make();
      e.dispatch({ type: "zoom-step", direction: 1 });
      expect(e.getState().viewport.zoom).toBe(1.5);
      e.dispatch({ type: "zoom", zoom: 100 });
      expect(e.getState().viewport.zoom).toBe(4);
      e.dispatch({ type: "fit", padding: 0 });
      const v = e.getState().viewport;
      expect(v).toEqual({ x: 250, y: 270, zoom: 1 });
      e.dispatch({ type: "pan", dx: 10.4, dy: -3.6 });
      expect(e.getState().viewport).toEqual({ x: 260, y: 266, zoom: 1 });
    });

    it("walks items by reading order and direction", () => {
      const e = make({ items: [item("c", 0, 200, 0), item("b", 200, 0, 1), item("a", 0, 0, 2)] });
      expect(e.query({ type: "reading-order" })).toEqual(["a", "b", "c"]);
      expect(e.query({ type: "nearest", from: "a", direction: "down" })).toBe("c");
    });

    it("round-trips through JSON and clears the history on load", () => {
      const e = make();
      e.dispatch({ type: "move", ids: ["a"], dx: 5, dy: 5 });
      const json = e.serialize({ viewport: true });
      const other = create({ items: [] });
      other.load(json);
      expect(other.get("a")?.bounds.x).toBe(5);
      expect(other.getState().canUndo).toBe(false);
    });

    it("changes nothing when read-only", () => {
      const e = make({ readOnly: true });
      e.dispatch({ type: "select", ids: ["a"] });
      expect(e.dispatch({ type: "move", ids: ["a"], dx: 10, dy: 0 }).ok).toBe(false);
      expect(e.dispatch({ type: "delete-selection" }).ok).toBe(false);
      expect(e.query({ type: "handles", id: "a" })).toEqual([]);
      expect(sel(e)).toEqual(["a"]);
    });
  });
}
