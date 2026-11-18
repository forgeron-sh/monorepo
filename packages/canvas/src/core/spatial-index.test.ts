import { describe, expect, it } from "vitest";
import { containsPoint } from "./geometry";
import { applyPatches, type Patch } from "./history";
import { ItemIndex } from "./item-index";
import { FLAG_LOCKED, FLAG_UNSELECTABLE, SpatialIndex } from "./spatial-index";
import { hitTest, itemsInLasso, itemsInRect, nearestInDirection, type Direction } from "./hit";
import { intersectsView, visibleWorld } from "./viewport";
import type { Bounds, Item } from "./types";

/** A small deterministic generator (mulberry32): the same run every time. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  flags: number;
  seq: number;
}

describe("SpatialIndex", () => {
  it("finds the top-most slot under a point, edges included", () => {
    const index = new SpatialIndex(100);
    const a = index.add(0, 0, 100, 100, 0);
    const b = index.add(50, 50, 100, 100, 1);
    expect(index.hit(60, 60)).toBe(b);
    expect(index.hit(10, 10)).toBe(a);
    expect(index.hit(150, 150)).toBe(b);
    expect(index.hit(151, 150)).toBe(-1);
    index.setZ(a, 2);
    expect(index.hit(60, 60)).toBe(a);
    expect(index.hit(60, 60, FLAG_UNSELECTABLE)).toBe(a);
    index.setFlags(a, FLAG_UNSELECTABLE);
    expect(index.hit(60, 60, FLAG_UNSELECTABLE)).toBe(b);
  });

  it("keeps equal z in the order they came, a new slot on top", () => {
    const index = new SpatialIndex(100);
    const a = index.add(0, 0, 10, 10, 0);
    const b = index.add(0, 0, 10, 10, 0);
    expect(index.order()).toEqual([a, b]);
    index.remove(a);
    const c = index.add(0, 0, 10, 10, 0);
    expect(c).toBe(a);
    expect(index.order()).toEqual([b, c]);
    index.setZ(b, 1);
    expect(index.order()).toEqual([c, b]);
    expect(index.rankOf(b)).toBe(1);
  });

  it("puts a large slot in the big list and still finds it", () => {
    const index = new SpatialIndex(10);
    const frame = index.add(0, 0, 1000, 1000, 0);
    const small = index.add(500, 500, 5, 5, 1);
    expect(index.hit(900, 900)).toBe(frame);
    expect(index.hit(502, 502)).toBe(small);
    const n = index.gather({ x0: 495, y0: 495, x1: 510, y1: 510 });
    expect([...index.out.subarray(0, n)]).toEqual([frame, small]);
    // Shrunk, it moves to the grid; grown again, back to the list.
    index.setBounds(frame, 0, 0, 5, 5);
    expect(index.hit(900, 900)).toBe(-1);
    index.setBounds(frame, 0, 0, 1000, 1000);
    expect(index.hit(900, 900)).toBe(frame);
  });

  it("answers boxes, inside or touching, bottom first", () => {
    const index = new SpatialIndex(50);
    const a = index.add(0, 0, 100, 100, 2);
    const b = index.add(50, 50, 100, 100, 1);
    const c = index.add(0, 0, 10, 10, 3, FLAG_LOCKED);
    const box = { x0: -10, y0: -10, x1: 110, y1: 110 };
    let n = index.gather(box);
    expect([...index.out.subarray(0, n)]).toEqual([b, a, c]);
    n = index.gather(box, FLAG_LOCKED);
    expect([...index.out.subarray(0, n)]).toEqual([b, a]);
    n = index.inside(box, FLAG_LOCKED);
    expect([...index.out.subarray(0, n)]).toEqual([a]);
  });

  it("agrees with a linear scan over random adds, moves, removals and z changes", () => {
    const rand = random(7);
    const index = new SpatialIndex(64);
    const model = new Map<number, Slot>();
    let seq = 0;
    // The order is sorted when a query needs it: by z, equals in the order of the last sort, the
    // slots added since on top in the order they came.
    let lastRank = new Map<number, number>();
    const tie = (s: number) => lastRank.get(s) ?? 1e9 + model.get(s)!.seq;
    const order = () => {
      const stack = [...model.keys()].sort(
        (p, q) => model.get(p)!.z - model.get(q)!.z || tie(p) - tie(q),
      );
      lastRank = new Map(stack.map((s, i) => [s, i]));
      return stack;
    };
    const coord = () => rand() * 4000 - 2000;
    const size = () => (rand() < 0.03 ? 600 + rand() * 1500 : 5 + rand() * 150);
    const pick = () => {
      const keys = [...model.keys()];
      return keys[Math.floor(rand() * keys.length)]!;
    };

    const wrong: string[] = [];
    for (let step = 0; step < 4000; step++) {
      const op = rand();
      if (op < 0.35 || model.size < 10) {
        const slot: Slot = {
          x: coord(),
          y: coord(),
          w: size(),
          h: size(),
          z: Math.floor(rand() * 20),
          flags: rand() < 0.1 ? FLAG_LOCKED : rand() < 0.1 ? FLAG_UNSELECTABLE : 0,
          seq: seq++,
        };
        const s = index.add(slot.x, slot.y, slot.w, slot.h, slot.z, slot.flags);
        if (model.has(s)) wrong.push(`slot ${s} given twice`);
        model.set(s, slot);
        lastRank.delete(s);
      } else if (op < 0.5) {
        const s = pick();
        if (!index.remove(s)) wrong.push(`slot ${s} not removed`);
        model.delete(s);
      } else if (op < 0.85) {
        const s = pick();
        const m = model.get(s)!;
        m.x += rand() * 300 - 150;
        m.y += rand() * 300 - 150;
        if (rand() < 0.2) m.w = size();
        index.setBounds(s, m.x, m.y, m.w, m.h);
      } else {
        const s = pick();
        const m = model.get(s)!;
        m.z = Math.floor(rand() * 20);
        index.setZ(s, m.z);
      }
      if (step % 20 !== 0) continue;

      const stack = order();
      expect([...index.order()]).toEqual(stack);
      expect(index.size).toBe(model.size);

      const px = coord();
      const py = coord();
      const under = stack.filter((s) => {
        const m = model.get(s)!;
        return (
          !(m.flags & FLAG_UNSELECTABLE) &&
          px >= m.x &&
          px <= m.x + m.w &&
          py >= m.y &&
          py <= m.y + m.h
        );
      });
      expect(index.hit(px, py, FLAG_UNSELECTABLE)).toBe(under.at(-1) ?? -1);

      // Small and large boxes: the grid and the scan both answer.
      const w = rand() < 0.3 ? 3000 : rand() * 400;
      const area = { x0: px, y0: py, x1: px + w, y1: py + w * 0.7 };
      const touching = stack.filter((s) => {
        const m = model.get(s)!;
        return area.x0 <= m.x + m.w && area.x1 >= m.x && area.y0 <= m.y + m.h && area.y1 >= m.y;
      });
      let n = index.gather(area);
      expect([...index.out.subarray(0, n)]).toEqual(touching);
      const inside = touching.filter((s) => {
        const m = model.get(s)!;
        return (
          !(m.flags & FLAG_LOCKED) &&
          m.x >= area.x0 &&
          m.y >= area.y0 &&
          m.x + m.w <= area.x1 &&
          m.y + m.h <= area.y1
        );
      });
      n = index.inside(area, FLAG_LOCKED);
      expect([...index.out.subarray(0, n)]).toEqual(inside);
    }
    expect(wrong).toEqual([]);
  });
});

type Doc = Item<null>;

describe("ItemIndex", () => {
  const kinds = {
    ghost: { selectable: false },
    // Asked only inside the bounds: the left half of the box.
    dot: { hitTest: (i: Doc, p: { x: number; y: number }) => p.x < i.bounds.x + i.bounds.w / 2 },
  };
  const KINDS = ["box", "box", "box", "ghost", "dot"];

  it("applies patches as applyPatches does and answers as the scanning helpers do", () => {
    const rand = random(11);
    const coord = () => Math.round(rand() * 3000 - 1500);
    const bounds = (): Bounds => ({
      x: coord(),
      y: coord(),
      w: Math.round(rand() < 0.02 ? 2000 : 10 + rand() * 200),
      h: Math.round(10 + rand() * 150),
    });
    let n = 0;
    const make = (): Doc => ({
      id: `i${n++}`,
      kind: KINDS[Math.floor(rand() * KINDS.length)]!,
      bounds: bounds(),
      z: Math.floor(rand() * 30),
      data: null,
      ...(rand() < 0.1 ? { locked: true } : {}),
    });

    const index = new ItemIndex<null>(kinds, 128);
    const start = Array.from({ length: 300 }, make);
    let items = index.reset(start);
    let truth = [...start].sort((a, b) => a.z - b.z);
    expect(items).toEqual(truth);

    for (let round = 0; round < 200; round++) {
      const patches: Patch<null>[] = [];
      for (let k = Math.floor(rand() * 8); k >= 0; k--) {
        const r = rand();
        const some = truth[Math.floor(rand() * truth.length)];
        if (r < 0.2 || !some) patches.push({ op: "add", item: make() });
        else if (r < 0.3) patches.push({ op: "remove", item: some });
        else if (r < 0.75) {
          const b = some.bounds;
          const after = { bounds: { ...b, x: b.x + coord() / 10, y: b.y + coord() / 10 } };
          patches.push({ op: "update", id: some.id, before: { bounds: b }, after });
        } else if (r < 0.9) {
          patches.push({
            op: "update",
            id: some.id,
            before: { z: some.z },
            after: { z: Math.floor(rand() * 30) },
          });
        } else if (r < 0.95) {
          patches.push({ op: "update", id: some.id, before: {}, after: { locked: !some.locked } });
        } else {
          patches.push({ op: "add", item: { ...some, z: some.z } });
        }
      }
      items = index.apply(items, patches);
      truth = applyPatches(truth, patches).sort((a, b) => a.z - b.z);
      expect(items).toEqual(truth);
      for (const item of truth) expect(index.get(item.id)).toEqual(item);

      const point = { x: coord(), y: coord() };
      // Equal z: the item drawn last (later in the list) is the one hit. A kind's own hit test is
      // asked inside the bounds only.
      const under = truth
        .filter((i) => containsPoint(i.bounds, point))
        .reverse()
        .map((i, k) => ({ ...i, z: -k }));
      expect(index.hit(point)?.id).toBe(hitTest(under, point, kinds)?.id);

      const rect = { ...point, w: rand() * 1500, h: rand() * 1000 };
      for (const mode of ["intersect", "contain"] as const) {
        expect(index.inRect(rect, mode)).toEqual(
          itemsInRect(truth, rect, mode, kinds).map((i) => i.id),
        );
      }
      const lasso = [
        point,
        { x: point.x + 900, y: point.y + 100 },
        { x: point.x + 300, y: point.y + 700 },
      ];
      expect(index.inLasso(lasso)).toEqual(itemsInLasso(truth, lasso, kinds).map((i) => i.id));

      const viewport = { x: -point.x, y: -point.y, zoom: 0.25 + rand() * 2 };
      const size = { w: 1280, h: 800 };
      expect(index.touching(visibleWorld(viewport, size))).toEqual(
        truth.filter((i) => intersectsView(viewport, size, i.bounds)).map((i) => i.id),
      );

      const from = truth[Math.floor(rand() * truth.length)]!;
      for (const direction of ["left", "right", "up", "down"] as Direction[]) {
        expect(index.nearest(from, direction)?.id).toBe(
          nearestInDirection(truth, from, direction)?.id,
        );
      }

      const ids = truth.filter(() => rand() < 0.05).map((i) => i.id);
      expect(index.inOrder([...ids].reverse()).map((i) => i.id)).toEqual(ids);
    }
  });
});
