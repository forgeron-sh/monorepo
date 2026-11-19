/**
 * Client side of the site's pages, on top of @forgeron/blueprint. The canvases are written in the
 * pages as plain `<canvas>` elements (so the pages' scoped styles reach them and they keep their
 * CSS size before any script runs); their attributes are the declarative options, read here once:
 *
 * - `canvas[data-iso=<scene>]`: an isometric scene of `SCENES`, played by the engine (the 2D
 *   presenter). Options: `data-scale` (pixel size, 3), `data-fill`, `data-unit="any"`,
 *   `data-cycle` (seconds per highlighted index), `data-count` (how many indices the cycle
 *   visits, 5), `data-active`, `data-labels="off"`, `data-accent="off"`, `data-bg` (token of the
 *   background), `data-signal` (token for the signal family);
 * - `canvas[data-shader=ember|globe|dissolve|field]`: a generator field (`mountField`). Options:
 *   `data-px` (cell size, 4), `data-accent="off"`, `data-bg`, `data-ink`;
 * - `canvas[data-dither-img=<url>]`: a dithered picture (`mountImage`). Options: `data-px`, `data-gain`.
 *
 * The iso scenes play in a worker (`worker.ts`, `playInWorker`): each canvas is handed over as
 * an OffscreenCanvas, and this page only sends its inputs and reads back the states and the
 * highlighted index. The engine and the scenes (`sources.ts`) load only when the first iso canvas
 * comes near the screen; a browser without OffscreenCanvas or module workers plays them in the
 * page instead (`inline.ts`). Nothing here imports a scene function or the engine.
 *
 * No canvas stays blank by accident (docs/blueprint/engine.md, Worker note 14): a browser whose
 * WebAssembly has no SIMD cannot run the engine, so its iso canvases are never handed over and
 * keep what the page draws without them (their box and background); a worker that fails (its
 * script does not load or throws, the engine does not start, no scene is ready in 10 s) is
 * reported once, and each canvas it held is replaced by a fresh clone played in the page.
 *
 * Page scripts drive a scene through `isoCanvas(el)`: a typed handle instead of DOM events,
 * usable at once (what it is told before the engine starts is applied when it does).
 */
import {
  type ColorRef,
  dither,
  type FieldMode,
  FIELD_MODES,
  type Filter,
  palette,
  pixelate,
} from "@forgeron/blueprint";
import {
  connectWorker,
  mountField,
  mountImage,
  playInWorker,
  type RemotePlayer,
  simdSupported,
  type WorkerPlayOptions,
  workerSupported,
} from "@forgeron/blueprint/dom";
import type { BlueprintMeta, Camera } from "@forgeron/blueprint/format";
import cli from "@forgeron/libraries/blueprints/cli.bp?meta";
import village from "@forgeron/libraries/blueprints/erp-village.bp?meta";
import line from "@forgeron/libraries/blueprints/control/production-line.bp?meta";
import resources from "@forgeron/libraries/blueprints/control/resources.bp?meta";
import stack6 from "@forgeron/libraries/blueprints/control/stack6.bp?meta";
import hostServers from "@forgeron/libraries/blueprints/host-servers.bp?meta";
import mcp from "@forgeron/libraries/blueprints/mcp.bp?meta";
import usageIso from "@forgeron/libraries/blueprints/usage-iso.bp?meta";
import web from "@forgeron/libraries/blueprints/web.bp?meta";

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

/** What the page reads of the scenes from files without playing them: their cameras. */
const META = new Map<string, BlueprintMeta>(
  Object.entries({
    web,
    mcp,
    cli,
    "usage-iso": usageIso,
    "host-servers": hostServers,
    "erp-village": village,
    "production-line": line,
    resources,
    stack6,
  }),
);

type Play = (el: HTMLCanvasElement, name: string, options: WorkerPlayOptions) => RemotePlayer;

/** How canvases play once the engine is chosen, and the canvases waiting for it. */
let play: Play | null = null;
const waiting: (() => void)[] = [];
/** The canvases playing, each with what moves it to a fresh canvas if the worker fails. */
const playing: (() => void)[] = [];
let starting = false;
/** Whether the engine's module can run here at all (it needs WebAssembly SIMD). */
const engine = simdSupported();

function ready(p: Play) {
  play = p;
  for (const start of waiting.splice(0)) start();
}

/** Plays the scenes in the page (`inline.ts`). */
function inPage() {
  import("./inline").then(
    (m) => ready(m.playInline),
    (error: unknown) => console.error(`Blueprint: the scenes could not load (${String(error)}).`),
  );
}

/** Starts the engine: in a worker where the browser can, else in the page. */
function startEngine() {
  if (starting) return;
  starting = true;
  near?.disconnect();
  if (!workerSupported()) return inPage();
  const worker = connectWorker(
    new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
    {
      onFail(reason) {
        console.error(`Blueprint worker failed (${reason}); the scenes play in the page.`);
        play = null;
        waiting.push(...playing.splice(0));
        inPage();
      },
    },
  );
  ready((el, name, options) => playInWorker(el, worker, name, options));
}

/** The engine starts when an iso canvas comes within a screen's height of the viewport. */
const near =
  typeof IntersectionObserver === "undefined"
    ? null
    : new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) startEngine();
        },
        { rootMargin: "100% 0px" },
      );

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
 * scripts may run in any order). Null when the element names no scene.
 */
export function isoCanvas(target: HTMLElement | null): IsoCanvas | null {
  if (!(target instanceof HTMLCanvasElement)) return null;
  let el = target;
  const known = handles.get(el);
  if (known) return known;
  let name = el.dataset.iso ?? "";
  if (!name) return null;
  const listeners = new Map<string, Set<(value: number, label: string) => void>>();
  const latest = new Map<string, [number, string]>();
  const values = new Map<string, number>();
  const cycle = Number(el.dataset.cycle ?? 0);
  const count = Number(el.dataset.count ?? 5);
  const { fill, unit } = el.dataset;
  let selected = el.dataset.active !== undefined ? Number(el.dataset.active) : -1;
  let player: RemotePlayer | null = null;

  const forward = (key: string) =>
    player!.on(key, (value, label) => {
      latest.set(key, [value, label]);
      for (const fn of listeners.get(key) ?? []) fn(value, label);
    });
  const start = () => {
    // The worker uses `cycle` for a scene function only, as `playCompiled` does.
    player = play!(el, name, {
      filters: filtersOf(el),
      labels: el.dataset.labels !== "off",
      ...(fill !== undefined ? { fill: Number(fill) } : {}),
      ...(unit === "any" ? { unit: "any" as const } : {}),
      ...(cycle ? { cycle: { every: cycle, count } } : {}),
    });
    for (const key of new Set(["active", "state", ...listeners.keys()])) forward(key);
    if (selected >= 0) player.set("active", selected);
    for (const [v, value] of values) player.set(v, value);
    playing.push(restart);
  };
  // The worker failed: its canvas cannot come back, so a clone (same attributes, so the same
  // styles) takes its place, and the scene starts again on it with what the page told it.
  const restart = () => {
    player?.destroy();
    player = null;
    const fresh = el.cloneNode(false) as HTMLCanvasElement;
    el.replaceWith(fresh);
    handles.set(fresh, handle);
    el = fresh;
    start();
  };
  const listen = (key: string, fn: (value: number, label: string) => void) => {
    let set = listeners.get(key);
    if (!set) {
      listeners.set(key, (set = new Set()));
      if (player && key !== "active" && key !== "state") forward(key);
    }
    set.add(fn);
    const last = latest.get(key);
    if (last) fn(last[0], last[1]);
    return () => set.delete(fn);
  };

  const handle: IsoCanvas = {
    select(n) {
      selected = n;
      if (!player) return;
      if (n >= 0) player.set("active", n);
      else player.release("active");
    },
    show(next) {
      if (!next) return;
      el.dataset.iso = next;
      name = next;
      latest.clear();
      player?.show(next);
    },
    onActive: (fn) => listen("active", (value) => fn(value)),
    set(v, value) {
      if (values.get(v) === value) return;
      values.set(v, value);
      player?.set(v, value);
    },
    on: listen,
    get camera() {
      return META.get(name)?.scenes[name]?.camera ?? null;
    },
  };
  handles.set(el, handle);
  if (!engine) return handle;
  if (play) start();
  else {
    waiting.push(start);
    if (near) near.observe(el);
    else startEngine();
  }
  return handle;
}

for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-iso]")) isoCanvas(c);
