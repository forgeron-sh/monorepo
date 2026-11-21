// The spatial index of the TypeScript engine (D-148 benchmark, docs/benchmarks/canvas-engine.md): a
// hashed uniform grid over slots, with the stacking order kept beside it. Plain numbers, no item
// objects: the engine maps ids to slots and asks the index for candidates, then tests them.
//
// - A slot is listed in every cell its bounds touch; one that would touch more than MAX_CELLS
//   cells (a large frame) goes to a "big" list that every query visits.
// - One record per slot in a Float64Array: left, top, right, bottom, z, flags, rank. The right
//   and bottom edges are computed as `x + w` and `y + h`, exactly as the geometry helpers do, so a
//   test against the index gives the same answer as one against the item.
// - The stacking order is sorted lazily, and only when it can have changed (an add, a removal, a
//   change of z); moves leave it alone. The sort is stable over the previous order: equal z keep
//   their order, and a new slot goes on top of its equals.
// - A query marks the rank of each slot it keeps in a bitmap and reads the bitmap in order: the
//   answer comes bottom first without a sort.
// - When the grid would visit more than an eighth of the slots, a query scans the stacking order
//   instead: sequential reads beat random ones.

/** The slot's item is locked: box and lasso skip it. */
export const FLAG_LOCKED = 1;
/** The slot's kind is not selectable: hit, box and lasso skip it. */
export const FLAG_UNSELECTABLE = 2;
const FLAG_ALIVE = 1 << 30;

const REC = 8;
const X0 = 0;
const Y0 = 1;
const X1 = 2;
const Y1 = 3;
const Z = 4;
const FLAGS = 5;
const RANK = 6;
const MAX_CELLS = 16;
const SCAN_RATIO = 8;

/** A cell's key: (cx, cy) packed in 30 bits, a small integer for the Map. Cells 2^15 apart share
 *  a key: harmless, every candidate is tested against its bounds. */
const key = (cx: number, cy: number) => ((cx & 0x7fff) << 15) | (cy & 0x7fff);

/** A rectangle as its four edges, the right and bottom ones included. */
export interface Edges {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Whether a candidate is kept: its slot, and its record's offset into `rec`. */
type Keep = (slot: number, o: number) => boolean;

export class SpatialIndex {
  private readonly inv: number;
  private cap = 0;
  private rec = new Float64Array(0);
  /** Cells per slot: cx0, cy0, cx1, cy1; cx1 < cx0 marks the big list. */
  private span = new Int32Array(0);
  private slots = 0;
  private free: number[] = [];
  private cells = new Map<number, number[]>();
  private big: number[] = [];
  private entries = 0;
  private live = 0;
  private stack: number[] = [];
  private added: number[] = [];
  private dirty = false;
  private marks = new Uint32Array(0);
  /** A loose box around every slot ever placed: it grows, never shrinks. */
  private world = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  /** The answer of the last `gather`, bottom first; `count` slots are valid. */
  out = new Int32Array(256);

  /** @param cell World units per cell: about twice a typical item. */
  constructor(cell = 256) {
    this.inv = 1 / cell;
  }

  get size(): number {
    return this.live;
  }

  /** Empties the index and keeps its buffers. */
  clear(): void {
    this.slots = 0;
    this.free = [];
    this.cells.clear();
    this.big = [];
    this.entries = 0;
    this.live = 0;
    this.stack = [];
    this.added = [];
    this.dirty = false;
    this.world = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  }

  reserve(n: number): void {
    if (n > this.cap) this.grow(n);
  }

  private grow(min: number) {
    const cap = Math.max(min, this.cap * 2, 64);
    const rec = new Float64Array(cap * REC);
    rec.set(this.rec);
    this.rec = rec;
    const span = new Int32Array(cap * 4);
    span.set(this.span);
    this.span = span;
    this.cap = cap;
  }

  /** A new slot on top of the stacking order among its equals; returns the slot. */
  add(x: number, y: number, w: number, h: number, z: number, flags = 0): number {
    let slot = this.free.pop();
    if (slot === undefined) {
      if (this.slots === this.cap) this.grow(this.slots + 1);
      slot = this.slots++;
    }
    const o = slot * REC;
    this.rec[o + Z] = z;
    this.rec[o + FLAGS] = (flags | FLAG_ALIVE) >>> 0;
    this.place(slot, x, y, w, h, true);
    this.live++;
    this.added.push(slot);
    this.dirty = true;
    return slot;
  }

  alive(slot: number): boolean {
    return (
      slot >= 0 && slot < this.slots && ((this.rec[slot * REC + FLAGS]! >>> 0) & FLAG_ALIVE) !== 0
    );
  }

  remove(slot: number): boolean {
    if (!this.alive(slot)) return false;
    this.unlist(slot);
    this.rec[slot * REC + FLAGS] = 0;
    this.free.push(slot);
    this.live--;
    this.dirty = true;
    return true;
  }

  /** New bounds: four stores when the slot stays in its cells. */
  setBounds(slot: number, x: number, y: number, w: number, h: number): boolean {
    if (!this.alive(slot)) return false;
    this.place(slot, x, y, w, h, false);
    return true;
  }

  setZ(slot: number, z: number): boolean {
    if (!this.alive(slot)) return false;
    const o = slot * REC + Z;
    if (this.rec[o] !== z) {
      this.rec[o] = z;
      this.dirty = true;
    }
    return true;
  }

  setFlags(slot: number, flags: number): boolean {
    if (!this.alive(slot)) return false;
    this.rec[slot * REC + FLAGS] = (flags | FLAG_ALIVE) >>> 0;
    return true;
  }

  /** The slot's place in the stacking order, 0 at the bottom. */
  rankOf(slot: number): number {
    this.sort();
    return this.rec[slot * REC + RANK]!;
  }

  /** Every live slot, bottom first. Valid until the next change. */
  order(): ReadonlyArray<number> {
    this.sort();
    return this.stack;
  }

  /** Whether the stacking order will be sorted again before the next query. */
  get orderChanged(): boolean {
    return this.dirty;
  }

  private place(slot: number, x: number, y: number, w: number, h: number, fresh: boolean) {
    const r = slot * REC;
    const x1 = x + w;
    const y1 = y + h;
    this.rec[r + X0] = x;
    this.rec[r + Y0] = y;
    this.rec[r + X1] = x1;
    this.rec[r + Y1] = y1;
    const world = this.world;
    if (x < world.x0) world.x0 = x;
    if (y < world.y0) world.y0 = y;
    if (x1 > world.x1) world.x1 = x1;
    if (y1 > world.y1) world.y1 = y1;
    const inv = this.inv;
    const cx0 = Math.floor(x * inv);
    const cy0 = Math.floor(y * inv);
    const cx1 = Math.floor(x1 * inv);
    const cy1 = Math.floor(y1 * inv);
    // Not finite, inverted or too large: the big list, visited by every query.
    const big = !((cx1 - cx0 + 1) * (cy1 - cy0 + 1) <= MAX_CELLS) || cx1 < cx0 || cy1 < cy0;
    const s = slot * 4;
    const span = this.span;
    if (!fresh) {
      const wasBig = span[s + 2]! < span[s]!;
      if (
        big
          ? wasBig
          : span[s] === cx0 && span[s + 1] === cy0 && span[s + 2] === cx1 && span[s + 3] === cy1
      )
        return;
      this.unlist(slot);
    }
    if (big) {
      span[s] = 1;
      span[s + 1] = 1;
      span[s + 2] = 0;
      span[s + 3] = 0;
      this.big.push(slot);
      return;
    }
    span[s] = cx0;
    span[s + 1] = cy0;
    span[s + 2] = cx1;
    span[s + 3] = cy1;
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const k = key(cx, cy);
        const list = this.cells.get(k);
        if (list) list.push(slot);
        else this.cells.set(k, [slot]);
      }
    }
    this.entries += (cx1 - cx0 + 1) * (cy1 - cy0 + 1);
  }

  private unlist(slot: number) {
    const s = slot * 4;
    const span = this.span;
    const cx0 = span[s]!;
    const cy0 = span[s + 1]!;
    const cx1 = span[s + 2]!;
    const cy1 = span[s + 3]!;
    if (cx1 < cx0) {
      swapRemove(this.big, slot);
      return;
    }
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const k = key(cx, cy);
        const list = this.cells.get(k);
        if (!list || !swapRemove(list, slot)) continue;
        this.entries--;
        if (list.length === 0) this.cells.delete(k);
      }
    }
  }

  /** The stacking order, sorted again when an add, a removal or a change of z dirtied it. */
  private sort() {
    if (!this.dirty) return;
    const rec = this.rec;
    const alive = (s: number) => ((rec[s * REC + FLAGS]! >>> 0) & FLAG_ALIVE) !== 0;
    // The previous order without the removed slots (a reused slot is in `added`), then the new
    // ones in the order they came (a slot added twice counts at its last add).
    const fresh = new Set<number>();
    const added: number[] = [];
    for (let i = this.added.length - 1; i >= 0; i--) {
      const s = this.added[i]!;
      if (fresh.has(s)) continue;
      fresh.add(s);
      if (alive(s)) added.push(s);
    }
    const next: number[] = [];
    for (const s of this.stack) if (alive(s) && !fresh.has(s)) next.push(s);
    for (let i = added.length - 1; i >= 0; i--) next.push(added[i]!);
    let sorted = true;
    for (let i = 1; i < next.length && sorted; i++) {
      if (rec[next[i - 1]! * REC + Z]! > rec[next[i]! * REC + Z]!) sorted = false;
    }
    // Array.prototype.sort is stable: equal z keep the order they had.
    if (!sorted) next.sort((a, b) => rec[a * REC + Z]! - rec[b * REC + Z]!);
    for (let r = 0; r < next.length; r++) rec[next[r]! * REC + RANK] = r;
    this.stack = next;
    this.added = [];
    this.dirty = false;
  }

  /**
   * The slots whose bounds contain a point, edges included, top first, without `skip` flags.
   * Usually a handful; written to `out`, the count returned.
   */
  at(px: number, py: number, skip = 0): number {
    this.sort();
    const rec = this.rec;
    let n = 0;
    const consider = (s: number) => {
      const o = s * REC;
      if ((rec[o + FLAGS]! >>> 0) & skip) return;
      if (px < rec[o + X0]! || px > rec[o + X1]! || py < rec[o + Y0]! || py > rec[o + Y1]!) return;
      // Insertion by rank, highest first; a slot met twice (colliding keys) is kept once.
      const rank = rec[o + RANK]!;
      let i = n;
      while (i > 0 && rec[this.out[i - 1]! * REC + RANK]! < rank) i--;
      if (i > 0 && this.out[i - 1] === s) return;
      this.push(n, 0);
      this.out.copyWithin(i + 1, i, n);
      this.out[i] = s;
      n++;
    };
    const cx = Math.floor(px * this.inv);
    const cy = Math.floor(py * this.inv);
    if (Number.isFinite(cx) && Number.isFinite(cy)) {
      const list = this.cells.get(key(cx, cy));
      if (list) for (let i = 0; i < list.length; i++) consider(list[i]!);
    }
    for (let i = 0; i < this.big.length; i++) consider(this.big[i]!);
    return n;
  }

  /** The top-most slot containing a point, without `skip` flags, or -1. */
  hit(px: number, py: number, skip = 0): number {
    return this.at(px, py, skip) > 0 ? this.out[0]! : -1;
  }

  /**
   * The slots whose bounds touch a rectangle (edges included), without `skip` flags and accepted
   * by `keep`, bottom first, into `out`; returns the count. `keep` sees each slot once.
   */
  gather(area: Edges, skip = 0, keep?: (slot: number) => boolean): number {
    return this.collect(area, skip, keep ? (s) => keep(s) : null);
  }

  private collect(area: Edges, skip: number, keep: Keep | null): number {
    this.sort();
    const inv = this.inv;
    const cx0 = Math.floor(area.x0 * inv);
    const cy0 = Math.floor(area.y0 * inv);
    const cx1 = Math.floor(area.x1 * inv);
    const cy1 = Math.floor(area.y1 * inv);
    const rec = this.rec;
    const touches = (o: number) =>
      !((rec[o + FLAGS]! >>> 0) & skip) &&
      area.x0 <= rec[o + X1]! &&
      area.x1 >= rec[o + X0]! &&
      area.y0 <= rec[o + Y1]! &&
      area.y1 >= rec[o + Y0]!;
    const mean = this.entries / Math.max(1, this.cells.size);
    const estimate = (cx1 - cx0 + 1) * (cy1 - cy0 + 1) * mean + this.big.length;
    let n = 0;
    // Too many cells (or an area that is not a plain rectangle): scan the stacking order.
    if (!(estimate * SCAN_RATIO <= this.live) || cx1 < cx0 || cy1 < cy0) {
      const stack = this.stack;
      for (let i = 0; i < stack.length; i++) {
        const s = stack[i]!;
        const o = s * REC;
        if (touches(o) && (!keep || keep(s, o))) this.push(n++, s);
      }
      return n;
    }
    // Mark the rank of each slot kept, then read the bitmap in order: stacking order without a
    // sort, and a slot listed in several cells sets the same bit.
    const words = (this.live + 31) >>> 5;
    if (this.marks.length < words) this.marks = new Uint32Array(words * 2);
    const marks = this.marks;
    const seen = (s: number) => {
      const o = s * REC;
      const r = rec[o + RANK]!;
      const bit = 1 << (r & 31);
      if (!(marks[r >>> 5]! & bit) && touches(o) && (!keep || keep(s, o))) marks[r >>> 5]! |= bit;
    };
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const list = this.cells.get(key(cx, cy));
        if (list) for (let i = 0; i < list.length; i++) seen(list[i]!);
      }
    }
    for (let i = 0; i < this.big.length; i++) seen(this.big[i]!);
    const stack = this.stack;
    for (let w = 0; w < words; w++) {
      let m = marks[w]!;
      if (m === 0) continue;
      marks[w] = 0;
      while (m !== 0) {
        const low = m & -m;
        this.push(n++, stack[(w << 5) | (31 - Math.clz32(low))]!);
        m ^= low;
      }
    }
    return n;
  }

  /** The slots wholly inside a rectangle, without `skip` flags, bottom first, into `out`. */
  inside(area: Edges, skip = 0): number {
    const rec = this.rec;
    return this.collect(
      area,
      skip,
      (_, o) =>
        rec[o + X0]! >= area.x0 &&
        rec[o + Y0]! >= area.y0 &&
        rec[o + X1]! <= area.x1 &&
        rec[o + Y1]! <= area.y1,
    );
  }

  /** Whether a rectangle covers every slot ever placed: past it, a wider search finds nothing. */
  covers(area: Edges): boolean {
    const w = this.world;
    return area.x0 <= w.x0 && area.y0 <= w.y0 && area.x1 >= w.x1 && area.y1 >= w.y1;
  }

  private push(n: number, s: number) {
    if (n >= this.out.length) {
      const out = new Int32Array(Math.max(n + 1, this.out.length * 2));
      out.set(this.out);
      this.out = out;
    }
    this.out[n] = s;
  }

  /** Bytes held, an estimate: the records, the cell lists and the Map, the order, the buffers. */
  bytes(): number {
    let lists = 0;
    for (const l of this.cells.values()) lists += 16 + l.length * 8;
    return (
      this.cap * (REC * 8 + 16) +
      lists +
      this.cells.size * 24 +
      (this.stack.length + this.big.length + this.free.length + this.added.length) * 8 +
      this.marks.byteLength +
      this.out.byteLength
    );
  }
}

/** Removes one occurrence of `v`, swapping the last element into its place. */
function swapRemove(list: number[], v: number): boolean {
  const i = list.indexOf(v);
  if (i < 0) return false;
  list[i] = list[list.length - 1]!;
  list.pop();
  return true;
}
