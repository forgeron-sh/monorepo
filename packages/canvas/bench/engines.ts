// The three engines under test, behind one small interface. Each takes the same `Item` objects
// and answers in the same currency (string ids, a Float32Array of instances), so the cost of
// mapping slots to ids is counted for the indexed engines too.

import {
  createTsEngine,
  type Bounds,
  type CanvasEngine,
  type Item,
  type Size,
  type Viewport,
} from "../src/index";
import { SpatialIndex } from "../src/core/spatial-index";
import { KINDS } from "./scene-data";

/** World units per cell of the indexes: about twice the size of a typical item. */
const CELL = 256;
/** Floats per instance: x, y, w, h, kind, flags. */
export const STRIDE = 6;

export interface Instances {
  count: number;
  /** STRIDE floats per instance (x, y, w, h, kind, flags); may be longer than count * STRIDE. */
  data: Float32Array;
}

export interface BenchEngine {
  readonly name: string;
  load(items: ReadonlyArray<Item<null>>): void;
  /** Culling and the instance buffer of one frame. */
  frame(v: Viewport, size: Size, margin: number): Instances;
  hit(x: number, y: number): string | null;
  box(rect: Bounds, contain: boolean): string[];
  move(ids: ReadonlyArray<string>, dx: number, dy: number): void;
  /** Bytes the engine reports holding (its own accounting), when it can. */
  bytes(): number | null;
  /** Calls into WebAssembly during the last operation, for the boundary count. */
  calls?: number;
}

const kindIndex = new Map<string, number>(KINDS.map((k, i) => [k, i]));

/** `createTsEngine` itself, through `CanvasEngine`: ids in, ids out, items rebuilt per change. */
export function tsEngine(): BenchEngine {
  let engine: CanvasEngine<null> = createTsEngine<null>();
  let buf = new Float32Array(1024 * STRIDE);
  return {
    name: "ts-engine",
    load(items) {
      engine = createTsEngine<null>({ items });
    },
    frame(viewport, size, margin) {
      const ids = engine.query({ type: "visible", viewport, size, margin });
      if (buf.length < ids.length * STRIDE) buf = new Float32Array(ids.length * STRIDE * 2);
      let o = 0;
      for (const id of ids) {
        const item = engine.get(id)!;
        const b = item.bounds;
        buf[o] = b.x;
        buf[o + 1] = b.y;
        buf[o + 2] = b.w;
        buf[o + 3] = b.h;
        buf[o + 4] = kindIndex.get(item.kind) ?? 0;
        buf[o + 5] = 0;
        o += STRIDE;
      }
      return { count: ids.length, data: buf };
    },
    hit(x, y) {
      return engine.query({ type: "hit", point: { x, y } })?.id ?? null;
    },
    box(rect, contain) {
      return engine.query({ type: "in-rect", rect, mode: contain ? "contain" : "intersect" });
    },
    move(ids, dx, dy) {
      engine.dispatch({ type: "move", ids, dx, dy });
    },
    bytes: () => null,
  };
}

/** Ids on the JavaScript side of an indexed engine: slot to id and back. */
class IdTable {
  ids: string[] = [];
  slots = new Map<string, number>();
  load(items: ReadonlyArray<Item<null>>) {
    this.ids = items.map((i) => i.id);
    this.slots = new Map(this.ids.map((id, i) => [id, i]));
  }
  bytes() {
    // An estimate: a pointer per array slot and ~40 bytes per Map entry; the strings are shared
    // with the items.
    return this.ids.length * (8 + 40);
  }
}

/**
 * The engine's spatial index (`src/core/spatial-index.ts`) on its own, with the bounds and kinds
 * in plain arrays: the same algorithm as the Rust crate, without `CanvasEngine` around it.
 */
export function tsIndex(): BenchEngine {
  let grid = new SpatialIndex(CELL);
  const table = new IdTable();
  /** x, y, w, h per slot (the slots of a load are 0..n-1). */
  let bounds = new Float64Array(0);
  let kinds = new Uint8Array(0);
  let instances = new Float32Array(1024 * STRIDE);
  return {
    name: "ts-index",
    load(items) {
      grid = new SpatialIndex(CELL);
      grid.reserve(items.length);
      bounds = new Float64Array(items.length * 4);
      kinds = new Uint8Array(items.length);
      for (const i of items) {
        const b = i.bounds;
        const s = grid.add(b.x, b.y, b.w, b.h, i.z);
        bounds.set([b.x, b.y, b.w, b.h], s * 4);
        kinds[s] = kindIndex.get(i.kind) ?? 0;
      }
      table.load(items);
    },
    frame(v, size, margin) {
      const m = margin / v.zoom;
      const x0 = -v.x / v.zoom - m;
      const y0 = -v.y / v.zoom - m;
      const n = grid.gather({
        x0,
        y0,
        x1: x0 + (size.w / v.zoom + 2 * m),
        y1: y0 + (size.h / v.zoom + 2 * m),
      });
      if (instances.length < n * STRIDE) instances = new Float32Array(n * STRIDE * 2);
      const out = grid.out;
      for (let i = 0, o = 0; i < n; i++, o += STRIDE) {
        const s = out[i]!;
        instances[o] = bounds[s * 4]!;
        instances[o + 1] = bounds[s * 4 + 1]!;
        instances[o + 2] = bounds[s * 4 + 2]!;
        instances[o + 3] = bounds[s * 4 + 3]!;
        instances[o + 4] = kinds[s]!;
        instances[o + 5] = 0;
      }
      return { count: n, data: instances };
    },
    hit(x, y) {
      const s = grid.hit(x, y);
      return s < 0 ? null : table.ids[s]!;
    },
    box(rect, contain) {
      const area = { x0: rect.x, y0: rect.y, x1: rect.x + rect.w, y1: rect.y + rect.h };
      const n = contain ? grid.inside(area) : grid.gather(area);
      const out: string[] = Array.from({ length: n });
      for (let i = 0; i < n; i++) out[i] = table.ids[grid.out[i]!]!;
      return out;
    },
    move(ids, dx, dy) {
      for (const id of ids) {
        const s = table.slots.get(id);
        if (s === undefined) continue;
        const o = s * 4;
        const x = (bounds[o] = bounds[o]! + dx);
        const y = (bounds[o + 1] = bounds[o + 1]! + dy);
        grid.setBounds(s, x, y, bounds[o + 2]!, bounds[o + 3]!);
      }
    },
    bytes: () => grid.bytes() + bounds.byteLength + kinds.byteLength + table.bytes(),
  };
}

/** What the wasm-bindgen glue (`--target web`) gives. */
export interface CoreGlue {
  CanvasCore: new (cell: number) => Core;
  initSync(options: { module: BufferSource | WebAssembly.Module }): { memory: WebAssembly.Memory };
}

interface Core {
  len(): number;
  staging(n: number): number;
  load(n: number): void;
  slots_in(n: number): number;
  move_many(n: number, dx: number, dy: number): number;
  set_bounds(slot: number, x: number, y: number, w: number, h: number): boolean;
  hit(x: number, y: number): number;
  in_rect(x: number, y: number, w: number, h: number, contain: boolean): number;
  frame(vx: number, vy: number, zoom: number, sw: number, sh: number, margin: number): number;
  out_ptr(): number;
  instances_ptr(): number;
  bytes(): number;
  noop(): number;
  free(): void;
}

const NONE_SLOT = 0xffff_ffff;

/** The Rust crate through wasm-bindgen: geometry in WebAssembly, ids in JavaScript. */
export function wasmCore(
  glue: CoreGlue,
  memory: WebAssembly.Memory,
  name = "rust-wasm",
): BenchEngine {
  const core = new glue.CanvasCore(CELL);
  const table = new IdTable();
  const self: BenchEngine = {
    name,
    calls: 0,
    load(items) {
      // The same core: `load` clears it and keeps its buffers, as a long-lived editor would.
      const n = items.length;
      const ptr = core.staging(n);
      const view = new Float32Array(memory.buffer, ptr, n * 6);
      for (let i = 0, o = 0; i < n; i++, o += 6) {
        const it = items[i]!;
        const b = it.bounds;
        view[o] = b.x;
        view[o + 1] = b.y;
        view[o + 2] = b.w;
        view[o + 3] = b.h;
        view[o + 4] = kindIndex.get(it.kind) ?? 0;
        view[o + 5] = it.z;
      }
      core.load(n);
      table.load(items);
      self.calls = 3;
    },
    frame(v, size, margin) {
      const count = core.frame(v.x, v.y, v.zoom, size.w, size.h, margin);
      // A fresh view each frame: the memory may have grown (and detached the old buffer).
      const data = new Float32Array(memory.buffer, core.instances_ptr(), count * STRIDE);
      self.calls = 2;
      return { count, data };
    },
    hit(x, y) {
      const s = core.hit(x, y);
      self.calls = 1;
      return s === NONE_SLOT ? null : table.ids[s]!;
    },
    box(rect, contain) {
      const n = core.in_rect(rect.x, rect.y, rect.w, rect.h, contain);
      const slots = new Uint32Array(memory.buffer, core.out_ptr(), n);
      const out: string[] = Array.from({ length: n });
      for (let i = 0; i < n; i++) out[i] = table.ids[slots[i]!]!;
      self.calls = 2;
      return out;
    },
    move(ids, dx, dy) {
      const ptr = core.slots_in(ids.length);
      const view = new Uint32Array(memory.buffer, ptr, ids.length);
      let n = 0;
      for (const id of ids) {
        const s = table.slots.get(id);
        if (s !== undefined) view[n++] = s;
      }
      core.move_many(n, dx, dy);
      self.calls = 2;
    },
    bytes: () => core.bytes() + table.bytes(),
  };
  return self;
}

/** The raw cost of one call across the boundary, in nanoseconds: `noop` and a hit test. */
export function boundaryCost(
  glue: CoreGlue,
  now: () => number,
): { noopNs: number; jsNoopNs: number } {
  const core = new glue.CanvasCore(CELL);
  const N = 1_000_000;
  let sink = 0;
  for (let i = 0; i < 10_000; i++) sink += core.noop();
  let t = now();
  for (let i = 0; i < N; i++) sink += core.noop();
  const noopNs = ((now() - t) * 1e6) / N;
  const js = { noop: () => 0 };
  t = now();
  for (let i = 0; i < N; i++) sink += js.noop();
  const jsNoopNs = ((now() - t) * 1e6) / N;
  core.free();
  if (sink === 42) console.log(sink);
  return { noopNs, jsNoopNs };
}
