/**
 * The Part library at build time: every part and assembly of the Blueprint library
 * (`@forgeron/libraries/blueprints`), each framed alone and drawn by the engine into a static
 * SVG (`toSvg`, colours as `var(--token, fallback)`), the same core the site and the viewer run.
 * Node only: it starts the engine from the module file.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { dither, pixelate, plan, toSvg } from "@forgeron/blueprint";
import { createScene, initBlueprintSync } from "@forgeron/blueprint/engine";
import {
  type BlueprintFile,
  type Library,
  type Prim,
  readBlueprint,
  type Scene,
} from "@forgeron/blueprint/format";
import { library } from "@forgeron/libraries/blueprints";

/** One card of the library page. */
export interface PartEntry {
  /** Unique on the page: "erp-village.bp/tower". */
  id: string;
  kind: "part" | "assembly";
  name: string;
  title: string | undefined;
  /** The file it comes from, "erp-village.bp". */
  file: string;
  /** The file's id, "site/erp-village". */
  fileId: string;
  /** Prims by kind (a part) or instances (an assembly). */
  counts: Readonly<Record<string, number>>;
  /** The number of prims, or of instances. */
  size: number;
  params: readonly string[];
  sockets: readonly string[];
  /** The still picture: an SVG, empty when nothing is drawn. */
  svg: string;
  /** Raster pixels drawn (not background). */
  drawn: number;
  /** Set when the defaults draw nothing and the picture is the part in its scene. */
  from: string | undefined;
}

/** CSS size of a preview, and its raster pixel: the site's cards use 2. */
export const PREVIEW = { width: 360, height: 240, pixel: 2 } as const;

let started = false;

/** Starts the engine from `packages/blueprint/wasm/` (a bundled build cannot find it by itself). */
function startEngine(): void {
  if (started) return;
  const entry = createRequire(import.meta.url).resolve("@forgeron/blueprint");
  const root = dirname(dirname(entry));
  initBlueprintSync(readFileSync(join(root, "wasm", "fg_blueprint_bg.wasm")));
  started = true;
}

/** The scene a part or an assembly is framed in when drawn alone (as the viewer's preview). */
function aloneScene(
  name: string,
  kind: "part" | "assembly",
  params?: Record<string, boolean>,
): Scene {
  return {
    title: `${kind === "part" ? "Part" : "Assembly"} ${name}`,
    depth: "painter",
    camera: { view: 0, fit: { fill: 0.8, unit: "any" } },
    root: { instances: [params ? { use: name, params } : { use: name }] },
  };
}

const FILTERS = [pixelate(PREVIEW.pixel), dither({ matrix: 4 })];

/** A picture of the library page. */
export interface Still {
  svg: string;
  drawn: number;
  /** Where the picture comes from when the defaults draw nothing: "erp-village at progress 0.45, t = 0". */
  from?: string;
}

/** Draws `scene` of `lib` at time `t` with these vars, as an SVG. */
export function drawStill(
  lib: Library,
  scene: string,
  title: string,
  at: { t: number; vars: Record<string, number> },
): Still {
  startEngine();
  const p = plan(FILTERS);
  const s = lib.scenes.get(scene);
  const handle = createScene(lib, scene, {
    fill: s?.camera.fit.fill ?? 0.8,
    unit: s?.camera.fit.unit ?? "any",
    labels: true,
  });
  try {
    handle.resize(
      Math.floor(PREVIEW.width / PREVIEW.pixel),
      Math.floor(PREVIEW.height / PREVIEW.pixel),
    );
    handle.shading(p.dither, p.glow);
    for (const [name, value] of Object.entries(at.vars)) handle.set(name, value);
    handle.frame(at.t, 0);
    const frame = handle.snapshot();
    let drawn = 0;
    for (const c of frame.color) if (c !== 0) drawn++;
    const svg = drawn ? toSvg({ frame, view: handle.view, plan: p }, { title }) : "";
    return { svg, drawn };
  } finally {
    handle.dispose();
  }
}

/** Progress values and times a part is looked for in its scene. */
const PROGRESS = Array.from({ length: 21 }, (_, k) => k / 20);
const TIMES = [0, 1.7, 4.3];

/**
 * A part whose defaults draw nothing (the village's parts take their sizes from the story's
 * `calc` tracks) is drawn as it stands in a scene of its file: every other root instance and
 * conveyor hidden, at the progress and time where it draws the most, then framed on itself.
 */
function inScene(lib: Library, name: string): Still | null {
  for (const [sceneName, s] of lib.scenes) {
    const used = s.root.instances.some((i) => i.use === name);
    const timelines = Object.fromEntries(
      Object.entries(s.timelines ?? {}).map(([k, tl]) => [
        k,
        { ...tl, tracks: tl.tracks.filter((t) => t.kind !== "conveyor" || t.use === name) },
      ]),
    );
    const conveyed = Object.values(timelines).some((tl) =>
      tl.tracks.some((t) => t.kind === "conveyor"),
    );
    if (!used && !conveyed) continue;
    const only: Scene = {
      ...s,
      root: {
        ...s.root,
        instances: s.root.instances.map((i) => (i.use === name ? i : { ...i, visible: false })),
      },
      timelines,
    };
    const key = `\u0000in:${name}`;
    const progress = Object.entries(s.vars ?? {})
      .filter(([, v]) => v.type === "progress")
      .map(([k]) => k);
    const samples = (progress.length ? PROGRESS : [0]).flatMap((p) =>
      TIMES.map((t) => ({ t, vars: Object.fromEntries(progress.map((k) => [k, p])) })),
    );
    // The scene's own framing finds the moment; a second pass frames the part at that moment.
    const probe: Library = { ...lib, scenes: new Map([[key, only]]) };
    let best: { at: (typeof samples)[number]; drawn: number } | null = null;
    for (const at of samples) {
      const { drawn } = drawStill(probe, key, name, at);
      if (drawn > (best?.drawn ?? 0)) best = { at, drawn };
    }
    if (!best) continue;
    const { box: _box, ...fit } = s.camera.fit;
    const framed: Scene = {
      ...only,
      camera: { ...s.camera, fit: { ...fit, fill: 0.8, unit: "any", at: best.at } },
    };
    const out = drawStill({ ...lib, scenes: new Map([[key, framed]]) }, key, name, best.at);
    const p = progress.length ? ` at ${progress[0]} ${best.at.vars[progress[0]!]}` : "";
    return { ...out, from: `${sceneName}${p}, t = ${best.at.t}` };
  }
  return null;
}

/** The still SVG of `name` alone (its params at their defaults), else as it stands in its scene. */
function previewSvg(lib: Library, name: string, kind: "part" | "assembly"): Still {
  const key = `\u0000preview:${name}`;
  const draw = (params?: Record<string, boolean>) =>
    drawStill({ ...lib, scenes: new Map([[key, aloneScene(name, kind, params)]]) }, key, name, {
      t: 0,
      vars: {},
    });
  const alone = draw();
  if (alone.drawn) return alone;
  // Flags off by default (the village's walkers: `route`, `window`) hide what they gate: on.
  const spec = kind === "part" ? lib.parts.get(name) : lib.assemblies.get(name);
  const flags = Object.entries(spec?.params ?? {}).filter(([, p]) => p.type === "flag");
  if (flags.length) {
    const on = draw(Object.fromEntries(flags.map(([k]) => [k, true])));
    if (on.drawn) return { ...on, from: "alone, every flag on" };
  }
  return inScene(lib, name) ?? inParent(lib, name) ?? alone;
}

/** A part used only inside an assembly (the village's walkers): drawn as that assembly in its scene. */
function inParent(lib: Library, name: string): Still | null {
  for (const [parent, asm] of lib.assemblies) {
    if (!asm.instances.some((i) => i.use === name)) continue;
    const out = inScene(lib, parent) ?? inParent(lib, parent);
    if (out?.drawn) return { ...out, from: `inside ${parent}, ${out.from ?? "alone"}` };
  }
  return null;
}

function primCounts(prims: readonly Prim[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of prims) out[p.kind] = (out[p.kind] ?? 0) + 1;
  return out;
}

/** Every part and assembly of every top-level library file, with its preview. */
export async function libraryParts(): Promise<PartEntry[]> {
  const out: PartEntry[] = [];
  for (const file of library) {
    const text = await file.load();
    const lib = await readBlueprint(JSON.parse(text) as BlueprintFile, { location: file.name });
    const own = lib.file;
    for (const [name, part] of Object.entries(own.parts ?? {})) {
      const pic = part.prims.length ? previewSvg(lib, name, "part") : { svg: "", drawn: 0 };
      out.push({
        id: `${file.name}/${name}`,
        kind: "part",
        name,
        title: part.title,
        file: file.name,
        fileId: own.id,
        counts: primCounts(part.prims),
        size: part.prims.length,
        params: Object.keys(part.params ?? {}),
        sockets: Object.keys(part.sockets ?? {}),
        svg: pic.svg,
        drawn: pic.drawn,
        from: pic.from,
      });
    }
    for (const [name, asm] of Object.entries(own.assemblies ?? {})) {
      const pic = previewSvg(lib, name, "assembly");
      out.push({
        id: `${file.name}/${name}`,
        kind: "assembly",
        name,
        title: asm.title,
        file: file.name,
        fileId: own.id,
        counts: { instance: asm.instances.length },
        size: asm.instances.length,
        params: Object.keys(asm.params ?? {}),
        sockets: Object.keys(asm.sockets ?? {}),
        svg: pic.svg,
        drawn: pic.drawn,
        from: pic.from,
      });
    }
  }
  return out;
}

/** Fails the build when a part that has prims, or an assembly, draws nothing. */
export function assertDrawn(entries: readonly PartEntry[]): void {
  const blank = entries.filter((e) => e.size > 0 && (e.drawn === 0 || !e.svg.includes("<path")));
  if (blank.length)
    throw new Error(`Blueprint library: no picture for ${blank.map((e) => e.id).join(", ")}`);
}
