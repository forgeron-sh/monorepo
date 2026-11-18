// The Rust crate's algorithm, line for line, in TypeScript (crates/fg-canvas-core): a hashed
// uniform grid, one 32-byte record per slot in a shared buffer, a lazily sorted stacking order, a
// bitmap of ranks to gather in that order, the same scan-or-grid choice, one instance buffer. It
// is the fair baseline: the benchmark must not read "Rust beats a linear scan".

const NONE = -1;
const FLAG_LOCKED = 1;
const FLAG_HIDDEN = 2;
const FLAG_UNSELECTABLE = 4;
const FLAG_ALIVE = 1 << 30;
/** Floats per instance: x, y, w, h, kind, flags. */
export const STRIDE = 6;
const MAX_CELLS = 16;
const SCAN_RATIO = 8;
/** A record: x, y, w, h, z (f32), kind, flags, rank (u32). */
const REC = 8;
const X = 0;
const Y = 1;
const W = 2;
const H = 3;
const Z = 4;
const KIND = 5;
const FLAGS = 6;
const RANK = 7;
/** Cells are keyed by (cx, cy) packed in 30 bits, a small integer for the engine's Map. Cells 2^15
 *  apart share a key: harmless, every candidate is tested against its bounds. */
const key = (cx: number, cy: number) => ((cx & 0x7fff) << 15) | (cy & 0x7fff);

export class TsGrid {
  readonly inv: number;
  private cap = 0;
  private f = new Float32Array(0);
  private u = new Uint32Array(0);
  /** x0, y0, x1, y1 per slot; x1 < x0 marks the big list. */
  private span = new Int32Array(0);
  private marks = new Uint32Array(0);
  private slots = 0;
  private free: number[] = [];
  private cells = new Map<number, number[]>();
  private big: number[] = [];
  private entries = 0;
  private order: number[] = [];
  private orderDirty = false;
  private live = 0;
  out = new Uint32Array(1024);
  instances = new Float32Array(1024 * STRIDE);

  constructor(cell: number) {
    this.inv = 1 / cell;
  }

  get size() {
    return this.live;
  }

  private grow(min: number) {
    const cap = Math.max(min, this.cap * 2, 64);
    const buf = new ArrayBuffer(cap * REC * 4);
    const f = new Float32Array(buf);
    f.set(this.f);
    this.f = f;
    this.u = new Uint32Array(buf);
    const s = new Int32Array(cap * 4);
    s.set(this.span);
    this.span = s;
    this.cap = cap;
  }

  reserve(n: number) {
    if (n > this.cap) this.grow(n);
  }

  private insertCells(slot: number, x0: number, y0: number, x1: number, y1: number) {
    const o = slot * 4;
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > MAX_CELLS) {
      this.span[o] = 1;
      this.span[o + 1] = 1;
      this.span[o + 2] = 0;
      this.span[o + 3] = 0;
      this.big.push(slot);
      return;
    }
    this.span[o] = x0;
    this.span[o + 1] = y0;
    this.span[o + 2] = x1;
    this.span[o + 3] = y1;
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const k = key(cx, cy);
        const list = this.cells.get(k);
        if (list) list.push(slot);
        else this.cells.set(k, [slot]);
      }
    }
    this.entries += (x1 - x0 + 1) * (y1 - y0 + 1);
  }

  private removeCells(slot: number) {
    const o = slot * 4;
    const x0 = this.span[o];
    const y0 = this.span[o + 1];
    const x1 = this.span[o + 2];
    const y1 = this.span[o + 3];
    if (x1 < x0) {
      const i = this.big.indexOf(slot);
      if (i >= 0) {
        this.big[i] = this.big[this.big.length - 1];
        this.big.pop();
      }
      return;
    }
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const list = this.cells.get(key(cx, cy));
        if (!list) continue;
        const i = list.indexOf(slot);
        if (i >= 0) {
          list[i] = list[list.length - 1];
          list.pop();
          this.entries--;
        }
      }
    }
  }

  add(x: number, y: number, w: number, h: number, kind: number, z: number, flags = 0): number {
    let slot = this.free.pop();
    if (slot === undefined) {
      if (this.slots === this.cap) this.grow(this.slots + 1);
      slot = this.slots++;
    }
    const o = slot * REC;
    const f = this.f;
    f[o + X] = x;
    f[o + Y] = y;
    f[o + W] = w;
    f[o + H] = h;
    f[o + Z] = z;
    this.u[o + KIND] = kind;
    this.u[o + FLAGS] = flags | FLAG_ALIVE;
    const inv = this.inv;
    this.insertCells(
      slot,
      Math.floor(x * inv),
      Math.floor(y * inv),
      Math.floor((x + w) * inv),
      Math.floor((y + h) * inv),
    );
    this.live++;
    this.orderDirty = true;
    return slot;
  }

  alive(slot: number) {
    return slot >= 0 && slot < this.slots && (this.u[slot * REC + FLAGS] & FLAG_ALIVE) !== 0;
  }

  remove(slot: number): boolean {
    if (!this.alive(slot)) return false;
    this.removeCells(slot);
    this.u[slot * REC + FLAGS] = 0;
    this.free.push(slot);
    this.live--;
    this.orderDirty = true;
    return true;
  }

  setBounds(slot: number, x: number, y: number, w: number, h: number): boolean {
    if (!this.alive(slot)) return false;
    const inv = this.inv;
    const x0 = Math.floor(x * inv);
    const y0 = Math.floor(y * inv);
    const x1 = Math.floor((x + w) * inv);
    const y1 = Math.floor((y + h) * inv);
    const o = slot * 4;
    const big = (x1 - x0 + 1) * (y1 - y0 + 1) > MAX_CELLS;
    const was = this.span;
    const same = big
      ? was[o + 2] < was[o]
      : was[o] === x0 && was[o + 1] === y0 && was[o + 2] === x1 && was[o + 3] === y1;
    if (!same) {
      this.removeCells(slot);
      this.insertCells(slot, x0, y0, x1, y1);
    }
    const r = slot * REC;
    this.f[r + X] = x;
    this.f[r + Y] = y;
    this.f[r + W] = w;
    this.f[r + H] = h;
    return true;
  }

  moveMany(slots: ArrayLike<number>, n: number, dx: number, dy: number): number {
    let moved = 0;
    const f = this.f;
    for (let k = 0; k < n; k++) {
      const s = slots[k];
      if (!this.alive(s) || this.u[s * REC + FLAGS] & FLAG_LOCKED) continue;
      const o = s * REC;
      this.setBounds(s, f[o + X] + dx, f[o + Y] + dy, f[o + W], f[o + H]);
      moved++;
    }
    return moved;
  }

  setZ(slot: number, z: number) {
    if (!this.alive(slot)) return false;
    this.f[slot * REC + Z] = z;
    this.orderDirty = true;
    return true;
  }

  setFlags(slot: number, flags: number) {
    if (!this.alive(slot)) return false;
    this.u[slot * REC + FLAGS] = flags | FLAG_ALIVE;
    return true;
  }

  private ensureOrder() {
    if (!this.orderDirty) return;
    const { f, u } = this;
    const order: number[] = [];
    for (let s = 0; s < this.slots; s++) if (u[s * REC + FLAGS] & FLAG_ALIVE) order.push(s);
    order.sort((a, b) => f[a * REC + Z] - f[b * REC + Z] || a - b);
    for (let r = 0; r < order.length; r++) u[order[r] * REC + RANK] = r;
    this.order = order;
    this.orderDirty = false;
  }

  private visit(x0: number, y0: number, x1: number, y1: number, fn: (slot: number) => void) {
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const list = this.cells.get(key(cx, cy));
        if (list) for (let i = 0; i < list.length; i++) fn(list[i]);
      }
    }
    for (let i = 0; i < this.big.length; i++) fn(this.big[i]);
  }

  hit(px: number, py: number): number {
    this.ensureOrder();
    const { f, u } = this;
    const cx = Math.floor(px * this.inv);
    const cy = Math.floor(py * this.inv);
    let best = NONE;
    let bestRank = 0;
    this.visit(cx, cy, cx, cy, (s) => {
      const o = s * REC;
      if (u[o + FLAGS] & (FLAG_HIDDEN | FLAG_UNSELECTABLE)) return;
      const x = f[o + X];
      const y = f[o + Y];
      if (
        px >= x &&
        px <= x + f[o + W] &&
        py >= y &&
        py <= y + f[o + H] &&
        (best === NONE || u[o + RANK] > bestRank)
      ) {
        best = s;
        bestRank = u[o + RANK];
      }
    });
    return best;
  }

  private push(n: number, s: number) {
    if (n === this.out.length) {
      const o = new Uint32Array(n * 2);
      o.set(this.out);
      this.out = o;
    }
    this.out[n] = s;
  }

  /** Into `out`, bottom first; returns the count. Scans the order when the grid would visit more
   *  than an eighth of the items (sequential reads beat random ones), as the crate does. */
  private gather(
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    keep: (o: number) => boolean,
  ): number {
    this.ensureOrder();
    const inv = this.inv;
    const x0 = Math.floor(rx * inv);
    const y0 = Math.floor(ry * inv);
    const x1 = Math.floor((rx + rw) * inv);
    const y1 = Math.floor((ry + rh) * inv);
    let n = 0;
    const mean = this.entries / Math.max(1, this.cells.size);
    const estimate = Math.floor((x1 - x0 + 1) * (y1 - y0 + 1) * mean) + this.big.length;
    if (estimate * SCAN_RATIO > this.live) {
      const order = this.order;
      for (let i = 0; i < order.length; i++) {
        const s = order[i];
        if (keep(s * REC)) this.push(n++, s);
      }
      return n;
    }
    // Mark the rank of each item kept, then read the bitmap in order: stacking order without a
    // sort, and an item listed in several cells sets the same bit.
    const words = (this.live + 31) >>> 5;
    if (this.marks.length < words) this.marks = new Uint32Array(words * 2);
    const marks = this.marks;
    const u = this.u;
    this.visit(x0, y0, x1, y1, (s) => {
      const o = s * REC;
      const r = u[o + RANK];
      const bit = 1 << (r & 31);
      if (!(marks[r >>> 5] & bit) && keep(o)) marks[r >>> 5] |= bit;
    });
    const order = this.order;
    for (let wi = 0; wi < words; wi++) {
      let m = marks[wi];
      if (m === 0) continue;
      marks[wi] = 0;
      while (m !== 0) {
        const low = m & -m;
        this.push(n++, order[(wi << 5) | (31 - Math.clz32(low))]);
        m ^= low;
      }
    }
    return n;
  }

  inRect(rx: number, ry: number, rw: number, rh: number, contain: boolean): number {
    const { f, u } = this;
    const skip = FLAG_LOCKED | FLAG_HIDDEN | FLAG_UNSELECTABLE;
    return this.gather(rx, ry, rw, rh, (o) => {
      if (u[o + FLAGS] & skip) return false;
      const x = f[o + X];
      const y = f[o + Y];
      const w = f[o + W];
      const h = f[o + H];
      return contain
        ? x >= rx && y >= ry && x + w <= rx + rw && y + h <= ry + rh
        : rx <= x + w && rx + rw >= x && ry <= y + h && ry + rh >= y;
    });
  }

  cull(vx: number, vy: number, zoom: number, sw: number, sh: number, margin: number): number {
    const m = margin / zoom;
    const rx = -vx / zoom - m;
    const ry = -vy / zoom - m;
    const rw = sw / zoom + 2 * m;
    const rh = sh / zoom + 2 * m;
    const { f, u } = this;
    return this.gather(rx, ry, rw, rh, (o) => {
      if (u[o + FLAGS] & FLAG_HIDDEN) return false;
      const x = f[o + X];
      const y = f[o + Y];
      return rx <= x + f[o + W] && rx + rw >= x && ry <= y + f[o + H] && ry + rh >= y;
    });
  }

  frame(vx: number, vy: number, zoom: number, sw: number, sh: number, margin: number): number {
    const n = this.cull(vx, vy, zoom, sw, sh, margin);
    if (this.instances.length < n * STRIDE) {
      this.instances = new Float32Array(Math.max(n, (this.instances.length / STRIDE) * 2) * STRIDE);
    }
    const buf = this.instances;
    const { f, u, out } = this;
    for (let i = 0, b = 0; i < n; i++, b += STRIDE) {
      const o = out[i] * REC;
      buf[b] = f[o + X];
      buf[b + 1] = f[o + Y];
      buf[b + 2] = f[o + W];
      buf[b + 3] = f[o + H];
      buf[b + 4] = u[o + KIND];
      buf[b + 5] = u[o + FLAGS] & ~FLAG_ALIVE;
    }
    return n;
  }

  /** Bytes held: the records, the cell lists (8 bytes a slot, JS arrays), the map. */
  bytes(): number {
    let lists = 0;
    for (const l of this.cells.values()) lists += 16 + l.length * 8;
    return (
      this.cap * (REC * 4 + 16) +
      this.marks.byteLength +
      lists +
      this.cells.size * 24 +
      (this.order.length + this.big.length + this.free.length) * 8 +
      this.out.byteLength +
      this.instances.byteLength
    );
  }
}
