// Scene handles for the layer and the viewer: a scene of a read library (or a part or an assembly
// framed alone) encoded once to SceneBin, then loaded in any of the four views and either depth mode
// by rewriting two words of the scene record, so a view switch costs a `load` (well under a
// millisecond for the largest scene), not a new encode.

import { BlueprintScene } from "@forgeron/blueprint/engine";
import {
  encodeScene,
  type EncodedScene,
  type Library,
  type Scene,
  type Turn,
} from "@forgeron/blueprint/format";
import type { BlueprintItemData, Depth } from "./kind";

/** The scene a part or an assembly is framed in when shown alone. */
export function previewScene(name: string, kind: "part" | "assembly"): Scene {
  return {
    title: `${kind === "part" ? "Part" : "Assembly"} ${name}`,
    depth: "painter",
    camera: { view: 0, fit: { fill: 0.8, unit: "any" } },
    root: { instances: [{ use: name }] },
  };
}

/** A library whose only scene shows `name` alone. */
function previewLibrary(lib: Library, name: string, kind: "part" | "assembly"): Library {
  return { ...lib, scenes: new Map([[name, previewScene(name, kind)]]) };
}

/** The scene an item shows, as the file states it (a preview's synthetic scene for a part). */
export function sceneOf(lib: Library, data: BlueprintItemData): Scene | undefined {
  if (data.preview) {
    const known =
      data.preview === "part" ? lib.parts.has(data.scene) : lib.assemblies.has(data.scene);
    return known ? previewScene(data.scene, data.preview) : undefined;
  }
  return lib.scenes.get(data.scene);
}

/** Framing a viewer gives a scene that carries none (the site's converted scenes leave it to the page). */
export const DEFAULT_FILL = 0.85;

const DEPTH_CODE: Record<Depth, number> = { painter: 0, zbuffer: 1 };

/** Words of the scene record (`engine/layout.ts`, `scene`), from its first word. */
const SCENE_WORDS = 12;
const SCENE_DEPTH = 3;
const SCENE_VIEW = 4;

/**
 * The bytes of `encoded` with the camera's view and the depth mode written over the scene's own.
 * The scene record is the last record before the string bytes, whose length is the strings' UTF-8.
 */
export function withView(encoded: EncodedScene, view: Turn, depth: Depth | undefined): Uint8Array {
  const bytes = encoded.bytes.slice();
  const encoder = new TextEncoder();
  let text = 0;
  for (const s of encoded.strings) text += encoder.encode(s).length;
  const record = bytes.length - text - SCENE_WORDS * 8;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  dv.setFloat64(record + SCENE_VIEW * 8, view, true);
  if (depth) dv.setFloat64(record + SCENE_DEPTH * 8, DEPTH_CODE[depth], true);
  return bytes;
}

/** What the viewer reads of a loaded scene besides the handle. */
export interface LoadedScene {
  scene: BlueprintScene;
  encoded: EncodedScene;
  /** The file's scene (or the preview's). */
  spec: Scene;
}

/** Encodes scenes once per file, scene and preview kind; loads them in any view and depth. */
export class SceneCache {
  private readonly encoded = new Map<string, { encoded: EncodedScene; spec: Scene }>();

  constructor(private readonly resolve: (file: string) => Library | undefined) {}

  /** Forgets a file's encodings (it was opened again with new content). */
  forget(file: string): void {
    for (const key of this.encoded.keys())
      if (key.startsWith(`${file}\u0000`)) this.encoded.delete(key);
  }

  private encode(data: BlueprintItemData): { encoded: EncodedScene; spec: Scene } | null {
    const key = `${data.file}\u0000${data.preview ?? "scene"}\u0000${data.scene}`;
    const hit = this.encoded.get(key);
    if (hit) return hit;
    const lib = this.resolve(data.file);
    if (!lib) return null;
    const spec = sceneOf(lib, data);
    if (!spec) return null;
    const source = data.preview ? previewLibrary(lib, data.scene, data.preview) : lib;
    const fill = spec.camera.fit.fill ?? DEFAULT_FILL;
    const encoded = encodeScene(source, data.scene, { fill });
    const out = { encoded, spec };
    this.encoded.set(key, out);
    return out;
  }

  /** A new handle on the item's scene, in its view and depth; null when the file or scene is unknown. */
  load(data: BlueprintItemData): LoadedScene | null {
    const e = this.encode(data);
    if (!e) return null;
    const { encoded, spec } = e;
    const active = spec.vars?.active;
    const scene = new BlueprintScene(
      { ...encoded, bytes: withView(encoded, data.view, data.depth) },
      active?.type === "int"
        ? { default: active.default, ...(active.cycle ? { cycle: active.cycle } : {}) }
        : null,
    );
    return { scene, encoded, spec };
  }
}
