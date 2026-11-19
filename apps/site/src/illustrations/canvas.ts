/**
 * Client side of the site's pages, on top of @forgeron/blueprint. The canvases are written in the
 * pages as plain `<canvas>` elements (so the pages' scoped styles reach them and they keep their
 * CSS size before any script runs); their attributes are the declarative options, read here once:
 *
 * - `canvas[data-iso=<scene>]`: an isometric scene of `SCENES`, played by the engine (`play`, the
 *   2D presenter). Options: `data-scale` (pixel size, 3), `data-fill`, `data-unit="any"`,
 *   `data-cycle` (seconds per highlighted index), `data-count` (how many indices the cycle
 *   visits, 5), `data-active`, `data-labels="off"`, `data-accent="off"`, `data-bg` (token of the
 *   background), `data-signal` (token for the signal family);
 * - `canvas[data-shader=ember|globe|dissolve|field]`: a generator field (`mountField`). Options:
 *   `data-px` (cell size, 4), `data-accent="off"`, `data-bg`, `data-ink`;
 * - `canvas[data-dither-img=<url>]`: a dithered picture (`mountImage`). Options: `data-px`, `data-gain`.
 *
 * A scene plays from data when it was converted by hand (`library/<scene>.bp` with its
 * timelines), on the script layer otherwise (its function's blocks, rasterised by the engine).
 * The scroll and hover scenes add a control file (`library/control/<scene>.bp`): its vars,
 * machines and camera are data, its pixels stay the function's (docs/blueprint/engine.md, P4).
 * The files are imported compiled (`?compiled`, `@forgeron/blueprint/vite`): the page gets their
 * SceneBin bytes, not their JSON, and ships no reader or SceneBin writer.
 *
 * Page scripts drive a scene through `isoCanvas(el)`: a typed handle instead of DOM events.
 */
import {
  type ColorRef,
  dither,
  type FieldMode,
  FIELD_MODES,
  type Filter,
  initBlueprint,
  palette,
  pixelate,
} from "@forgeron/blueprint";
import {
  type CompiledSource,
  mountField,
  mountImage,
  playCompiled,
  type Player,
  type PlayOptions,
} from "@forgeron/blueprint/dom";
import type { Camera, CompiledBlueprint } from "@forgeron/blueprint/format";
import cli from "./library/cli.bp?compiled";
import village from "./library/control/erp-village.bp?compiled";
import line from "./library/control/production-line.bp?compiled";
import resources from "./library/control/resources.bp?compiled";
import stack6 from "./library/control/stack6.bp?compiled";
import hostServers from "./library/host-servers.bp?compiled";
import mcp from "./library/mcp.bp?compiled";
import usageIso from "./library/usage-iso.bp?compiled";
import web from "./library/web.bp?compiled";
import { lineStore } from "./objects";
import { SCENES } from "./scenes";
import { villageStore } from "./village";

const token = (name: string, fallback: string): ColorRef => ({ var: name, fallback });

/** A scene on a canvas. */
export interface IsoCanvas {
  /** Highlights index `n`, or hands the highlight back to the cycle with -1. */
  select(n: number): void;
  /** Swaps the scene for another of `SCENES`; refits and redraws. Unknown names are ignored. */
  show(scene: string): void;
  /**
   * Calls `fn` with the highlighted index each time it changes, and at once with the current one
   * if a frame was already drawn (a page script may subscribe after the first frame); returns an
   * unsubscribe.
   */
  onActive(fn: (active: number) => void): () => void;
  /** Sets a var of the scene (`set("progress", p)`); a value equal to the last one is ignored. */
  set(name: string, value: number): void;
  /**
   * Calls `fn` when a var, a machine's state (`"state"`, with the state's name) or the hovered tag
   * changes; at once with the current state if a frame was already drawn. Returns an unsubscribe.
   */
  on(name: string, fn: (value: number, label: string) => void): () => void;
  /** The scene's camera from its file (framing box, shots), or null for a script scene. */
  readonly camera: Camera | null;
}

const handles = new WeakMap<HTMLCanvasElement, IsoCanvas>();

const isField = (name: string | undefined): name is FieldMode =>
  name !== undefined && name in FIELD_MODES;

for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-dither-img]")) {
  if (!c.dataset.ditherImg) continue;
  mountImage(c, c.dataset.ditherImg ?? "", {
    pixel: Number(c.dataset.px ?? 3),
    gain: Number(c.dataset.gain ?? 1.1),
  });
}
for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-shader]")) {
  const { shader, px, accent, bg, ink } = c.dataset;
  mountField(c, {
    mode: isField(shader) ? shader : "ember",
    pixel: Number(px ?? 4),
    accent: accent !== "off",
    colors: {
      ...(bg ? { bg: token(bg, "#0a0a0a") } : {}),
      ...(ink ? { ink: token(ink, "#ededed") } : {}),
    },
  });
}

const DATA = new Map<string, CompiledBlueprint>(
  Object.entries({ web, mcp, cli, "usage-iso": usageIso, "host-servers": hostServers }),
);
const CONTROL = new Map<string, CompiledBlueprint>(
  Object.entries({ "erp-village": village, "production-line": line, resources, stack6 }),
);

// The engine starts once: page scripts importing this module wait for it (top-level await), so
// `isoCanvas` stays synchronous for them.
await initBlueprint();

/** The module stores the scroll scenes' functions read their progress from. */
const STORES: Record<string, { progress: number }> = {
  "erp-village": villageStore,
  "production-line": lineStore,
};

/**
 * The scene's source: its data, its control file over its function (which reads the progress
 * the page set, through its store), or its function.
 */
function sourceOf(
  name: string,
  vars: ReadonlyMap<string, number> = new Map(),
): CompiledSource | (typeof SCENES)[string] | undefined {
  const fn = SCENES[name];
  const data = DATA.get(name);
  if (data) return { compiled: data, scene: name };
  const control = CONTROL.get(name);
  if (!control || !fn) return fn;
  const store = STORES[name];
  const script: typeof fn = store
    ? (frame) => {
        store.progress = vars.get("progress") ?? 0;
        return fn(frame);
      }
    : fn;
  return { compiled: control, scene: name, script };
}

function filtersOf(el: HTMLCanvasElement): Filter[] {
  const { scale, accent, bg, signal } = el.dataset;
  return [
    pixelate(Number(scale ?? 3)),
    dither({ matrix: 4 }),
    palette({
      ...(bg ? { bg: token(bg, "#0a0a0a") } : {}),
      // `data-accent="off"`: what would glow in ember is drawn in ink; signal stays ember.
      ...(accent === "off" ? { accent: token("--ink", "#ededed") } : {}),
      // `data-signal=<token>`: the signal family in another colour (the village's money).
      ...(signal ? { signal: token(signal, "#3ddc84") } : {}),
    }),
  ];
}

/**
 * The handle of an iso canvas, mounting it on first use (the layout's script and the page's
 * scripts may run in any order). Null when the element names no known scene.
 */
export function isoCanvas(el: HTMLElement | null): IsoCanvas | null {
  if (!(el instanceof HTMLCanvasElement)) return null;
  const known = handles.get(el);
  if (known) return known;
  let name = el.dataset.iso ?? "";
  if (!sourceOf(name)) return null;
  const listeners = new Map<string, Set<(value: number, label: string) => void>>();
  const latest = new Map<string, [number, string]>();
  const values = new Map<string, number>();
  const cycle = Number(el.dataset.cycle ?? 0);
  const count = Number(el.dataset.count ?? 5);
  const { fill, unit } = el.dataset;
  let selected = el.dataset.active !== undefined ? Number(el.dataset.active) : -1;
  let lib: CompiledBlueprint | null = null;
  let player: Player;
  let off: (() => void)[] = [];
  /** Whether the scene has var `v` (a script scene takes any). */
  const has = (v: string) =>
    !lib || ((player.scene as { scope?: readonly string[] }).scope ?? []).includes(v);

  const start = () => {
    const source = sourceOf(name, values)!;
    lib = typeof source === "object" && "compiled" in source ? source.compiled : null;
    const options: PlayOptions = {
      filters: filtersOf(el),
      labels: el.dataset.labels !== "off",
      overlay: false,
      ...(fill !== undefined ? { fill: Number(fill) } : {}),
      ...(unit === "any" ? { unit: "any" as const } : {}),
      ...(!lib && cycle ? { cycle: { every: cycle, count } } : {}),
    };
    player = playCompiled(el, source, options);
    if (selected >= 0 && has("active")) player.set("active", selected);
    for (const [v, value] of values) if (has(v)) player.set(v, value);
    off = ["active", "state", ...listeners.keys()]
      .filter((key, i, all) => all.indexOf(key) === i)
      .map((key) =>
        player.on(key, (value, label) => {
          latest.set(key, [value, label]);
          for (const fn of listeners.get(key) ?? []) fn(value, label);
        }),
      );
  };
  const listen = (key: string, fn: (value: number, label: string) => void) => {
    let set = listeners.get(key);
    if (!set) {
      listeners.set(key, (set = new Set()));
      if (key !== "active" && key !== "state")
        off.push(
          player.on(key, (value, label) => {
            latest.set(key, [value, label]);
            for (const f of listeners.get(key) ?? []) f(value, label);
          }),
        );
    }
    set.add(fn);
    const last = latest.get(key);
    if (last) fn(last[0], last[1]);
    return () => set.delete(fn);
  };
  start();

  const handle: IsoCanvas = {
    select(n) {
      selected = n;
      if (!has("active")) return;
      if (n >= 0) player.set("active", n);
      else player.release("active");
    },
    show(next) {
      if (!sourceOf(next)) return;
      el.dataset.iso = next;
      name = next;
      for (const f of off) f();
      player.destroy();
      latest.clear();
      start();
    },
    onActive: (fn) => listen("active", (value) => fn(value)),
    set(v, value) {
      if (values.get(v) === value) return;
      values.set(v, value);
      if (has(v)) player.set(v, value);
    },
    on: listen,
    get camera() {
      return lib?.scenes[name]?.camera ?? null;
    },
  };
  handles.set(el, handle);
  return handle;
}

for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-iso]")) isoCanvas(c);
