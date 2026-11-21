/**
 * The messages between a page and the worker that plays its scenes (`playInWorker` on the page,
 * `serveBlueprint` in the worker; docs/blueprint/engine.md, "Worker and lazy-load notes"). The
 * page sends inputs only; the worker sends back what the page reads.
 */
import type { Filter } from "../core/filters";
import type { ResolvedPalette } from "../core/palette";

/** `PlayOptions` that cross a `postMessage`: no callback, no presenter choice, no overlay. */
export interface WorkerPlayOptions {
  filters?: readonly Filter[];
  /** A fixed highlighted index (`set("active", n)`); wins over `cycle`. */
  active?: number;
  /** Highlights each index in turn (script scenes). */
  cycle?: { every: number; count: number };
  labels?: boolean;
  fill?: number;
  unit?: "even" | "any";
  /** Overrides `prefers-reduced-motion`. */
  reducedMotion?: boolean;
}

/** The canvas's CSS size and the palette read from its tokens. */
export interface WorkerSize {
  width: number;
  height: number;
  colors: ResolvedPalette;
}

export type ToWorker =
  | ({
      type: "mount";
      id: number;
      canvas: OffscreenCanvas;
      /** The scene's name, which the worker's resolver turns into a source. */
      scene: string;
      options: WorkerPlayOptions;
      reduced: boolean;
    } & WorkerSize)
  | { type: "swap"; id: number; scene: string }
  | ({ type: "size"; id: number } & WorkerSize)
  | { type: "visible"; id: number; on: boolean }
  | { type: "reduced"; on: boolean }
  | { type: "pointer"; id: number; x: number | null; y: number }
  | { type: "set"; id: number; name: string; value: number }
  | { type: "release"; id: number; name: string }
  | { type: "emit"; id: number; event: string }
  | { type: "listen"; id: number; name: string }
  | { type: "destroy"; id: number };

export type FromWorker =
  /** The scene is playing (after `mount` or `swap`); `data` when it takes the pointer. */
  | { type: "ready"; id: number; data: boolean }
  /** The resolver knows no scene of that name: the canvas keeps what it had. */
  | { type: "missing"; id: number; scene: string }
  | { type: "event"; id: number; name: string; value: number; label: string }
  | { type: "error"; id: number; message: string };
