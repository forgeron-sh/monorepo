// The engine side of `<BlueprintLayer>`, with no React: one scene handle per Blueprint item, a
// clock, the zoom steps, and the compositor that puts every picture on one screen-space canvas
// (docs/blueprint/engine.md §3, "On @forgeron/canvas", and P5 notes).
//
// - Pan moves the pictures by whole screen pixels: the compositor draws again, the engine does not.
// - Zoom maps to the scene's unit: each item is rasterised at the zoom step at or below the
//   viewport's zoom (`steps`) and drawn at an integer scale; crossing a step re-fits the scene at
//   the new raster size (one `resize` per step), between steps only the scale changes.
// - A view switch (an item's `data.view`) loads the scene again from its encoded bytes and draws in
//   the next frame.
// - Hover is a lookup in the last frame's tag buffer, not an engine call; the pointer is also
//   handed to the engine so machines see `hover:<tag>` and `leave`.

import { plan, type ResolvedPalette, resolvePalette } from "@forgeron/blueprint";
import { type BlueprintScene, FRAME_FLAGS } from "@forgeron/blueprint/engine";
import type { EncodedScene, Library, Scene } from "@forgeron/blueprint/format";
import type { Item, Size, Viewport } from "@forgeron/canvas";
import { type Compositor, createCompositor, type Placement } from "./compositor";
import type { BlueprintItemData } from "./kind";
import { SceneCache } from "./scenes";

/** The zoom steps a scene is re-fitted at; above the last one the scale grows by whole pixels. */
export const DEFAULT_STEPS: readonly number[] = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2];

/** The frame scheduler: `requestAnimationFrame`, or a timer where there is none. */
export interface Frames {
  request(fn: (now: number) => void): number;
  cancel(id: number): void;
}

const windowFrames = (): Frames =>
  typeof requestAnimationFrame === "function"
    ? { request: (fn) => requestAnimationFrame(fn), cancel: (id) => cancelAnimationFrame(id) }
    : {
        request: (fn) => setTimeout(() => fn(performance.now()), 16) as unknown as number,
        cancel: (id) => clearTimeout(id),
      };

export interface StageOptions {
  /** A file's library by the key items name in `data.file`. */
  resolve: (file: string) => Library | undefined;
  steps?: readonly number[];
  /** WebGL2 (default) or the 2D canvas. */
  compositor?: "webgl2" | "2d";
  frames?: Frames;
}

/** One item on the stage. */
interface Entry {
  item: Item<BlueprintItemData>;
  /** The data the handle was loaded with: a change of view, depth or scene loads it again. */
  key: string;
  scene: BlueprintScene;
  encoded: EncodedScene;
  spec: Scene;
  /** Raster pixel size at zoom 1, in CSS pixels (the scene's `filters.pixel`, 2 by default). */
  pixel: number;
  /** The zoom step it is rasterised at, and the raster size there. */
  step: number;
  width: number;
  height: number;
  /** Screen placement of its picture. */
  x: number;
  y: number;
  scale: number;
  /** Values the host set, kept across reloads (a view switch keeps the vars). */
  vars: Map<string, number>;
  /** The picture changed since the compositor last took it. */
  fresh: boolean;
  /** Skipped by a frame while off screen: it needs one when it comes back. */
  stale: boolean;
  /** Raster pixel under the pointer, or null. */
  pointer: { x: number; y: number } | null;
}

/** The tag under a screen point: which item, and its tag (empty when untagged). */
export interface HoverHit {
  item: string;
  tag: string;
}

/** Counters for the perf suites and the viewer's readout. */
export interface StageStats {
  /** Engine `resize` calls: one per scene load and one per zoom step crossed. */
  refits: number;
  /** Engine `frame` calls. */
  frames: number;
  /** Compositor draws. */
  composites: number;
  /** Milliseconds of the last engine pass (every item's frame) and of the last compositor draw. */
  frameMs: number;
  composeMs: number;
}

const keyOf = (d: BlueprintItemData) =>
  `${d.file}\u0000${d.preview ?? ""}\u0000${d.scene}\u0000${d.view}\u0000${d.depth ?? ""}`;

export class BlueprintStage {
  readonly stats: StageStats = { refits: 0, frames: 0, composites: 0, frameMs: 0, composeMs: 0 };
  readonly steps: readonly number[];
  private readonly cache: SceneCache;
  private readonly frames: Frames;
  private readonly entries = new Map<string, Entry>();
  private readonly listeners = new Set<() => void>();
  private compositor: Compositor | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private colors: ResolvedPalette | null = null;
  private viewport: Viewport = { x: 0, y: 0, zoom: 1 };
  private size: Size = { w: 0, h: 0 };
  private raf = 0;
  private scheduled = false;
  /** The engine must run a frame (time, vars, pointer or a reload changed). */
  private dirty = false;
  private clock = { time: 0, playing: false, origin: 0, from: 0, last: Number.NaN };

  constructor(private readonly options: StageOptions) {
    this.cache = new SceneCache(options.resolve);
    this.steps = [...(options.steps ?? DEFAULT_STEPS)].sort((a, b) => a - b);
    this.frames = options.frames ?? windowFrames();
  }

  // ── Wiring ────────────────────────────────────────────────────────────────

  /** The screen-space canvas the pictures go on; its CSS tokens give the palette. */
  attach(canvas: HTMLCanvasElement): void {
    this.compositor?.dispose();
    this.canvas = canvas;
    this.compositor = createCompositor(canvas, this.options.compositor);
    this.readPalette();
    this.compositor.resize(this.size.w, this.size.h);
    for (const e of this.entries.values()) {
      e.scene.palette(this.compositor.paints ? this.colors : null);
      this.dirty = true;
    }
    this.request();
  }

  /** WebGL2 or 2D, once attached. */
  get compositorKind(): "webgl2" | "2d" | null {
    return this.compositor?.kind ?? null;
  }

  /** Reads the palette from the canvas's CSS tokens again (a theme switch). */
  readPalette(): void {
    const win = this.canvas?.ownerDocument.defaultView;
    const style = this.canvas ? win?.getComputedStyle(this.canvas) : undefined;
    this.colors = resolvePalette(
      plan().colors,
      (name) => style?.getPropertyValue(name).trim() || undefined,
    );
    if (!this.compositor) return;
    this.compositor.palette(this.colors);
    if (this.compositor.paints) {
      for (const e of this.entries.values()) e.scene.palette(this.colors);
      this.dirty = true;
      this.request();
    }
  }

  /** Called after each draw (the viewer reads states, vars and time). */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ── Inputs ────────────────────────────────────────────────────────────────

  /** The Blueprint items of the canvas: new ones load, changed ones reload, gone ones are freed. */
  setItems(items: readonly Item<BlueprintItemData>[]): void {
    const seen = new Set<string>();
    for (const item of items) {
      seen.add(item.id);
      const e = this.entries.get(item.id);
      const key = keyOf(item.data);
      if (e && e.key === key) {
        if (e.item.bounds !== item.bounds) {
          const resized = e.item.bounds.w !== item.bounds.w || e.item.bounds.h !== item.bounds.h;
          e.item = item;
          if (resized) this.fit(e, true);
          else this.place(e);
        } else e.item = item;
        continue;
      }
      this.load(item, e?.vars);
      if (e) e.scene.dispose();
    }
    for (const [id, e] of this.entries)
      if (!seen.has(id)) {
        e.scene.dispose();
        this.compositor?.drop(id);
        this.entries.delete(id);
      }
    this.request();
  }

  /** The canvas's camera and the surface's size. */
  setViewport(viewport: Viewport, size: Size): void {
    const resized = size.w !== this.size.w || size.h !== this.size.h;
    this.viewport = viewport;
    this.size = size;
    if (resized) this.compositor?.resize(size.w, size.h);
    for (const e of this.entries.values()) {
      if (this.stepOf(viewport.zoom) !== e.step) this.fit(e, false);
      else this.place(e);
      if (e.stale && this.onScreen(e)) this.dirty = true;
    }
    this.request();
  }

  /** Sets a var or root param of one item's scene (all items when `item` is null). */
  set(item: string | null, name: string, value: number): void {
    for (const e of this.targets(item)) {
      if (!e.scene.scope.includes(name)) continue;
      e.scene.set(name, value);
      e.vars.set(name, value);
    }
    this.dirty = true;
    this.request();
  }

  release(item: string | null, name: string): void {
    for (const e of this.targets(item)) {
      if (!e.scene.scope.includes(name)) continue;
      e.scene.release(name);
      e.vars.delete(name);
    }
    this.dirty = true;
    this.request();
  }

  /** Queues a machine event on one item's scene. */
  emit(item: string, event: string): void {
    this.entries.get(item)?.scene.emit(event);
    this.dirty = true;
    this.request();
  }

  private targets(item: string | null): Entry[] {
    if (item === null) return [...this.entries.values()];
    const e = this.entries.get(item);
    return e ? [e] : [];
  }

  // ── Clock ─────────────────────────────────────────────────────────────────

  get time(): number {
    return this.clock.time;
  }

  get playing(): boolean {
    return this.clock.playing;
  }

  play(): void {
    if (this.clock.playing) return;
    this.clock.playing = true;
    this.clock.origin = performance.now();
    this.clock.from = this.clock.time;
    this.dirty = true;
    this.request();
  }

  pause(): void {
    if (!this.clock.playing) return;
    this.clock.time = this.clock.from + (performance.now() - this.clock.origin) / 1000;
    this.clock.playing = false;
    this.notify();
  }

  /** Moves the clock to `time` seconds (the scrub bar). */
  seek(time: number): void {
    this.clock.time = Math.max(0, time);
    this.clock.origin = performance.now();
    this.clock.from = this.clock.time;
    this.dirty = true;
    this.request();
  }

  // ── Pointer ───────────────────────────────────────────────────────────────

  /**
   * The tag under a point of the surface (screen pixels from its top-left), from the last frame's
   * tag buffer; the pointer also goes to the engine for the scenes' machines. `null`: it left.
   */
  hover(point: { x: number; y: number } | null): HoverHit | null {
    let hit: HoverHit | null = null;
    let changed = false;
    const order = [...this.entries.values()].sort((a, b) => b.item.z - a.item.z);
    for (const e of order) {
      let at: { x: number; y: number } | null = null;
      if (point && !hit) {
        const px = Math.floor((point.x - e.x) / e.scale);
        const py = Math.floor((point.y - e.y) / e.scale);
        if (px >= 0 && py >= 0 && px < e.width && py < e.height) {
          at = { x: px, y: py };
          // A drawn pixel: its tag, or "" when untagged; an empty one is no hit.
          const i = py * e.width + px;
          if (e.scene.slots[i]) {
            const t = e.scene.tags[i] ?? 0;
            hit = { item: e.item.id, tag: t > 0 ? (e.encoded.strings[t - 1] ?? "") : "" };
          }
        }
      }
      if (at?.x !== e.pointer?.x || at?.y !== e.pointer?.y) {
        e.pointer = at;
        e.scene.pointer(at ? at.x + 0.5 : null, at ? at.y + 0.5 : 0);
        changed = true;
      }
    }
    if (changed && order.some((e) => e.spec.machines)) {
      this.dirty = true;
      this.request();
    }
    return hit;
  }

  // ── Reading ───────────────────────────────────────────────────────────────

  /** One item's scene handle (states, vars, the encoded names). */
  sceneOf(item: string): { scene: BlueprintScene; encoded: EncodedScene; spec: Scene } | null {
    const e = this.entries.get(item);
    return e ? { scene: e.scene, encoded: e.encoded, spec: e.spec } : null;
  }

  /** Where an item's picture is on screen: top-left, raster size and scale. */
  placement(
    item: string,
  ): { x: number; y: number; width: number; height: number; scale: number } | null {
    const e = this.entries.get(item);
    return e ? { x: e.x, y: e.y, width: e.width, height: e.height, scale: e.scale } : null;
  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  /** Draws now what is pending (tests; the loop calls it once a frame). */
  flush(): void {
    if (this.scheduled) {
      this.frames.cancel(this.raf);
      this.scheduled = false;
    }
    this.tick(performance.now());
  }

  private request(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    this.raf = this.frames.request((now) => {
      this.scheduled = false;
      this.tick(now);
    });
  }

  private tick(now: number): void {
    const c = this.clock;
    if (c.playing) c.time = c.from + (now - c.origin) / 1000;
    if (this.dirty || c.playing) this.run();
    this.composite();
    this.notify();
    if (c.playing) this.request();
  }

  /** One engine frame for every item on screen. */
  private run(): void {
    const start = performance.now();
    this.dirty = false;
    const c = this.clock;
    const t = c.time;
    const dt = Number.isNaN(c.last) || t < c.last ? 0 : Math.min(t - c.last, 0.25);
    c.last = t;
    for (const e of this.entries.values()) {
      if (!this.onScreen(e)) {
        e.stale = true;
        continue;
      }
      e.stale = false;
      this.stats.frames++;
      const flags = e.scene.frame(t, dt);
      if (flags & FRAME_FLAGS.drawn) e.fresh = true;
    }
    this.stats.frameMs = performance.now() - start;
  }

  private composite(): void {
    const comp = this.compositor;
    if (!comp) return;
    const start = performance.now();
    const list: Placement[] = [];
    const order = [...this.entries.values()].sort((a, b) => a.item.z - b.item.z);
    for (const e of order) {
      if (!this.onScreen(e)) continue;
      if (e.fresh) {
        comp.upload(e.item.id, e.scene);
        e.fresh = false;
      }
      list.push({ id: e.item.id, x: e.x, y: e.y, scale: e.scale });
    }
    comp.draw(list);
    this.stats.composites++;
    this.stats.composeMs = performance.now() - start;
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  // ── Items ─────────────────────────────────────────────────────────────────

  private load(item: Item<BlueprintItemData>, vars?: Map<string, number>): void {
    const loaded = this.cache.load(item.data);
    if (!loaded) {
      const old = this.entries.get(item.id);
      if (old) this.compositor?.drop(item.id);
      this.entries.delete(item.id);
      return;
    }
    const pixel = loaded.spec.filters?.pixel ?? 2;
    const e: Entry = {
      item,
      key: keyOf(item.data),
      scene: loaded.scene,
      encoded: loaded.encoded,
      spec: loaded.spec,
      pixel,
      step: Number.NaN,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      scale: 1,
      vars: new Map(vars),
      fresh: false,
      stale: false,
      pointer: null,
    };
    for (const [name, value] of e.vars) if (e.scene.scope.includes(name)) e.scene.set(name, value);
    if (this.compositor) e.scene.palette(this.compositor.paints ? this.colors : null);
    this.entries.set(item.id, e);
    this.fit(e, true);
    this.dirty = true;
  }

  private stepOf(zoom: number): number {
    const s = this.steps;
    let step = s[0] ?? 1;
    for (const v of s) if (v <= zoom + 1e-9) step = v;
    return step;
  }

  /** Rasterises an entry at the zoom step of the viewport: a re-fit, then a frame. */
  private fit(e: Entry, always: boolean): void {
    const step = this.stepOf(this.viewport.zoom);
    const w = Math.max(1, Math.round((e.item.bounds.w * step) / e.pixel));
    const h = Math.max(1, Math.round((e.item.bounds.h * step) / e.pixel));
    if (always || step !== e.step || w !== e.width || h !== e.height) {
      e.scene.resize(w, h);
      this.stats.refits++;
      e.step = step;
      e.width = w;
      e.height = h;
      this.dirty = true;
    }
    this.place(e);
  }

  /** The integer scale and the whole-pixel top-left of an entry's picture, centred on its bounds. */
  private place(e: Entry): void {
    const v = this.viewport;
    e.scale = Math.max(1, Math.floor((e.pixel * v.zoom) / e.step + 1e-9));
    const b = e.item.bounds;
    const cx = (b.x + b.w / 2) * v.zoom + v.x;
    const cy = (b.y + b.h / 2) * v.zoom + v.y;
    e.x = Math.round(cx - (e.width * e.scale) / 2);
    e.y = Math.round(cy - (e.height * e.scale) / 2);
  }

  private onScreen(e: Entry): boolean {
    if (this.size.w === 0 || this.size.h === 0) return true;
    const w = e.width * e.scale;
    const h = e.height * e.scale;
    return e.x < this.size.w && e.y < this.size.h && e.x + w > 0 && e.y + h > 0;
  }

  dispose(): void {
    this.frames.cancel(this.raf);
    this.scheduled = false;
    for (const e of this.entries.values()) e.scene.dispose();
    this.entries.clear();
    this.compositor?.dispose();
    this.compositor = null;
    this.listeners.clear();
  }
}
