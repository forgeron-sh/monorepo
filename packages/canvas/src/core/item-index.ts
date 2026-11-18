// The items of the TypeScript engine, by id and in space: an id to slot table over a
// `SpatialIndex`, and the queries that used to scan every item (hit, box, lasso, culling,
// nearest) answered from it. Patches are applied by id, and the list of items bottom first is
// rebuilt from the index's stacking order only when that order can have changed.

import { center, pointInPolygon } from "./geometry";
import { nearestInDirection, type BoxMode, type Direction } from "./hit";
import type { Patch } from "./history";
import { kindOf, type KindMap } from "./kinds";
import { FLAG_LOCKED, FLAG_UNSELECTABLE, SpatialIndex, type Edges } from "./spatial-index";
import type { Bounds, Item, Point } from "./types";

const edges = (b: Bounds): Edges => ({ x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h });

export class ItemIndex<D> {
  private readonly space: SpatialIndex;
  private readonly slotOf = new Map<string, number>();
  /** The item in each slot; `undefined` for a free slot. */
  private itemAt: (Item<D> | undefined)[] = [];

  constructor(
    private readonly kinds: KindMap<D>,
    cell?: number,
  ) {
    this.space = new SpatialIndex(cell);
  }

  get(id: string): Item<D> | undefined {
    const s = this.slotOf.get(id);
    return s === undefined ? undefined : this.itemAt[s];
  }

  has(id: string): boolean {
    return this.slotOf.has(id);
  }

  /** Replaces every item; returns them bottom first (a stable sort by z). */
  reset(items: ReadonlyArray<Item<D>>): Item<D>[] {
    this.space.clear();
    this.space.reserve(items.length);
    this.slotOf.clear();
    this.itemAt = [];
    for (const item of items) this.insert(item);
    return this.ordered();
  }

  /**
   * Applies patches as `applyPatches` would to `items` (the list this index last returned) and
   * returns the new list: an add puts the item on top of its equals (replacing one with its id),
   * an update merges its fields, a missing id is skipped. Costs the patches, plus one copy of the
   * list; the stacking order is sorted again only after an add, a removal or a change of z.
   */
  apply(items: ReadonlyArray<Item<D>>, patches: ReadonlyArray<Patch<D>>): Item<D>[] {
    const touched: number[] = [];
    for (const p of patches) {
      if (p.op === "add") {
        this.drop(p.item.id);
        this.insert(p.item);
      } else if (p.op === "remove") {
        this.drop(p.item.id);
      } else {
        const s = this.slotOf.get(p.id);
        if (s === undefined) continue;
        const was = this.itemAt[s]!;
        const now = { ...was, ...p.after };
        this.itemAt[s] = now;
        const b = now.bounds;
        if (b !== was.bounds) this.space.setBounds(s, b.x, b.y, b.w, b.h);
        if (now.z !== was.z) this.space.setZ(s, now.z);
        if (now.locked !== was.locked || now.kind !== was.kind) {
          this.space.setFlags(s, this.flags(now));
        }
        touched.push(s);
      }
    }
    if (this.space.orderChanged) return this.ordered();
    const next = items.slice();
    for (const s of touched) next[this.space.rankOf(s)] = this.itemAt[s]!;
    return next;
  }

  private insert(item: Item<D>) {
    const b = item.bounds;
    const s = this.space.add(b.x, b.y, b.w, b.h, item.z, this.flags(item));
    this.slotOf.set(item.id, s);
    this.itemAt[s] = item;
  }

  private drop(id: string) {
    const s = this.slotOf.get(id);
    if (s === undefined) return;
    this.space.remove(s);
    this.slotOf.delete(id);
    this.itemAt[s] = undefined;
  }

  private flags(item: Item<D>): number {
    return (
      (item.locked ? FLAG_LOCKED : 0) |
      (kindOf(this.kinds, item).selectable === false ? FLAG_UNSELECTABLE : 0)
    );
  }

  private ordered(): Item<D>[] {
    const order = this.space.order();
    const out: Item<D>[] = Array.from({ length: order.length });
    for (let i = 0; i < order.length; i++) out[i] = this.itemAt[order[i]!]!;
    return out;
  }

  private items(n: number): Item<D>[] {
    const out: Item<D>[] = Array.from({ length: n });
    const slots = this.space.out;
    for (let i = 0; i < n; i++) out[i] = this.itemAt[slots[i]!]!;
    return out;
  }

  private ids(n: number): string[] {
    const out: string[] = Array.from({ length: n });
    const slots = this.space.out;
    for (let i = 0; i < n; i++) out[i] = this.itemAt[slots[i]!]!.id;
    return out;
  }

  /** Items with these ids, bottom first; unknown ids are skipped. */
  inOrder(ids: Iterable<string>): Item<D>[] {
    const slots: number[] = [];
    for (const id of ids) {
      const s = this.slotOf.get(id);
      if (s !== undefined) slots.push(s);
    }
    const ranked = slots.map((s) => [this.space.rankOf(s), s] as const);
    ranked.sort((a, b) => a[0] - b[0]);
    return ranked.map(([, s]) => this.itemAt[s]!);
  }

  /** The top-most selectable item under a world point, asking each kind's own hit test. */
  hit(point: Point): Item<D> | null {
    const n = this.space.at(point.x, point.y, FLAG_UNSELECTABLE);
    const slots = this.space.out;
    for (let i = 0; i < n; i++) {
      const item = this.itemAt[slots[i]!]!;
      const own = kindOf(this.kinds, item).hitTest;
      if (!own || own(item, point)) return item;
    }
    return null;
  }

  /** The ids of the selectable, unlocked items a box catches, bottom first. */
  inRect(rect: Bounds, mode: BoxMode = "intersect"): string[] {
    const skip = FLAG_LOCKED | FLAG_UNSELECTABLE;
    const area = edges(rect);
    const n = mode === "contain" ? this.space.inside(area, skip) : this.space.gather(area, skip);
    return this.ids(n);
  }

  /** The ids of the selectable, unlocked items whose centre is inside a lasso, bottom first. */
  inLasso(polygon: ReadonlyArray<Point>): string[] {
    if (polygon.length < 3) return [];
    const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const p of polygon) {
      box.x0 = Math.min(box.x0, p.x);
      box.y0 = Math.min(box.y0, p.y);
      box.x1 = Math.max(box.x1, p.x);
      box.y1 = Math.max(box.y1, p.y);
    }
    const skip = FLAG_LOCKED | FLAG_UNSELECTABLE;
    const n = this.space.gather(box, skip, (s) =>
      pointInPolygon(center(this.itemAt[s]!.bounds), polygon),
    );
    return this.ids(n);
  }

  /** The ids of the items touching a world rectangle, bottom first: culling. */
  touching(rect: Bounds): string[] {
    return this.ids(this.space.gather(edges(rect)));
  }

  /**
   * The nearest item from `from` in a direction, as `nearestInDirection` finds it. A better item
   * than one of score s has its centre within s of `from`'s on both axes, so the search looks in a
   * square around the centre and widens it until the best score fits inside.
   */
  nearest(from: Item<D>, direction: Direction): Item<D> | null {
    const o = center(from.bounds);
    if (Number.isFinite(o.x) && Number.isFinite(o.y)) {
      for (let r = 256; Number.isFinite(r); r *= 4) {
        const area = { x0: o.x - r, y0: o.y - r, x1: o.x + r, y1: o.y + r };
        const n = this.space.gather(area);
        const near = this.items(n).filter((item) => {
          const c = center(item.bounds);
          return Math.abs(c.x - o.x) <= r && Math.abs(c.y - o.y) <= r;
        });
        const best = nearestInDirection(near, from, direction);
        if (best && score(from, best, direction) <= r) return best;
        if (this.space.covers(area)) return best;
      }
    }
    return nearestInDirection(this.ordered(), from, direction);
  }
}

function score<D>(from: Item<D>, to: Item<D>, direction: Direction): number {
  const o = center(from.bounds);
  const c = center(to.bounds);
  const dx = c.x - o.x;
  const dy = c.y - o.y;
  const along =
    direction === "left" ? -dx : direction === "right" ? dx : direction === "up" ? -dy : dy;
  const across = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
  return along + across * 2;
}
