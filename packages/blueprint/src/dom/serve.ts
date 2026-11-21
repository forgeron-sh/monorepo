/**
 * `serveBlueprint`: the worker side of `playInWorker` (docs/blueprint/engine.md, "Worker and
 * lazy-load notes"). Called once in a module worker: it starts the engine there (one instance for
 * every canvas of the page), takes the canvases the page hands over, and plays each with the same
 * loop as `play` (`loop.ts`) on the 2D presenter. Scene functions cannot cross a `postMessage`,
 * so the page names a scene and `resolve` (the worker entry's own) turns the name into a source.
 *
 * What the page reads comes back as messages: the listened outputs (`"state"`, `"active"`, a var,
 * `"hover"`), with the current value at once when a frame was already drawn.
 */
import type { SceneSource } from "../core/types";
import { type EngineSource, initBlueprint } from "../engine/runtime";
import type { BlueprintScene, ScriptScene } from "../engine/scene";
import { type Frames, type Loop, loop } from "./loop";
import { type CompiledSource, compiledScene } from "./play-compiled";
import { present2d, type Presenter } from "./present-2d";
import type { FromWorker, ToWorker, WorkerPlayOptions, WorkerSize } from "./worker-protocol";

/** The source of a scene by name; `vars` are the values the page set (a script layer reads them). */
export type SceneResolver = (
  name: string,
  vars: ReadonlyMap<string, number>,
) => SceneSource | CompiledSource | undefined;

/** The worker's global scope, as much of it as this uses. */
export interface WorkerScope {
  postMessage(message: FromWorker): void;
  addEventListener(type: "message", fn: (e: MessageEvent<ToWorker>) => void): void;
  requestAnimationFrame?: (fn: () => void) => number;
  cancelAnimationFrame?: (id: number) => void;
}

interface Playing {
  scene: BlueprintScene | ScriptScene;
  presenter: Presenter;
  loop: Loop;
  /** A data scene: it has a scope of its own, and takes the pointer. */
  data: boolean;
  offs: (() => void)[];
}

interface Mount {
  id: number;
  canvas: OffscreenCanvas;
  options: WorkerPlayOptions;
  /** Every value the page set, kept across a swap (the script layer reads them). */
  vars: Map<string, number>;
  /** The outputs the page listens to. */
  keys: Set<string>;
  size: WorkerSize;
  visible: boolean;
  playing: Playing | null;
}

export interface ServeOptions {
  /** Where the engine's module comes from (`initBlueprint`); its default URL otherwise. */
  engine?: EngineSource;
  /** The worker's global scope (a test passes its own). */
  scope?: WorkerScope;
}

export function serveBlueprint(
  resolver: SceneResolver | Promise<SceneResolver>,
  options: ServeOptions = {},
): void {
  const scope = options.scope ?? (globalThis as unknown as WorkerScope);
  const raf = scope.requestAnimationFrame?.bind(scope);
  const caf = scope.cancelAnimationFrame?.bind(scope);
  const frames: Frames =
    raf && caf
      ? { request: raf, cancel: caf }
      : {
          request: (fn) => setTimeout(fn, 16) as unknown as number,
          cancel: (id) => clearTimeout(id),
        };
  const post = (m: FromWorker) => scope.postMessage(m);
  const mounts = new Map<number, Mount>();
  let reduced = false;
  let resolve: SceneResolver | null = null;
  const queue: ToWorker[] = [];

  const has = (p: Playing, name: string) => !p.data || p.scene.scope.includes(name);

  const subscribe = (m: Mount, p: Playing, key: string) => {
    p.offs.push(
      p.scene.on(key, (value, label) => post({ type: "event", id: m.id, name: key, value, label })),
    );
  };

  /** The output's value now, for a page that starts listening after the first frame. */
  const replay = (m: Mount, p: Playing, key: string) => {
    if (p.scene.frameCalls === 0) return;
    const send = (value: number, label: string) =>
      post({ type: "event", id: m.id, name: key, value, label });
    if (p.data) {
      const scene = p.scene as BlueprintScene;
      if (key === "state")
        scene.encoded.machines.forEach((machine, i) => {
          const name = scene.state(i);
          if (name !== undefined) send(machine.states.indexOf(name), name);
        });
      else if (scene.scope.includes(key)) send(scene.get(key), key);
    } else if (key === "active") send(p.scene.get("active"), "active");
  };

  const stop = (m: Mount) => {
    const p = m.playing;
    if (!p) return;
    p.loop.stop();
    for (const off of p.offs) off();
    p.presenter.dispose();
    p.scene.dispose();
    m.playing = null;
  };

  /** Plays scene `name` on the mount; false when the resolver does not know it. */
  const start = (m: Mount, name: string): boolean => {
    const source = resolve!(name, m.vars);
    if (!source) {
      post({ type: "missing", id: m.id, scene: name });
      return false;
    }
    stop(m);
    const { scene, text } = compiledScene(source, m.options);
    if (m.options.active !== undefined) scene.set("active", m.options.active);
    const presenter = present2d(m.canvas);
    const data = text !== null;
    const p: Playing = {
      scene,
      presenter,
      data,
      offs: [],
      loop: loop(
        scene,
        presenter,
        {
          filters: m.options.filters,
          data,
          reduced: () => m.options.reducedMotion ?? reduced,
        },
        frames,
      ),
    };
    m.playing = p;
    post({ type: "ready", id: m.id, data });
    for (const key of m.keys) subscribe(m, p, key);
    p.loop.measure(m.size.width, m.size.height, m.size.colors);
    for (const [v, value] of m.vars) if (has(p, v)) p.loop.set(v, value);
    if (m.visible) p.loop.visible(true);
    return true;
  };

  const handle = (msg: ToWorker) => {
    if (msg.type === "reduced") {
      reduced = msg.on;
      for (const m of mounts.values()) m.playing?.loop.wake();
      return;
    }
    if (msg.type === "mount") {
      reduced = msg.reduced;
      const m: Mount = {
        id: msg.id,
        canvas: msg.canvas,
        options: msg.options,
        vars: new Map(),
        keys: new Set(),
        size: { width: msg.width, height: msg.height, colors: msg.colors },
        visible: false,
        playing: null,
      };
      mounts.set(msg.id, m);
      start(m, msg.scene);
      return;
    }
    const m = mounts.get(msg.id);
    if (!m) return;
    const p = m.playing;
    switch (msg.type) {
      case "swap":
        start(m, msg.scene);
        break;
      case "size":
        m.size = { width: msg.width, height: msg.height, colors: msg.colors };
        p?.loop.measure(msg.width, msg.height, msg.colors);
        p?.loop.draw();
        break;
      case "visible":
        m.visible = msg.on;
        p?.loop.visible(msg.on);
        break;
      case "pointer":
        p?.loop.pointer(msg.x, msg.y);
        break;
      case "set":
        m.vars.set(msg.name, msg.value);
        if (p && has(p, msg.name)) p.loop.set(msg.name, msg.value);
        break;
      case "release":
        m.vars.delete(msg.name);
        if (p && has(p, msg.name)) p.loop.release(msg.name);
        break;
      case "emit":
        p?.loop.emit(msg.event);
        break;
      case "listen":
        if (m.keys.has(msg.name)) break;
        m.keys.add(msg.name);
        if (p) {
          subscribe(m, p, msg.name);
          replay(m, p, msg.name);
        }
        break;
      case "destroy":
        stop(m);
        mounts.delete(m.id);
        break;
    }
  };

  const safely = (msg: ToWorker) => {
    try {
      handle(msg);
    } catch (error) {
      post({ type: "error", id: "id" in msg ? msg.id : -1, message: String(error) });
    }
  };

  scope.addEventListener("message", (e) => {
    if (resolve) safely(e.data);
    else queue.push(e.data);
  });
  Promise.all([initBlueprint(options.engine), resolver]).then(
    ([, r]) => {
      resolve = r;
      for (const msg of queue.splice(0)) safely(msg);
    },
    (error: unknown) => post({ type: "error", id: -1, message: String(error) }),
  );
}
