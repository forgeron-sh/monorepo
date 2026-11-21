// The store: an engine plus named commands. `withCommands` wraps any `CanvasEngine` (the
// TypeScript one today, a WebAssembly one later) so editors write `store.undo()` rather than
// `engine.dispatch({ type: "undo" })`; every method is one dispatch or one query, nothing more.

import type { CanvasEngine, CommitMeta, EngineSettings, NewItem } from "./engine";
import type { Patch } from "./history";
import type { SelectMode } from "./selection";
import { createTsEngine, type TsEngineOptions } from "./ts-engine";
import type { Bounds, Connection, Item, ItemChange, Point, Size, Viewport } from "./types";

export interface FitViewOptions {
  /** Fits these items; all of them by default. */
  ids?: Iterable<string>;
  /** Screen pixels kept free around them. */
  padding?: number;
  /** Never zooms in past this. */
  maxZoom?: number;
}

export interface CanvasStore<D = unknown> extends CanvasEngine<D> {
  readonly engine: CanvasEngine<D>;
  readonly grid: EngineSettings["grid"];
  readonly zoomLimits: EngineSettings["zoom"];
  readonly readOnly: boolean;

  /* The document. Each call is one history entry, unless a gesture is open. */
  add(items: NewItem<D> | ReadonlyArray<NewItem<D>>, meta?: CommitMeta): Item<D>[];
  update(id: string, change: ItemChange<D>, meta?: CommitMeta): void;
  updateMany(changes: ReadonlyArray<readonly [string, ItemChange<D>]>, meta?: CommitMeta): void;
  remove(ids: Iterable<string>, meta?: CommitMeta): void;
  apply(patches: ReadonlyArray<Patch<D>>, meta?: CommitMeta): void;
  /** Replaces the whole document; clears the history and the selection. */
  replace(items: ReadonlyArray<Item<D>>, viewport?: Viewport): void;

  /* A gesture (a drag, a resize) groups every change until it ends into one entry. */
  beginGesture(label?: string): void;
  endGesture(): void;
  /** Puts back what the gesture changed and records nothing. */
  cancelGesture(): void;

  /* Selection. */
  select(ids: Iterable<string>, mode?: SelectMode): void;
  selectAll(): void;
  clearSelection(): void;
  selectedItems(): Item<D>[];

  /* Commands on items. */
  moveBy(ids: Iterable<string>, dx: number, dy: number, meta?: CommitMeta): void;
  /** Moves the selection; repeated nudges of one selection are one undo step. */
  nudge(dx: number, dy: number): void;
  resize(id: string, bounds: Bounds, meta?: CommitMeta): void;
  deleteSelection(): void;
  duplicateSelection(): Item<D>[];
  /** The selection as JSON (also kept for `paste`), or null when nothing is selected. */
  copy(): string | null;
  cut(): string | null;
  /** Pastes JSON from `copy` (the last copy by default), at a world point or one cell further. */
  paste(json?: string, at?: Point): Item<D>[];
  bringToFront(): void;
  sendToBack(): void;
  undo(): boolean;
  redo(): boolean;

  /* Camera. */
  setViewport(next: Viewport | ((current: Viewport) => Viewport)): void;
  setSize(size: Size): void;
  panBy(dx: number, dy: number): void;
  zoomTo(zoom: number, anchor?: Point): void;
  zoomIn(anchor?: Point): void;
  zoomOut(anchor?: Point): void;
  /** Back to 100 %, around the centre of the surface. */
  resetZoom(): void;
  /** The viewport that fits the items, without applying it. */
  fitViewport(options?: FitViewOptions): Viewport;
  fitView(options?: FitViewOptions): void;
  centerOnItem(id: string): void;

  /* Tool and connection. */
  setTool(tool: string): void;
  setConnection(connection: Connection | null): void;
}

const fitArgs = ({ ids, padding, maxZoom }: FitViewOptions = {}) => ({
  ...(ids ? { ids: [...ids] } : {}),
  ...(padding !== undefined ? { padding } : {}),
  ...(maxZoom !== undefined ? { maxZoom } : {}),
});

/** Named commands over any engine. */
export function withCommands<D>(engine: CanvasEngine<D>): CanvasStore<D> {
  const d = engine.dispatch.bind(engine);
  const store: CanvasStore<D> = {
    engine,
    settings: engine.settings,
    grid: engine.settings.grid,
    zoomLimits: engine.settings.zoom,
    readOnly: engine.settings.readOnly,
    getState: () => engine.getState(),
    subscribe: (l) => engine.subscribe(l),
    get: (id) => engine.get(id),
    dispatch: d,
    query: (q) => engine.query(q),
    serialize: (o) => engine.serialize(o),
    load: (json) => engine.load(json),

    add: (items, meta) =>
      d({
        type: "add",
        items: "kind" in items ? [items as NewItem<D>] : (items as ReadonlyArray<NewItem<D>>),
        ...meta,
      }).created,
    update: (id, change, meta) => void d({ type: "update", changes: [[id, change]], ...meta }),
    updateMany: (changes, meta) => void d({ type: "update", changes, ...meta }),
    remove: (ids, meta) => void d({ type: "remove", ids: [...ids], ...meta }),
    apply: (patches, meta) => void d({ type: "apply", patches, ...meta }),
    replace: (items, viewport) =>
      void d({ type: "replace", items, ...(viewport ? { viewport } : {}) }),

    beginGesture: (label) =>
      void d({ type: "gesture", phase: "begin", ...(label ? { label } : {}) }),
    endGesture: () => void d({ type: "gesture", phase: "end" }),
    cancelGesture: () => void d({ type: "gesture", phase: "cancel" }),

    select: (ids, mode) => void d({ type: "select", ids: [...ids], ...(mode ? { mode } : {}) }),
    selectAll: () => void d({ type: "select-all" }),
    clearSelection: () => void d({ type: "clear-selection" }),
    selectedItems: () => {
      const s = engine.getState();
      return s.items.filter((i) => s.selection.has(i.id));
    },

    moveBy: (ids, dx, dy, meta) => void d({ type: "move", ids: [...ids], dx, dy, ...meta }),
    nudge: (dx, dy) => void d({ type: "nudge", dx, dy }),
    resize: (id, bounds, meta) => void d({ type: "resize", id, bounds, ...meta }),
    deleteSelection: () => void d({ type: "delete-selection" }),
    duplicateSelection: () => d({ type: "duplicate-selection" }).created,
    copy: () => d({ type: "copy" }).json,
    cut: () => d({ type: "cut" }).json,
    paste: (json, at) =>
      d({ type: "paste", ...(json !== undefined ? { json } : {}), ...(at ? { at } : {}) }).created,
    bringToFront: () => void d({ type: "bring-to-front" }),
    sendToBack: () => void d({ type: "send-to-back" }),
    undo: () => d({ type: "undo" }).ok,
    redo: () => d({ type: "redo" }).ok,

    setViewport: (next) =>
      void d({
        type: "set-viewport",
        viewport: typeof next === "function" ? next(engine.getState().viewport) : next,
      }),
    setSize: (size) => void d({ type: "set-size", size }),
    panBy: (dx, dy) => void d({ type: "pan", dx, dy }),
    zoomTo: (zoom, anchor) => void d({ type: "zoom", zoom, ...(anchor ? { anchor } : {}) }),
    zoomIn: (anchor) => void d({ type: "zoom-step", direction: 1, ...(anchor ? { anchor } : {}) }),
    zoomOut: (anchor) =>
      void d({ type: "zoom-step", direction: -1, ...(anchor ? { anchor } : {}) }),
    resetZoom: () => void d({ type: "zoom", zoom: 1 }),
    fitViewport: (o) => engine.query({ type: "fit", ...fitArgs(o) }),
    fitView: (o) => void d({ type: "fit", ...fitArgs(o) }),
    centerOnItem: (id) => void d({ type: "center-on", id }),

    setTool: (tool) => void d({ type: "set-tool", tool }),
    setConnection: (connection) => void d({ type: "set-connection", connection }),
  };
  return store;
}

export type CanvasStoreOptions<D = unknown> = TsEngineOptions<D>;

/** A store on the TypeScript engine. */
export function createCanvasStore<D = unknown>(
  options: CanvasStoreOptions<D> = {},
): CanvasStore<D> {
  return withCommands(createTsEngine(options));
}
