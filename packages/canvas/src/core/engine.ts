// The engine interface: the one door between a canvas and whatever holds its document. Commands
// and queries are plain data, so the same calls can cross into a WebAssembly engine (the planned
// Rust core, D-148) as they reach the TypeScript one today. React, the DOM and the renderers only
// talk to this interface; nothing outside `core/` reads the internals of an engine.

import type { BoxMode, Direction } from "./hit";
import type { GridOptions } from "./grid";
import type { Patch } from "./history";
import type { SelectMode, Selection } from "./selection";
import type { Bounds, Connection, Handle, Item, ItemChange, Point, Size, Viewport } from "./types";
import type { ZoomLimits } from "./viewport";

export interface CanvasState<D = unknown> {
  /** Every item, bottom of the stack first. */
  items: ReadonlyArray<Item<D>>;
  selection: Selection;
  viewport: Viewport;
  /** The surface in screen pixels, as the view last measured it. */
  size: Size;
  /** The tool on: `select`, `pan`, `lasso` or a consumer tool's id. */
  tool: string;
  /** The connect gesture while it runs. */
  connection: Connection | null;
  canUndo: boolean;
  canRedo: boolean;
  /** Raised at each change of the document (not of the camera or the selection): save on it. */
  revision: number;
}

/** An item to add: its id and z may be left to the engine. */
export type NewItem<D = unknown> = Omit<Item<D>, "id" | "z"> & { id?: string; z?: number };

/** What every engine is configured with, readable by the view. */
export interface EngineSettings {
  grid: GridOptions;
  zoom: ZoomLimits;
  readOnly: boolean;
}

/** Names a history entry and merges a run of entries with the same key. */
export interface CommitMeta {
  label?: string;
  coalesce?: string;
}

/** Every change an engine accepts. One command that changes the document is one undo step,
 *  unless a gesture is open: then the gesture's end records them all as one. */
export type EngineCommand<D = unknown> =
  /* Document */
  | ({ type: "add"; items: ReadonlyArray<NewItem<D>> } & CommitMeta)
  | ({ type: "update"; changes: ReadonlyArray<readonly [string, ItemChange<D>]> } & CommitMeta)
  | ({ type: "remove"; ids: ReadonlyArray<string> } & CommitMeta)
  | ({ type: "apply"; patches: ReadonlyArray<Patch<D>> } & CommitMeta)
  | { type: "replace"; items: ReadonlyArray<Item<D>>; viewport?: Viewport }
  /* Gestures: a drag or a resize as one undo step */
  | { type: "gesture"; phase: "begin" | "end" | "cancel"; label?: string }
  | {
      type: "drag";
      /** The bounds of each moving item when the drag began. */
      from: ReadonlyArray<readonly [string, Bounds]>;
      /** The item under the pointer: it lands on the grid, the others keep their offsets. */
      anchor: Bounds;
      dx: number;
      dy: number;
      snap: boolean;
    }
  | {
      type: "resize-handle";
      id: string;
      handle: Handle;
      from: Bounds;
      dx: number;
      dy: number;
      keepAspect: boolean;
      snap: boolean;
    }
  /* Selection */
  | { type: "select"; ids: ReadonlyArray<string>; mode?: SelectMode }
  | { type: "select-all" }
  | { type: "clear-selection" }
  /* Edits */
  | ({ type: "move"; ids: ReadonlyArray<string>; dx: number; dy: number } & CommitMeta)
  | { type: "nudge"; dx: number; dy: number }
  | ({ type: "resize"; id: string; bounds: Bounds } & CommitMeta)
  | { type: "delete-selection" }
  | { type: "duplicate-selection" }
  | { type: "copy" }
  | { type: "cut" }
  | { type: "paste"; json?: string; at?: Point }
  | { type: "bring-to-front" }
  | { type: "send-to-back" }
  | { type: "undo" }
  | { type: "redo" }
  /* Camera */
  | { type: "set-viewport"; viewport: Viewport }
  | { type: "set-size"; size: Size }
  | { type: "pan"; dx: number; dy: number }
  | { type: "zoom"; zoom: number; anchor?: Point }
  | { type: "zoom-step"; direction: 1 | -1; anchor?: Point }
  | { type: "fit"; ids?: ReadonlyArray<string>; padding?: number; maxZoom?: number }
  | { type: "center-on"; id: string }
  /* Tool and connection */
  | { type: "set-tool"; tool: string }
  | { type: "set-connection"; connection: Connection | null };

export interface EngineResult<D = unknown> {
  /** Whether anything changed. */
  ok: boolean;
  /** Items the command created (add, duplicate, paste). */
  created: Item<D>[];
  /** JSON the command produced (copy, cut). */
  json: string | null;
}

/** Every question an engine answers. With a spatial index, each is sub-linear in the items. */
export type EngineQuery =
  | { type: "hit"; point: Point }
  | { type: "in-rect"; rect: Bounds; mode?: BoxMode }
  | { type: "in-lasso"; polygon: ReadonlyArray<Point> }
  /** The items a viewport shows (culling), plus a margin in screen pixels. */
  | { type: "visible"; viewport?: Viewport; size?: Size; margin?: number }
  | { type: "bounds"; ids?: ReadonlyArray<string> }
  | { type: "fit"; ids?: ReadonlyArray<string>; padding?: number; maxZoom?: number }
  /** The resize handle of the single selected item near a world point. */
  | { type: "handle-at"; point: Point; tolerance: number }
  /** The handles an item shows: none when it cannot be resized. */
  | { type: "handles"; id: string }
  | { type: "movable"; ids: ReadonlyArray<string> }
  | { type: "nearest"; from: string; direction: Direction }
  | { type: "reading-order" };

export interface QueryResults<D = unknown> {
  hit: Item<D> | null;
  "in-rect": string[];
  "in-lasso": string[];
  visible: string[];
  bounds: Bounds | null;
  fit: Viewport;
  "handle-at": { itemId: string; handle: Handle } | null;
  handles: Handle[];
  movable: string[];
  nearest: string | null;
  "reading-order": string[];
}

export interface CanvasEngine<D = unknown> {
  readonly settings: EngineSettings;
  getState(): CanvasState<D>;
  subscribe(listener: () => void): () => void;
  get(id: string): Item<D> | undefined;
  dispatch(command: EngineCommand<D>): EngineResult<D>;
  query<Q extends EngineQuery>(query: Q): QueryResults<D>[Q["type"]];
  serialize(options?: { viewport?: boolean }): string;
  /** Replaces the document from JSON written by `serialize`; clears the history. */
  load(json: string): void;
}
