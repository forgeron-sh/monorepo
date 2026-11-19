/**
 * The in-page fallback of `canvas.ts`, for a browser without OffscreenCanvas or module workers:
 * the same scenes, played on the main thread with `playCompiled`, behind the same handle as a
 * scene played in the worker (`RemotePlayer`). Loaded only there.
 */
import { initBlueprint } from "@forgeron/blueprint";
import {
  playCompiled,
  type Player,
  type RemotePlayer,
  type WorkerPlayOptions,
} from "@forgeron/blueprint/dom";
import { sourceOf } from "./sources";

type Listener = (value: number, label: string) => void;

await initBlueprint();

/** Scene `name` on `el`, in the page; an unknown name leaves the canvas blank. */
export function playInline(
  el: HTMLCanvasElement,
  name: string,
  options: WorkerPlayOptions,
): RemotePlayer {
  const vars = new Map<string, number>();
  const listeners = new Map<string, Set<Listener>>();
  const latest = new Map<string, [number, string]>();
  let player: Player | null = null;
  let data = false;
  let offs: (() => void)[] = [];
  /** Whether the scene has var `v` (a script scene takes any), as the worker decides. */
  const has = (v: string) => !data || (player?.scene.scope ?? []).includes(v);
  const relay = (key: string) =>
    player!.on(key, (value, label) => {
      latest.set(key, [value, label]);
      for (const fn of listeners.get(key) ?? []) fn(value, label);
    });
  const start = (next: string) => {
    const source = sourceOf(next, vars);
    if (!source) return;
    for (const off of offs) off();
    player?.destroy();
    latest.clear();
    data = typeof source === "object" && "compiled" in source;
    player = playCompiled(el, source, { ...options, overlay: false });
    offs = [...listeners.keys()].map(relay);
    for (const [v, value] of vars) if (has(v)) player.set(v, value);
  };
  start(name);
  return {
    set(v, value) {
      vars.set(v, value);
      if (player && has(v)) player.set(v, value);
    },
    release(v) {
      vars.delete(v);
      if (player && has(v)) player.release(v);
    },
    emit: (event) => player?.emit(event),
    on(key, fn) {
      let set = listeners.get(key);
      if (!set) {
        listeners.set(key, (set = new Set()));
        if (player) offs.push(relay(key));
      }
      set.add(fn);
      const last = latest.get(key);
      if (last) fn(last[0], last[1]);
      return () => set.delete(fn);
    },
    show: start,
    destroy() {
      for (const off of offs) off();
      player?.destroy();
      player = null;
    },
  };
}
