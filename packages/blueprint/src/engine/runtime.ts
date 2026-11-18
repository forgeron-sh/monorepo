/**
 * The Rust core (`crates/fg-blueprint`, built into `packages/blueprint/wasm/`) seen from
 * TypeScript: loading the module, immediate mode (a block list rasterised in one call), and
 * scenes loaded from a SceneBin. One instance of the module serves every caller; each scene or
 * immediate renderer is a handle with its own buffers.
 *
 * Starting the engine is asynchronous in a browser or a Worker: `await initBlueprint()` once
 * (Workers pass a `WebAssembly.Module`: they cannot compile from bytes). Under Node and Bun the
 * engine starts by itself on first use, from the module file next to this package.
 */
import init, { type InitOutput, initSync } from "../../wasm/fg_blueprint.js";
import * as wasm from "../../wasm/fg_blueprint.js";
import { BlueprintError } from "../core/blocks";
import { createFrame, type Frame, SLOT_NAMES } from "../core/frame";
import type { ResolvedPalette } from "../core/palette";
import type { Block, View } from "../core/types";
import { packBlocks } from "./pack";

export type EngineSource =
  | URL
  | string
  | Response
  | BufferSource
  | WebAssembly.Module
  | Promise<Response | BufferSource | WebAssembly.Module>;

let output: InitOutput | null = null;

/** Starts the engine (once; later calls return at once). */
export async function initBlueprint(source?: EngineSource): Promise<void> {
  if (output) return;
  output = await init(source === undefined ? undefined : { module_or_path: source });
}

/** Starts the engine from bytes or a compiled module, synchronously. */
export function initBlueprintSync(source: BufferSource | WebAssembly.Module): void {
  if (output) return;
  output = initSync({ module: source });
}

interface NodeFs {
  readFileSync(path: string): Uint8Array;
}

/** The module's memory, starting the engine under Node or Bun when nobody has. */
export function engineMemory(): WebAssembly.Memory {
  if (!output) {
    const proc = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } })
      .process;
    const fs = proc?.getBuiltinModule?.("fs") as NodeFs | undefined;
    if (!fs || !import.meta.url.startsWith("file:"))
      throw new BlueprintError(
        "The Blueprint engine is not started: `await initBlueprint()` once before rendering.",
      );
    // A path made by hand: under jsdom the global `URL` is jsdom's, which resolves a file URL
    // against http://localhost and which `fs` refuses.
    const here = decodeURIComponent(import.meta.url.slice("file://".length));
    const root = here.slice(0, here.lastIndexOf("/src/engine/"));
    initBlueprintSync(fs.readFileSync(`${root}/wasm/fg_blueprint_bg.wasm`));
  }
  return output!.memory;
}

/** Whether the engine is running. */
export const engineStarted = (): boolean => output !== null;

/** The message of the engine's last error. */
export function lastEngineError(): string {
  const m = engineMemory();
  return new TextDecoder().decode(new Uint8Array(m.buffer, wasm.error_ptr(), wasm.error_len()));
}

/** Copies `bytes` into the module, runs `fn` on them, frees them. */
function withBytes<T>(bytes: Uint8Array, fn: (ptr: number, len: number) => T): T {
  const m = engineMemory();
  const ptr = wasm.alloc(bytes.length);
  new Uint8Array(m.buffer, ptr, bytes.length).set(bytes);
  try {
    return fn(ptr, bytes.length);
  } finally {
    wasm.dealloc(ptr, bytes.length);
  }
}

/** Shading of a frame: Bayer size (null: flat) and the optional halo. */
export interface Shading {
  dither: 2 | 4 | 8 | null;
  glow: { radius: number; density: number } | null;
}

/** One engine handle: a raster, its view and its shading. */
export class EngineHandle {
  protected constructor(protected handle: number) {}

  static immediate(): EngineHandle {
    engineMemory();
    return new EngineHandle(wasm.create());
  }

  /** Sizes the raster (and fits a loaded scene). */
  resize(width: number, height: number): void {
    if (wasm.resize(this.handle, width, height) === 2) throw new BlueprintError(lastEngineError());
  }

  shading(s: Shading): void {
    wasm.set_shading(this.handle, s.dither ?? 0, s.glow?.radius ?? 0, s.glow?.density ?? 0);
  }

  labels(on: boolean): void {
    wasm.set_labels(this.handle, on);
  }

  depth(mode: "painter" | "zbuffer"): void {
    wasm.set_depth(this.handle, mode === "zbuffer" ? 1 : 0);
  }

  get view(): View {
    return {
      u: wasm.view_u(this.handle),
      ox: wasm.view_ox(this.handle),
      oy: wasm.view_oy(this.handle),
    };
  }

  set view(v: View) {
    wasm.set_view(this.handle, v.u, v.ox, v.oy);
  }

  /** Fits the view on blocks (as `fit` of `core/project.ts`). */
  fitBlocks(blocks: readonly Block[], fill: number | undefined, unit: "even" | "any" | undefined) {
    wasm.set_fit(this.handle, fill ?? Number.NaN, unit === "any" ? 1 : unit === "even" ? 0 : -1);
    if (!withBytes(packBlocks(blocks), (p, n) => wasm.fit_blocks(this.handle, p, n)))
      throw new BlueprintError(lastEngineError());
  }

  /** Rasterises and shades packed blocks (`packBlocks`) on the current view. */
  drawPacked(packed: Uint8Array): void {
    if (!withBytes(packed, (p, n) => wasm.immediate(this.handle, p, n)))
      throw new BlueprintError(lastEngineError());
  }

  /** Rasterises and shades blocks on the current view. */
  draw(blocks: readonly Block[]): void {
    this.drawPacked(packBlocks(blocks));
  }

  /** The last frame's buffers as views on the module's memory: valid until the next call. */
  buffers() {
    const { buffer } = engineMemory();
    const w = wasm.width(this.handle);
    const h = wasm.height(this.handle);
    const n = w * h;
    return {
      width: w,
      height: h,
      material: new Uint8Array(buffer, wasm.material_ptr(this.handle), n),
      ink: new Uint8Array(buffer, wasm.ink_ptr(this.handle), n),
      tone: new Float32Array(buffer, wasm.tone_ptr(this.handle), n),
      color: new Uint8Array(buffer, wasm.slots_ptr(this.handle), n),
      tags: new Uint16Array(buffer, wasm.tags_ptr(this.handle), n),
    };
  }

  /** The last frame, copied out of the module's memory. */
  frame(): Frame {
    const b = this.buffers();
    const f = createFrame(b.width, b.height);
    f.material.set(b.material);
    f.ink.set(b.ink);
    f.tone.set(b.tone);
    f.color.set(b.color);
    return f;
  }

  /** RGBA of the last frame in `colors` (as `paint`), a view on the module's memory. */
  paint(colors: ResolvedPalette): Uint8ClampedArray {
    const palette = Uint8Array.from(SLOT_NAMES.flatMap((n) => [...colors[n]]));
    const ptr = withBytes(palette, (p) => wasm.paint(this.handle, p));
    const b = this.buffers();
    return new Uint8ClampedArray(engineMemory().buffer, ptr, b.width * b.height * 4);
  }

  dispose(): void {
    wasm.free(this.handle);
    this.handle = 0;
  }
}

/** A scene loaded from a SceneBin (`writeSceneBin` of `@forgeron/blueprint/format`). */
export class EngineScene extends EngineHandle {
  static load(sceneBin: Uint8Array): EngineScene {
    engineMemory();
    const handle = withBytes(sceneBin, (p, n) => wasm.load(p, n));
    if (!handle) throw new BlueprintError(lastEngineError());
    return new EngineScene(handle);
  }

  /** Fit options over the scene's own: a page's `data-fill` and `data-unit`. */
  fit(fill: number | undefined, unit: "even" | "any" | undefined): void {
    wasm.set_fit(this.handle, fill ?? Number.NaN, unit === "any" ? 1 : unit === "even" ? 0 : -1);
  }

  /** Sets entry `index` of the root scope (`t`, the vars, the root's params, in that order). */
  set(index: number, value: number): void {
    wasm.set_var(this.handle, index, value);
  }

  /** Draws the scene at its current inputs. */
  draw(): void;
  draw(blocks: readonly Block[]): void;
  draw(blocks?: readonly Block[]): void {
    if (blocks) return super.draw(blocks);
    if (!wasm.draw_scene(this.handle)) throw new BlueprintError(lastEngineError());
  }
}

let shared: EngineHandle | null = null;

/** The one immediate-mode handle of `render`. */
export function immediateHandle(): EngineHandle {
  shared ??= EngineHandle.immediate();
  return shared;
}

/**
 * Rasterises blocks on a `width` × `height` raster with a given view, labels and shading: the
 * engine side of `render`. Returns a copy of the frame.
 */
export function renderBlocks(
  blocks: readonly Block[],
  view: View,
  width: number,
  height: number,
  options: Shading & { labels: boolean },
): Frame {
  const h = immediateHandle();
  h.resize(width, height);
  h.view = view;
  h.labels(options.labels);
  h.shading(options);
  h.draw(blocks);
  return h.frame();
}
