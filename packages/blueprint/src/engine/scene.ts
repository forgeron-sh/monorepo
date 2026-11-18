/**
 * The player's side of the engine (docs/blueprint/engine.md §3, "The frame"): a scene handle
 * whose every frame is one call. The host writes its inputs (clock, pointer, var values, events,
 * and for the script layer a packed block list) into blocks of WASM memory, calls `frame` once,
 * then reads the outputs block (flags, hovered tag, the root scope, each machine's state) and
 * the slot buffer, all as views on the module's memory: nothing is copied and, once warm,
 * nothing is allocated per frame on a data scene.
 *
 * - `createScene(lib, name)`: a scene of a `.bp.json` library (vars, timelines, machines, rigs).
 * - `createScriptScene(source)`: the script layer, a scene function feeding immediate blocks into
 *   the same raster each frame (the scenes not converted to data yet).
 */
import * as wasm from "../../wasm/fg_blueprint.js";
import { BlueprintError } from "../core/blocks";
import { frameView, sceneAt } from "../core/render";
import type { ResolvedPalette } from "../core/palette";
import { createFrame, type Frame, SLOT_NAMES } from "../core/frame";
import type { Block, SceneSource, View } from "../core/types";
import { type EncodedScene, encodeScene, type SceneBinOptions } from "../format/scenebin";
import type { Library } from "../format/read";
import { engineMemory, lastEngineError } from "./runtime";
import {
  BLOCK_FLAGS as BF,
  BLOCKS_MAGIC,
  CODES,
  FRAME_FLAGS,
  MAX_EVENTS,
  offsets,
  sizeOf,
} from "./layout";

const IN = offsets("inputs");
const OUT = offsets("outputs");
const IN_WORDS = sizeOf("inputs");
const OUT_WORDS = sizeOf("outputs");

export { FRAME_FLAGS };

/** What a frame did (`FRAME_FLAGS` bits). */
export type FrameFlags = number;

type Listener = (value: number, name: string) => void;

/** The views a handle reads and writes, refreshed when the module's memory grows. */
interface Views {
  buffer: ArrayBuffer | SharedArrayBuffer;
  inputs: Float64Array;
  outputs: Float64Array;
  slots: Uint8Array;
  tags: Uint16Array;
  rgba: Uint8ClampedArray | null;
}

/** Shading and framing a page chooses for a scene (its `data-*`), over the scene's own. */
export interface PlayOptions extends SceneBinOptions {
  /** Paint RGBA inside `frame` with this palette (the 2D presenter); `null` for none. */
  palette?: ResolvedPalette | null;
}

/** The part a data scene and a script scene share: the handle, its blocks, its listeners. */
abstract class Handle {
  protected views: Views | null = null;
  protected width = 0;
  protected height = 0;
  /** `frame` calls since creation (the perf suite's spy reads it). */
  frameCalls = 0;
  private readonly listeners = new Map<string, Set<Listener>>();

  protected constructor(
    protected handle: number,
    /** The root scope's names, in slot order (empty for a script scene). */
    readonly scope: readonly string[],
  ) {}

  protected refresh(): Views {
    const memory = engineMemory();
    const v = this.views;
    if (v && v.buffer === memory.buffer) return v;
    const buffer = memory.buffer;
    const n = this.width * this.height;
    const h = this.handle;
    this.views = {
      buffer,
      inputs: new Float64Array(buffer, wasm.inputs_ptr(h), wasm.inputs_len(h)),
      outputs: new Float64Array(buffer, wasm.outputs_ptr(h), wasm.outputs_len(h)),
      slots: new Uint8Array(buffer, wasm.slots_ptr(h), n),
      tags: new Uint16Array(buffer, wasm.tags_ptr(h), n),
      rgba: this.painting ? new Uint8ClampedArray(buffer, wasm.rgba_ptr(h), n * 4) : null,
    };
    return this.views;
  }

  private painting = false;

  /** Sizes the raster (raster pixels) and fits the scene again. */
  resize(width: number, height: number): void {
    if (wasm.resize(this.handle, width, height) === 2) throw new BlueprintError(lastEngineError());
    this.width = wasm.width(this.handle);
    this.height = wasm.height(this.handle);
    this.views = null;
  }

  /** RGBA painted by `frame` with `colors` (the 2D presenter), or no paint (`null`). */
  palette(colors: ResolvedPalette | null): void {
    this.painting = colors !== null;
    const bytes = colors ? Uint8Array.from(SLOT_NAMES.flatMap((n) => [...colors[n]])) : null;
    const memory = engineMemory();
    if (bytes) {
      const ptr = wasm.alloc(bytes.length);
      new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
      wasm.set_palette(this.handle, ptr, bytes.length);
      wasm.dealloc(ptr, bytes.length);
    } else wasm.set_palette(this.handle, 0, 0);
    this.views = null;
  }

  /** Bayer size (null: flat faces) and halo, over the scene's own filters. */
  shading(dither: 2 | 4 | 8 | null, glow: { radius: number; density: number } | null): void {
    wasm.set_shading(this.handle, dither ?? 0, glow?.radius ?? 0, glow?.density ?? 0);
  }

  get view(): View {
    return {
      u: wasm.view_u(this.handle),
      ox: wasm.view_ox(this.handle),
      oy: wasm.view_oy(this.handle),
    };
  }

  /** The palette slot of every pixel of the last frame, a view on the module's memory. */
  get slots(): Uint8Array {
    return this.refresh().slots;
  }

  /** The hover tag of every pixel (string index + 1), a view on the module's memory. */
  get tags(): Uint16Array {
    return this.refresh().tags;
  }

  /** The RGBA of the last frame (with a palette), a view on the module's memory. */
  get rgba(): Uint8ClampedArray | null {
    return this.refresh().rgba;
  }

  /** The last frame's four buffers, copied out of the module's memory (tests, still output). */
  snapshot(): Frame {
    const { buffer } = engineMemory();
    const n = this.width * this.height;
    const h = this.handle;
    const f = createFrame(this.width, this.height);
    f.material.set(new Uint8Array(buffer, wasm.material_ptr(h), n));
    f.ink.set(new Uint8Array(buffer, wasm.ink_ptr(h), n));
    f.tone.set(new Float32Array(buffer, wasm.tone_ptr(h), n));
    f.color.set(new Uint8Array(buffer, wasm.slots_ptr(h), n));
    return f;
  }

  get size(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /** The pointer over the raster, in raster pixels; `null` when it is away. */
  pointer(x: number | null, y = 0): void {
    const i = this.refresh().inputs;
    i[IN.pointerIn] = x === null ? 0 : 1;
    i[IN.pointerX] = x ?? 0;
    i[IN.pointerY] = y;
  }

  /** Calls `fn` when a root scope value (`"active"`), a machine's state (`"state"`) or the hovered tag (`"hover"`) changes. */
  on(name: string, fn: Listener): () => void {
    let set = this.listeners.get(name);
    if (!set) this.listeners.set(name, (set = new Set()));
    set.add(fn);
    return () => set.delete(fn);
  }

  protected emitTo(name: string, value: number, label: string): void {
    const set = this.listeners.get(name);
    if (set) for (const fn of set) fn(value, label);
  }

  protected hasListeners(): boolean {
    return this.listeners.size > 0;
  }

  /** The one call of a frame; throws on an engine error. */
  protected call(): FrameFlags {
    this.frameCalls++;
    const flags = wasm.frame(this.handle);
    if (flags & FRAME_FLAGS.error) throw new BlueprintError(lastEngineError());
    return flags;
  }

  dispose(): void {
    wasm.free(this.handle);
    this.handle = 0;
    this.views = null;
  }
}

/** A scene of a `.bp.json` library, played by the engine. */
export class BlueprintScene extends Handle {
  readonly encoded: EncodedScene;
  private readonly slotOf = new Map<string, number>();
  private readonly eventIndex = new Map<string, number>();
  private last: Float64Array;
  private readonly machineCount: number;

  constructor(encoded: EncodedScene) {
    engineMemory();
    const memory = engineMemory();
    const ptr = wasm.alloc(encoded.bytes.length);
    new Uint8Array(memory.buffer, ptr, encoded.bytes.length).set(encoded.bytes);
    const handle = wasm.load(ptr, encoded.bytes.length);
    wasm.dealloc(ptr, encoded.bytes.length);
    if (!handle) throw new BlueprintError(lastEngineError());
    super(handle, encoded.scope);
    this.encoded = encoded;
    encoded.scope.forEach((n, i) => this.slotOf.set(n, i));
    encoded.strings.forEach((s, i) => this.eventIndex.set(s, i));
    this.machineCount = encoded.machines.length;
    this.last = new Float64Array(OUT_WORDS + encoded.scope.length + this.machineCount).fill(
      Number.NaN,
    );
  }

  /** Sets a var or a root param by name (`set("progress", p)`, `set("active", 3)`). */
  set(name: string, value: number): void {
    const slot = this.slotOf.get(name);
    if (slot === undefined) throw new BlueprintError(`no var or root param "${name}"`);
    this.refresh().inputs[IN_WORDS + slot] = value;
  }

  /** Hands a var back to the scene (its cycle, its machine, its default). */
  release(name: string): void {
    this.set(name, Number.NaN);
  }

  /** Queues a named event for the machines (`"hover:stack"`, `"click:cta"`); unknown ones are dropped. */
  emit(event: string): void {
    const index = this.eventIndex.get(event);
    if (index === undefined) return;
    const i = this.refresh().inputs;
    const n = i[IN.eventCount]!;
    if (n >= MAX_EVENTS) return;
    i[IN.event0 + n] = index;
    i[IN.eventCount] = n + 1;
  }

  /** The value of a root scope name after the last frame. */
  get(name: string): number {
    const slot = this.slotOf.get(name);
    return slot === undefined ? Number.NaN : this.refresh().outputs[OUT_WORDS + slot]!;
  }

  /** The current state of machine `machine` (its index by default). */
  state(machine = 0): string | undefined {
    const m = this.encoded.machines[machine];
    if (!m) return undefined;
    const o = this.refresh().outputs;
    return m.states[o[OUT_WORDS + this.scope.length + machine]!];
  }

  /** One frame at `time` seconds, `dt` since the last: one call into the engine. */
  frame(time: number, dt = 0): FrameFlags {
    const i = this.refresh().inputs;
    i[IN.time] = time;
    i[IN.dt] = dt;
    i[IN.blocks] = 0;
    const flags = this.call();
    if (flags & (FRAME_FLAGS.vars | FRAME_FLAGS.state | FRAME_FLAGS.hover) && this.hasListeners())
      this.notify();
    return flags;
  }

  private notify(): void {
    const o = this.refresh().outputs;
    const n = this.scope.length;
    for (let k = 0; k < n; k++) {
      const v = o[OUT_WORDS + k]!;
      if (!Object.is(v, this.last[OUT_WORDS + k])) {
        this.last[OUT_WORDS + k] = v;
        this.emitTo(this.scope[k]!, v, this.scope[k]!);
      }
    }
    for (let m = 0; m < this.machineCount; m++) {
      const v = o[OUT_WORDS + n + m]!;
      if (v !== this.last[OUT_WORDS + n + m]) {
        this.last[OUT_WORDS + n + m] = v;
        this.emitTo("state", v, this.encoded.machines[m]!.states[v] ?? "");
      }
    }
    const hover = o[OUT.hover]!;
    if (hover !== this.last[OUT.hover]) {
      this.last[OUT.hover] = hover;
      this.emitTo("hover", hover, hover > 0 ? (this.encoded.strings[hover - 1] ?? "") : "");
    }
  }
}

/** A scene of a `.bp.json` library: `createScene(lib, "village")`. */
export function createScene(
  lib: Library,
  name: string,
  options: SceneBinOptions = {},
): BlueprintScene {
  return new BlueprintScene(encodeScene(lib, name, options));
}

const H = offsets("blocksHeader");
const B = offsets("block");
const BH = sizeOf("blocksHeader");
const BW = sizeOf("block");
const encoder = new TextEncoder();

/**
 * The script layer: a scene function (or a still block list) drawn by the engine, its blocks
 * packed straight into the handle's block buffer and rasterised in the frame's one call.
 */
export class ScriptScene extends Handle {
  private source: SceneSource;
  private capacity = 0;
  private words: Float64Array | null = null;
  private bytes: Uint8Array | null = null;
  private active = -1;
  private host: number | null = null;
  private cycle: { every: number; count: number } | null = null;
  private readonly vars = new Map<string, number>();
  fill: number | undefined;
  unit: "even" | "any" | undefined;

  constructor(
    source: SceneSource,
    options: { fill?: number; unit?: "even" | "any"; labels?: boolean } = {},
  ) {
    engineMemory();
    super(wasm.create(), []);
    this.source = source;
    this.fill = options.fill;
    this.unit = options.unit;
    wasm.set_labels(this.handle, options.labels !== false);
  }

  /** Swaps the scene function or block list (a refit follows on the next `resize`). */
  update(source: SceneSource): void {
    this.source = source;
  }

  /** Highlights each index in turn (`mount`'s `cycle`). */
  cycleActive(cycle: { every: number; count: number } | null): void {
    this.cycle = cycle;
  }

  /** `set("active", n)` pins the highlighted index; other names are passed to the function. */
  set(name: string, value: number): void {
    if (name === "active") this.host = value;
    else this.vars.set(name, value);
  }

  release(name: string): void {
    if (name === "active") this.host = null;
    else this.vars.delete(name);
  }

  /** A var given with `set` (the page's own inputs, `progress`). */
  get(name: string): number {
    return name === "active" ? this.active : (this.vars.get(name) ?? Number.NaN);
  }

  /** Sizes the raster and frames the scene on its picture at `t = 0` (`frameView`). */
  override resize(width: number, height: number): void {
    super.resize(width, height);
    const view = frameView(this.source, this.width, this.height);
    // `frameView` already honours the scene's own fit; a page's fill and unit come on top.
    if (this.fill !== undefined || this.unit !== undefined) {
      const probe = sceneAt(this.source, 0, 0);
      this.fitOn(probe.blocks);
    } else wasm.set_view(this.handle, view.u, view.ox, view.oy);
  }

  private fitOn(blocks: readonly Block[]): void {
    const n = this.pack(blocks);
    wasm.set_fit(
      this.handle,
      this.fill ?? Number.NaN,
      this.unit === "any" ? 1 : this.unit === "even" ? 0 : -1,
    );
    if (!wasm.fit_blocks(this.handle, this.ptr, n)) throw new BlueprintError(lastEngineError());
  }

  private ptr = 0;

  /** Packs blocks into the handle's buffer; returns the byte length. */
  private pack(blocks: readonly Block[]): number {
    let texts = 0;
    for (const b of blocks) if (b.kind === "label") texts += b.text.length * 3;
    const words = BH + blocks.length * BW;
    const need = words * 8 + texts;
    if (need > this.capacity || !this.words || this.words.buffer !== engineMemory().buffer) {
      if (need > this.capacity) this.capacity = Math.max(need, this.capacity * 2, 4096);
      this.ptr = wasm.block_buffer(this.handle, this.capacity);
      const buffer = engineMemory().buffer;
      this.words = new Float64Array(buffer, this.ptr, this.capacity >> 3);
      this.bytes = new Uint8Array(buffer, this.ptr, this.capacity);
      this.views = null;
    }
    const w = this.words!;
    w.fill(0, 0, words);
    w[H.magic] = BLOCKS_MAGIC;
    w[H.count] = blocks.length;
    let text = 0;
    const textBase = words * 8;
    for (let k = 0; k < blocks.length; k++) {
      const b = blocks[k]!;
      const r = BH + k * BW;
      let flags = b.decor ? BF.decor : 0;
      w[r + B.kind] = CODES.block[b.kind];
      w[r + B.layer] = b.layer ?? 0;
      w[r + B.ink] = CODES.ink.ink;
      w[r + B.size] = 2;
      const a = b.kind === "line" ? b.a : b.at;
      w[r + B.ax] = a[0];
      w[r + B.ay] = a[1];
      w[r + B.az] = a[2];
      switch (b.kind) {
        case "box":
          w[r + B.bx] = b.size[0];
          w[r + B.by] = b.size[1];
          w[r + B.bz] = b.size[2];
          if (b.tone) {
            flags |= BF.hasTone;
            w[r + B.toneTop] = b.tone[0];
            w[r + B.toneLeft] = b.tone[1];
            w[r + B.toneRight] = b.tone[2];
          }
          if (b.accent) flags |= BF.accent;
          if (b.signal) flags |= BF.signal;
          if (b.alert) flags |= BF.alert;
          if (b.ghost) flags |= BF.ghost;
          if (b.plate) flags |= BF.plate;
          if (b.vents) flags |= BF.vents;
          w[r + B.floors] = b.floors ?? 0;
          break;
        case "line":
          w[r + B.bx] = b.b[0];
          w[r + B.by] = b.b[1];
          w[r + B.bz] = b.b[2];
          w[r + B.ink] = CODES.ink[b.ink ?? "ink"];
          w[r + B.dash] = b.dash ?? 0;
          break;
        case "dot":
          w[r + B.ink] = CODES.ink[b.ink ?? "ink"];
          w[r + B.size] = b.size ?? 2;
          break;
        case "label": {
          if (b.to) {
            flags |= BF.hasTo;
            w[r + B.bx] = b.to[0];
            w[r + B.by] = b.to[1];
            w[r + B.bz] = b.to[2];
          }
          if (b.active) flags |= BF.active;
          if (b.plain) flags |= BF.plain;
          if (b.fixed) flags |= BF.fixed;
          w[r + B.ink] = CODES.ink[b.ink ?? "ink"];
          const { written } = encoder.encodeInto(
            b.text,
            this.bytes!.subarray(textBase + text, this.capacity),
          );
          w[r + B.text] = text;
          w[r + B.textLength] = written;
          text += written;
          break;
        }
      }
      w[r + B.flags] = flags;
    }
    w[H.bytes] = text;
    return textBase + text;
  }

  /** The highlighted index at `time`: the page's, else the cycle's, else -1 (`mount`). */
  activeAt(time: number): number {
    const c = this.cycle;
    return this.host ?? (c && c.every > 0 ? Math.floor(time / c.every) % c.count : -1);
  }

  /** One frame at `time`: the function's blocks, packed and drawn in the frame's one call. */
  frame(time: number, dt = 0): FrameFlags {
    const active = this.activeAt(time);
    const blocks = sceneAt(this.source, time, active).blocks;
    const n = this.pack(blocks);
    const i = this.refresh().inputs;
    i[IN.time] = time;
    i[IN.dt] = dt;
    i[IN.blocks] = n;
    const flags = this.call();
    if (active !== this.active) {
      this.active = active;
      this.emitTo("active", active, "active");
    }
    return flags;
  }
}

/** The script layer of a scene function or block list. */
export function createScriptScene(
  source: SceneSource,
  options: { fill?: number; unit?: "even" | "any"; labels?: boolean } = {},
): ScriptScene {
  return new ScriptScene(source, options);
}
