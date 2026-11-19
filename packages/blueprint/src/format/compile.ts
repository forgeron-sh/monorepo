/**
 * The compiled form of a Blueprint file: each scene as its SceneBin bytes and the few names a
 * player needs, made once at build time (`@forgeron/blueprint/vite`, an import of `x.bp?compiled`)
 * so that a page ships neither the JSON nor the reader and the SceneBin writer. `loadScene` of
 * `@forgeron/blueprint/engine` plays it; it plays exactly as `createScene` on the read library.
 */
import type { Library } from "./read";
import { encodeScene } from "./scenebin";
import type { Camera } from "./types";

/** One scene, compiled: written with the scene's own fit and labels (a page's come on top). */
export interface CompiledScene {
  /** The SceneBin bytes; the string table (tags, events) is read back from them. */
  bin: Uint8Array;
  /** The root scope, in slot order: `t`, the vars, then the root's params. */
  scope: readonly string[];
  /** Each machine and its state names, in the order of the outputs block. */
  machines: readonly { name: string; states: readonly string[] }[];
  /** The scene's `active` var when it is an int (the script layer draws at its value). */
  active: { default: number; cycle?: { every: number; count: number } } | null;
  title: string;
  description?: string;
  /** Label texts of the library's parts, for the accessible overlay. */
  labels: readonly string[];
  camera: Camera;
}

/** Every scene of a file, compiled. */
export interface CompiledBlueprint {
  /** The file's id. */
  id: string;
  scenes: Readonly<Record<string, CompiledScene>>;
}

/** Label texts of every part of a library (what the overlay lists for a scene of it). */
export function labelsOf(lib: Library): string[] {
  const out: string[] = [];
  for (const part of lib.parts.values())
    for (const p of part.prims) if (p.kind === "label") out.push(p.text);
  return out;
}

/** The compiled form of every scene of a read library. */
export function compileBlueprint(lib: Library): CompiledBlueprint {
  const labels = labelsOf(lib);
  const scenes: Record<string, CompiledScene> = {};
  for (const [name, scene] of lib.scenes) {
    const encoded = encodeScene(lib, name);
    const active = scene.vars?.active;
    scenes[name] = {
      bin: encoded.bytes,
      scope: encoded.scope,
      machines: encoded.machines,
      active:
        active?.type === "int"
          ? { default: active.default, ...(active.cycle ? { cycle: active.cycle } : {}) }
          : null,
      title: scene.title,
      ...(scene.description !== undefined ? { description: scene.description } : {}),
      labels,
      camera: scene.camera,
    };
  }
  return { id: lib.file.id, scenes };
}
