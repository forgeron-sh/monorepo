// A layer of the GPU view kept per group: each group (an item's drawing, an edge) has its slot of
// instances in one buffer, in drawing order, packed once and written again only when it changes.
// A group drawn the same but moved (a drag) is not packed again: the buffer gives it an offset,
// which the surface adds to its instances (one table entry per group, `FAR_STRIDE` float 24 says
// which). A group that comes or goes moves the others' slots (the order is the drawing order), by
// copying their packed instances, never by packing them again. Pure: the surface uploads what
// changed (`FarBufferUpdate`).

import {
  createFarPack,
  FAR_STRIDE,
  packFar,
  resetFarPack,
  type FarPack,
  type FarPrimitive,
  type PackOptions,
} from "./far";
import type { Bounds } from "./types";

/** Primitives drawn together and kept together: an item's drawing, an edge. */
export interface FarGroup {
  /** Who the group is (an item's id): the same key keeps its slot. */
  key: string;
  prims: ReadonlyArray<FarPrimitive & { outset?: number }>;
  /**
   * Draws `prims` moved by this much (world units): a caller that knows its drawing only moved
   * (the selection's outlines in a drag) keeps the same `prims` and says by how much.
   */
  dx?: number;
  dy?: number;
}

/** What an update changed, for the surface to upload. */
export interface FarBufferUpdate {
  /** Every instance moved: upload them all. */
  full: boolean;
  /** Instance ranges `[from, to)` written in place (when not `full`). */
  ranges: Array<[number, number]>;
  /** Group slots whose offset changed, `[from, to)`; null when none. */
  offsets: [number, number] | null;
}

export interface FarBuffer {
  /**
   * The instances of every group in drawing order (with free instances between them, drawn as
   * nothing), the images and polygons in that order, the glyph ids they need.
   */
  readonly pack: FarPack;
  /** Each group slot's offset, `x, y` world units: added to its instances when drawn. */
  readonly offsets: Float32Array;
  /** Slots used so far (the offsets to upload). */
  readonly slots: number;
  /** The groups now, in drawing order: packs what changed, offsets what moved. */
  update(groups: ReadonlyArray<FarGroup>, options: PackOptions): FarBufferUpdate;
  /**
   * Packs again the groups whose words are not packed for `options.zoom` (out of the band they
   * were packed for) or were left out for the glyph budget, and only them.
   */
  refresh(options: PackOptions): FarBufferUpdate;
  /** Packs every group again (the colours or the fonts changed). */
  repackAll(options: PackOptions): FarBufferUpdate;
}

type Prims = FarGroup["prims"];

interface Slot {
  key: string;
  /** What `bits` was packed from, and the primitives given last (the same, or those moved). */
  base: Prims;
  seen: Prims;
  /** The offset drawn: how far `seen` is `base` moved (`mx`, `my`), plus the group's own move. */
  dx: number;
  dy: number;
  mx: number;
  my: number;
  slot: number;
  start: number;
  cap: number;
  count: number;
  bits: Uint32Array;
  images: FarPack["images"];
  polygons: FarPack["polygons"];
  texts: FarPack["texts"];
  ids: Map<number, number>;
  band: [number, number];
  partial: boolean;
  animated: boolean;
  /**
   * No polygon: its instances alone draw it, so it can move by an offset (`pack.texts` keep where
   * they were packed: the surface draws a text's glyphs or bar, which are instances).
   */
  movable: boolean;
  /** The pass that last saw it. */
  pass: number;
}

const NO_ZOOM = 1e30;
const EPS = 1e-6;

/** Groups kept packed after they leave, at most. */
const PARKED = 4096;

/** Room left after a group's instances, so it can grow a little in place (a word typed). */
const slack = (count: number) => (count >> 3) + 1;

const near = (a: number, b: number) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a));

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (ArrayBuffer.isView(a) || Array.isArray(a)) {
    const x = a as ArrayLike<unknown>;
    const y = b as ArrayLike<unknown>;
    if (!(ArrayBuffer.isView(b) || Array.isArray(b)) || x.length !== y.length) return false;
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  let n = 0;
  for (const k in y) if (y[k] !== undefined) n--;
  for (const k in x) {
    if (x[k] === undefined) continue;
    n++;
    if (x[k] !== y[k]) return false;
  }
  return n === 0;
}

/**
 * How far `b` is `a` moved: the same primitives with every position translated by one `(dx, dy)`
 * (`x`, `y`, `points`, `lines`, `clip`), everything else equal; null when they differ otherwise.
 * `(0, 0)` when they are equal. A polygon never counts as moved.
 */
export function farMoved(a: Prims, b: Prims): { dx: number; dy: number } | null {
  if (a.length !== b.length) return null;
  let dx = Number.NaN;
  let dy = Number.NaN;
  const at = (x0: number, y0: number, x1: number, y1: number) => {
    if (Number.isNaN(dx)) {
      dx = x1 - x0;
      dy = y1 - y0;
      return true;
    }
    return near(x1 - x0, dx) && near(y1 - y0, dy);
  };
  for (let i = 0; i < a.length; i++) {
    const p = a[i]! as unknown as Record<string, unknown>;
    const q = b[i]! as unknown as Record<string, unknown>;
    if (p === q) continue;
    if (p.type !== q.type || p.type === "polygon") return null;
    // No `Object.keys`: a drag compares thousands of these a step, without allocating.
    let n = 0;
    for (const k in q) if (q[k] !== undefined) n--;
    for (const k in p) {
      const u = p[k];
      if (u === undefined) continue;
      n++;
      const v = q[k];
      if (k === "x" || k === "y") {
        if (typeof u !== "number" || typeof v !== "number") return null;
        continue;
      }
      if (k === "points") {
        const s = u as ArrayLike<number>;
        const t = v as ArrayLike<number>;
        if (!t || s.length !== t.length) return null;
        for (let j = 0; j + 1 < s.length; j += 2)
          if (!at(s[j]!, s[j + 1]!, t[j]!, t[j + 1]!)) return null;
        continue;
      }
      if (k === "clip") {
        const s = u as Bounds;
        const t = v as Bounds | undefined;
        if (!t || !near(s.w, t.w) || !near(s.h, t.h) || !at(s.x, s.y, t.x, t.y)) return null;
        continue;
      }
      if (k === "lines") {
        const s = u as ReadonlyArray<{ x: number; y: number; text: string }>;
        const t = v as typeof s;
        if (!t || s.length !== t.length) return null;
        for (let j = 0; j < s.length; j++) {
          if (s[j]!.text !== t[j]!.text || !at(s[j]!.x, s[j]!.y, t[j]!.x, t[j]!.y)) return null;
        }
        continue;
      }
      if (!sameValue(u, v)) return null;
    }
    if (n !== 0) return null;
    if (
      typeof p.x === "number" &&
      !at(p.x, (p.y as number) ?? 0, q.x as number, (q.y as number) ?? 0)
    )
      return null;
  }
  return Number.isNaN(dx) ? { dx: 0, dy: 0 } : { dx, dy };
}

/** Writes free instances, drawn as nothing (a zoom range no zoom is in), over `[from, to)`. */
function pad(data: Float32Array, from: number, to: number) {
  if (to <= from) return;
  data.fill(0, from * FAR_STRIDE, to * FAR_STRIDE);
  for (let i = from; i < to; i++) {
    const o = i * FAR_STRIDE;
    data[o + 8] = NO_ZOOM;
    data[o + 9] = NO_ZOOM;
  }
}

export function createFarBuffer(): FarBuffer {
  const pack = createFarPack();
  const scratch = createFarPack();
  let offsets = new Float32Array(2 * 64);
  let used = 0;
  const free: number[] = [];
  const byKey = new Map<string, Slot>();
  /** Groups that left (oldest first), still packed. */
  const parked = new Map<string, Slot>();
  let order: Slot[] = [];
  let pass = 0;
  /** Each glyph id's users, so the lowest zoom it is drawn from is known without a scan. */
  const glyphUsers = new Map<number, number>();
  let offLo = Infinity;
  let offHi = -Infinity;

  const markOffset = (s: Slot) => {
    offsets[s.slot * 2] = s.dx;
    offsets[s.slot * 2 + 1] = s.dy;
    offLo = Math.min(offLo, s.slot);
    offHi = Math.max(offHi, s.slot + 1);
  };

  const takeSlot = (): number => {
    const n = free.pop() ?? used++;
    if (n * 2 + 2 > offsets.length) {
      const next = new Float32Array(offsets.length * 2);
      next.set(offsets);
      offsets = next;
    }
    return n;
  };

  const unref = (ids: Map<number, number>) => {
    for (const id of ids.keys()) {
      const n = (glyphUsers.get(id) ?? 1) - 1;
      if (n <= 0) {
        glyphUsers.delete(id);
        pack.glyphs.delete(id);
      } else glyphUsers.set(id, n);
    }
  };
  const ref = (ids: Map<number, number>) => {
    for (const [id, z] of ids) {
      glyphUsers.set(id, (glyphUsers.get(id) ?? 0) + 1);
      const seen = pack.glyphs.get(id);
      if (seen === undefined || seen > z) pack.glyphs.set(id, z);
    }
  };

  /** Packs a group's primitives into its own instances, at offset 0. */
  const packSlot = (s: Slot, prims: Prims, options: PackOptions) => {
    packFar(resetFarPack(scratch), prims, options);
    const n = scratch.count;
    const bits = scratch.colors.slice(0, n * FAR_STRIDE);
    const data = new Float32Array(bits.buffer);
    for (let i = 0; i < n; i++) data[i * FAR_STRIDE + 24] = s.slot;
    unref(s.ids);
    s.base = prims;
    s.seen = prims;
    s.bits = bits;
    s.count = n;
    s.images = scratch.images;
    s.polygons = scratch.polygons;
    s.texts = scratch.texts;
    s.ids = scratch.glyphs;
    s.band = scratch.band;
    s.partial = scratch.partial;
    s.animated = scratch.animated;
    s.movable = scratch.polygons.length === 0;
    ref(s.ids);
    s.mx = 0;
    s.my = 0;
  };
  /** The group's offset: its drawing's move from what was packed, and its own. */
  const place = (s: Slot, g: { dx?: number; dy?: number }) => {
    const dx = s.mx + (g.dx ?? 0);
    const dy = s.my + (g.dy ?? 0);
    if (dx === s.dx && dy === s.dy) return;
    s.dx = dx;
    s.dy = dy;
    markOffset(s);
  };

  const reserve = (count: number) => {
    const need = count * FAR_STRIDE;
    if (need <= pack.data.length) return;
    let size = Math.max(pack.data.length, FAR_STRIDE * 256);
    while (size < need) size *= 2;
    const data = new Float32Array(size);
    data.set(pack.data.subarray(0, pack.count * FAR_STRIDE));
    pack.data = data;
    pack.colors = new Uint32Array(data.buffer);
  };

  const write = (s: Slot) => {
    pack.colors.set(s.bits, s.start * FAR_STRIDE);
    pad(pack.data, s.start + s.count, s.start + s.cap);
  };

  /** Lays every group out again in order: copies, no packing. */
  const layout = () => {
    let at = 0;
    for (const s of order) {
      s.start = at;
      s.cap = s.count + slack(s.count);
      at += s.cap;
    }
    reserve(at);
    for (const s of order) write(s);
    pack.count = at;
  };

  /** The images, polygons, texts, band and flags of the whole, from the groups. */
  const gather = () => {
    pack.images = [];
    pack.polygons = [];
    pack.texts = [];
    pack.band = [-Infinity, Infinity];
    pack.partial = false;
    pack.animated = false;
    for (const s of order) {
      for (const img of s.images) pack.images.push({ index: s.start + img.index, src: img.src });
      for (const p of s.polygons) pack.polygons.push(p);
      for (const t of s.texts) pack.texts.push(t);
      if (s.band[0] > pack.band[0]) pack.band[0] = s.band[0];
      if (s.band[1] < pack.band[1]) pack.band[1] = s.band[1];
      pack.partial ||= s.partial;
      pack.animated ||= s.animated;
    }
  };

  const takeOffsets = (): [number, number] | null => {
    if (offLo >= offHi) return null;
    const r: [number, number] = [offLo, offHi];
    offLo = Infinity;
    offHi = -Infinity;
    return r;
  };

  /** Writes the packed groups in place where they fit, or lays everything out again. */
  const commit = (
    changed: ReadonlyArray<Slot>,
    gone: ReadonlyArray<Slot>,
    inPlace: boolean,
  ): FarBufferUpdate => {
    const ranges: Array<[number, number]> = [];
    let full = !inPlace || changed.some((s) => s.count > s.cap);
    if (!full) {
      for (const s of changed) {
        write(s);
        ranges.push([s.start, s.start + s.cap]);
      }
      for (const s of gone) {
        pad(pack.data, s.start, s.start + s.cap);
        ranges.push([s.start, s.start + s.cap]);
      }
    } else layout();
    if (full || changed.length || gone.length) gather();
    if (full) ranges.length = 0;
    return { full, ranges, offsets: takeOffsets() };
  };

  const update = (groups: ReadonlyArray<FarGroup>, options: PackOptions): FarBufferUpdate => {
    pass++;
    const next: Slot[] = [];
    const changed: Slot[] = [];
    let added = false;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i]!;
      let key = g.key;
      let s = byKey.get(key);
      if (s && s.pass === pass) {
        // The same key twice: the second is a group of its own.
        key = `${key}\u0000${i}`;
        s = byKey.get(key);
      }
      if (!s) {
        // Back in the window (a pan): its instances are still packed.
        s = parked.get(key);
        if (s) {
          parked.delete(key);
          byKey.set(key, s);
          ref(s.ids);
          added = true;
        }
      }
      if (!s) {
        s = {
          key,
          base: g.prims,
          seen: g.prims,
          dx: 0,
          dy: 0,
          mx: 0,
          my: 0,
          slot: takeSlot(),
          start: 0,
          cap: 0,
          count: 0,
          bits: new Uint32Array(0),
          images: [],
          polygons: [],
          texts: [],
          ids: new Map(),
          band: [-Infinity, Infinity],
          partial: false,
          animated: false,
          movable: true,
          pass,
        };
        markOffset(s);
        byKey.set(key, s);
        packSlot(s, g.prims, options);
        added = true;
      } else if (s.seen !== g.prims) {
        s.seen = g.prims;
        const moved = s.movable ? farMoved(s.base, g.prims) : null;
        if (moved) {
          s.mx = moved.dx;
          s.my = moved.dy;
        } else {
          packSlot(s, g.prims, options);
          changed.push(s);
        }
      }
      place(s, g);
      s.pass = pass;
      next.push(s);
    }
    // What went: its glyphs no longer needed; kept packed a while (it may come back with the
    // cull window), its slot freed once it is let go.
    const gone: Slot[] = [];
    for (const s of order) {
      if (s.pass === pass) continue;
      gone.push(s);
      byKey.delete(s.key);
      unref(s.ids);
      parked.set(s.key, s);
    }
    for (const [key, s] of parked) {
      if (parked.size <= PARKED) break;
      parked.delete(key);
      free.push(s.slot);
    }
    // In place when nothing came and the rest kept its order (what went leaves free instances).
    let inPlace = !added;
    if (inPlace) {
      let j = 0;
      for (const s of order) {
        if (s.pass !== pass) continue;
        if (next[j] !== s) {
          inPlace = false;
          break;
        }
        j++;
      }
      inPlace &&= j === next.length;
    }
    order = next;
    return commit(changed, gone, inPlace && pack.count > 0);
  };

  const repackWhere = (options: PackOptions, which: (s: Slot) => boolean): FarBufferUpdate => {
    const changed: Slot[] = [];
    for (const s of order) {
      if (!which(s)) continue;
      const own = { dx: s.dx - s.mx, dy: s.dy - s.my };
      packSlot(s, s.seen, options);
      place(s, own);
      changed.push(s);
    }
    return commit(changed, [], true);
  };

  return {
    pack,
    get offsets() {
      return offsets;
    },
    get slots() {
      return used;
    },
    update,
    refresh: (options) => {
      const z = options.zoom;
      return repackWhere(
        options,
        (s) => s.partial || (z !== undefined && (z < s.band[0] || z >= s.band[1])),
      );
    },
    repackAll: (options) => repackWhere(options, () => true),
  };
}
