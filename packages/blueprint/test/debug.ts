/**
 * The test module (`wasm/debug/`, fg-blueprint built with its "debug" feature): the shipped
 * module plus the debug and contract outputs (`describe`, `flat_blocks`), which the shipped
 * module leaves out for its size budget. The contract and rig tests read a scene's tree and blocks
 * through it; everything else runs on the shipped module. It is its own instance, with its own
 * memory, started from the file under Node.
 */
import { readFileSync } from "node:fs";
import * as dbg from "../wasm/debug/fg_blueprint.js";
import { initSync } from "../wasm/debug/fg_blueprint.js";
import { offsets } from "../src/engine/layout";

let memory: WebAssembly.Memory | null = null;

function start(): WebAssembly.Memory {
  memory ??= initSync({
    module: readFileSync(new URL("../wasm/debug/fg_blueprint_bg.wasm", import.meta.url)),
  }).memory;
  return memory;
}

const IN = offsets("inputs");

function error(): string {
  return new TextDecoder().decode(new Uint8Array(start().buffer, dbg.error_ptr(), dbg.error_len()));
}

/** A SceneBin loaded into the test module. */
export class DebugScene {
  private constructor(private handle: number) {}

  static load(sceneBin: Uint8Array): DebugScene {
    const m = start();
    const ptr = dbg.alloc(sceneBin.length);
    new Uint8Array(m.buffer, ptr, sceneBin.length).set(sceneBin);
    const handle = dbg.load(ptr, sceneBin.length);
    dbg.dealloc(ptr, sceneBin.length);
    if (!handle) throw new Error(error());
    return new DebugScene(handle);
  }

  /** Entry `index` of the root scope (`t`, the vars, the root's params). */
  set(index: number, value: number): void {
    dbg.set_var(this.handle, index, value);
  }

  resize(width: number, height: number): void {
    dbg.resize(this.handle, width, height);
  }

  /** One frame at `time` (the player's `frame`: vars, machines, timelines). */
  frame(time: number, dt = 0): void {
    const m = start();
    const inputs = new Float64Array(
      m.buffer,
      dbg.inputs_ptr(this.handle),
      dbg.inputs_len(this.handle),
    );
    inputs[IN.time] = time;
    inputs[IN.dt] = dt;
    inputs[IN.blocks] = 0;
    if (dbg.frame(this.handle) & 16) throw new Error(error());
  }

  /** The tree the engine read, as text (`describeScene` of the library prints the same). */
  describe(): string {
    const n = dbg.describe(this.handle);
    return new TextDecoder().decode(new Uint8Array(start().buffer, dbg.out_ptr(), n).slice());
  }

  /** The scene's blocks at its current inputs, packed as `packBlocks` packs them. */
  flatBlocks(): Uint8Array {
    const n = dbg.flat_blocks(this.handle);
    if (!n) throw new Error(error());
    return new Uint8Array(start().buffer, dbg.out_ptr(), n).slice();
  }

  dispose(): void {
    dbg.free(this.handle);
    this.handle = 0;
  }
}
