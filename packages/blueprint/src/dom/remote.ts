/**
 * `playInWorker`: `play` with the engine in a worker (docs/blueprint/engine.md, "Worker and
 * lazy-load notes"). The canvas goes to the worker (`transferControlToOffscreen`); the page keeps
 * only its inputs (CSS size, the palette read from its tokens, visibility, reduced motion, the
 * pointer, `set`, `release`, `emit`) and the outputs it listens to, so a frame costs the page
 * nothing. The worker runs `serveBlueprint` with a resolver from scene names to sources.
 *
 * `workerSupported()` says whether the browser can (OffscreenCanvas and module workers); a page
 * that gets false plays in the page with `playCompiled`. `simdSupported()` says whether it can run
 * the engine at all (its module needs WebAssembly SIMD). `connectWorker(worker, { onFail })`
 * reports a worker that cannot play (its script did not load or threw, the engine did not start,
 * no scene was ready in time) once, after terminating it, so the page can play its scenes on fresh
 * canvases instead: a canvas handed over cannot come back.
 */
import { plan } from "../core/filters";
import { resolvePalette } from "../core/palette";
import type { FromWorker, ToWorker, WorkerPlayOptions, WorkerSize } from "./worker-protocol";

export type { WorkerPlayOptions } from "./worker-protocol";

type Listener = (value: number, label: string) => void;

/** A scene played in a worker: `Player`'s inputs and outputs. */
export interface RemotePlayer {
  set(name: string, value: number): void;
  release(name: string): void;
  emit(event: string): void;
  /**
   * `"active"`, a var, `"state"`, `"hover"`: calls `fn` on each change, and at once with the last
   * value when one came. Returns an unsubscribe.
   */
  on(name: string, fn: Listener): () => void;
  /** Swaps the scene on the same canvas; a name the worker does not know is ignored. */
  show(scene: string): void;
  destroy(): void;
}

/** What `connectWorker` does when the worker cannot play. */
export interface ConnectOptions {
  /**
   * Called once, after the worker is terminated, when it cannot play: an `error` or
   * `messageerror` event, the engine or the resolver failing to start, or no scene `ready`
   * within `timeout` of the first mount. The reason is not logged: the caller reports it. Without
   * it, errors are logged and the worker is left as it is.
   */
  onFail?: (reason: string) => void;
  /** Milliseconds from the first mount to the first `ready` before `onFail`; 10,000. */
  timeout?: number;
}

/** A worker running `serveBlueprint`, seen from the page. */
export interface BlueprintWorker {
  readonly worker: Worker;
  /** Stops the worker and every scene in it. */
  terminate(): void;
}

interface Host extends BlueprintWorker {
  next: number;
  reduced: boolean;
  post(message: ToWorker, transfer?: Transferable[]): void;
  players: Map<number, (message: FromWorker) => void>;
  /** Starts the wait for the first `ready` (the first mount calls it). */
  arm(): void;
}

/**
 * A WebAssembly module that uses one SIMD instruction (`i8x16.splat`, `i8x16.popcnt`): it
 * validates only where `simd128` does, which the engine's module needs.
 */
const SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15,
  253, 98, 11,
]);

/** Whether the engine's module can compile here: WebAssembly with SIMD (`simd128`). */
export function simdSupported(): boolean {
  try {
    return typeof WebAssembly === "object" && WebAssembly.validate(SIMD_PROBE);
  } catch {
    return false;
  }
}

/** Whether scenes can play in a worker here: OffscreenCanvas and module workers. */
export function workerSupported(): boolean {
  if (
    typeof Worker === "undefined" ||
    typeof OffscreenCanvas === "undefined" ||
    typeof HTMLCanvasElement === "undefined" ||
    !("transferControlToOffscreen" in HTMLCanvasElement.prototype)
  )
    return false;
  // A browser that knows module workers reads `type` while it converts the options, before it
  // parses the URL; this one fails to parse, so no worker starts.
  let modules = false;
  try {
    new Worker("http://[", {
      get type(): "module" {
        modules = true;
        return "module";
      },
    });
  } catch {
    // The URL: expected.
  }
  return modules;
}

/** The page's side of a worker that runs `serveBlueprint`. */
export function connectWorker(worker: Worker, options: ConnectOptions = {}): BlueprintWorker {
  const { onFail, timeout = 10_000 } = options;
  const media =
    typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting = false;
  let failed = false;
  const fail = (reason: string) => {
    if (failed || !onFail) return;
    failed = true;
    clearTimeout(timer);
    host.terminate();
    onFail(reason);
  };
  const host: Host = {
    worker,
    next: 1,
    reduced: media?.matches ?? false,
    post: (message, transfer = []) => worker.postMessage(message, transfer),
    players: new Map(),
    arm() {
      if (waiting || !onFail) return;
      waiting = true;
      timer = setTimeout(() => fail(`no scene ready after ${timeout} ms`), timeout);
    },
    terminate() {
      clearTimeout(timer);
      media?.removeEventListener("change", onMedia);
      worker.terminate();
      host.players.clear();
    },
  };
  const onMedia = () => {
    host.reduced = media?.matches ?? false;
    host.post({ type: "reduced", on: host.reduced });
  };
  media?.addEventListener("change", onMedia);
  worker.addEventListener("message", (e: MessageEvent<FromWorker>) => {
    const m = e.data;
    if (m.type === "error") {
      // Id -1: the engine or the resolver did not start, so no scene ever will.
      if (m.id === -1 && onFail) fail(`the engine did not start: ${m.message}`);
      else console.error(`Blueprint worker: ${m.message}`);
      return;
    }
    if (m.type === "ready" || m.type === "missing") clearTimeout(timer);
    host.players.get(m.id)?.(m);
  });
  if (onFail) {
    worker.addEventListener("error", (e) => {
      // Handled here: not reported again as the page's own uncaught error.
      e.preventDefault();
      fail(e.message || "the worker's script did not load");
    });
    worker.addEventListener("messageerror", () => fail("a message from the worker was unreadable"));
  }
  return host;
}

/** The canvas's CSS size and palette, read from the page. */
function sizeOf(canvas: HTMLCanvasElement, options: WorkerPlayOptions): WorkerSize {
  const style = canvas.ownerDocument.defaultView?.getComputedStyle(canvas);
  return {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    colors: resolvePalette(
      plan(options.filters).colors,
      (name) => style?.getPropertyValue(name) || undefined,
    ),
  };
}

/**
 * Plays scene `scene` (a name the worker's resolver knows) on `canvas`, in `worker`. The canvas
 * belongs to the worker from then on, even after `destroy`.
 */
export function playInWorker(
  canvas: HTMLCanvasElement,
  worker: BlueprintWorker,
  scene: string,
  options: WorkerPlayOptions = {},
): RemotePlayer {
  const host = worker as Host;
  const id = host.next++;
  const listeners = new Map<string, Set<Listener>>();
  const latest = new Map<string, [number, string]>();
  let data = false;

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    host.post({
      type: "pointer",
      id,
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    });
  };
  const onLeave = () => host.post({ type: "pointer", id, x: null, y: 0 });
  const pointer = (on: boolean) => {
    if (on === data) return;
    data = on;
    if (on) {
      canvas.addEventListener("pointermove", onPointer);
      canvas.addEventListener("pointerleave", onLeave);
    } else {
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
    }
  };

  host.players.set(id, (m) => {
    if (m.type === "ready") {
      latest.clear();
      pointer(m.data);
    } else if (m.type === "event") {
      const last = latest.get(m.name);
      if (last && Object.is(last[0], m.value) && last[1] === m.label) return;
      latest.set(m.name, [m.value, m.label]);
      for (const fn of listeners.get(m.name) ?? []) fn(m.value, m.label);
    }
  });

  host.arm();
  // The worker's presenter cannot style the element.
  canvas.style.imageRendering = "pixelated";
  const offscreen = canvas.transferControlToOffscreen();
  host.post(
    {
      type: "mount",
      id,
      canvas: offscreen,
      scene,
      options,
      reduced: host.reduced,
      ...sizeOf(canvas, options),
    },
    [offscreen],
  );
  const resize =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => host.post({ type: "size", id, ...sizeOf(canvas, options) }));
  resize?.observe(canvas);
  const seen =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) =>
          host.post({ type: "visible", id, on: entry?.isIntersecting ?? false }),
        );
  if (seen) seen.observe(canvas);
  else host.post({ type: "visible", id, on: true });

  return {
    set: (name, value) => host.post({ type: "set", id, name, value }),
    release: (name) => host.post({ type: "release", id, name }),
    emit: (event) => host.post({ type: "emit", id, event }),
    on(name, fn) {
      let set = listeners.get(name);
      if (!set) {
        listeners.set(name, (set = new Set()));
        host.post({ type: "listen", id, name });
      }
      set.add(fn);
      const last = latest.get(name);
      if (last) fn(last[0], last[1]);
      return () => set.delete(fn);
    },
    show: (next) => host.post({ type: "swap", id, scene: next }),
    destroy() {
      host.post({ type: "destroy", id });
      host.players.delete(id);
      resize?.disconnect();
      seen?.disconnect();
      pointer(false);
    },
  };
}
