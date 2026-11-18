// The TypeScript engine: the reference implementation of `CanvasEngine`. Items live in an id
// table over a spatial index (`item-index.ts`, a hashed grid): hit, box, lasso, culling and
// nearest ask the index instead of scanning, and patches are applied by id. The Rust crate of
// D-148 (`crates/fg-canvas-core`) has the same index, for when the core moves.

import { inflate, unionBounds } from "./geometry";
import { DEFAULT_GRID, snap, type GridOptions } from "./grid";
import {
  createHistory,
  pick,
  record,
  redo as redoStep,
  touchedIds,
  undo as undoStep,
  type History,
  type Patch,
} from "./history";
import { handleAt, readingOrder, resizeBounds } from "./hit";
import { ItemIndex } from "./item-index";
import { isMovable, kindOf, resizeRule, type KindMap } from "./kinds";
import { applySelection, EMPTY_SELECTION, pruneSelection, sameSelection } from "./selection";
import { deserialize, serialize } from "./serialize";
import { SELECT_TOOL } from "./tools";
import { HANDLES, type Item, type ItemChange, type Point, type Viewport } from "./types";
import {
  centerOn,
  clampZoom,
  DEFAULT_ZOOM,
  fitBounds,
  IDENTITY,
  panBy,
  roundViewport,
  stepZoom,
  visibleWorld,
  zoomAt,
  type ZoomLimits,
} from "./viewport";
import type {
  CanvasEngine,
  CanvasState,
  CommitMeta,
  EngineCommand,
  EngineQuery,
  EngineResult,
  NewItem,
  QueryResults,
} from "./engine";

export interface TsEngineOptions<D = unknown> {
  items?: ReadonlyArray<Item<D>>;
  viewport?: Viewport;
  /** Per kind: hit test, resize rule, movable, selectable, duplicate. */
  kinds?: KindMap<D>;
  grid?: Partial<GridOptions>;
  zoom?: Partial<ZoomLimits>;
  /** Entries kept for undo; 200 by default. */
  historyLimit?: number;
  /** Nothing in the document changes: a replay, a published version. */
  readOnly?: boolean;
  /** A new id, unused. By default `<kind>-<n>`, counting up: no randomness. */
  createId?: (kind: string, exists: (id: string) => boolean) => string;
}

export function createTsEngine<D = unknown>(options: TsEngineOptions<D> = {}): CanvasEngine<D> {
  const kinds: KindMap<D> = options.kinds ?? {};
  const grid: GridOptions = { ...DEFAULT_GRID, ...options.grid };
  const zoom: ZoomLimits = { ...DEFAULT_ZOOM, ...options.zoom };
  const readOnly = options.readOnly ?? false;
  const listeners = new Set<() => void>();
  let history: History<D> = createHistory(options.historyLimit ?? 200);
  const index = new ItemIndex<D>(kinds);
  let gesture: { label: string | undefined; before: Map<string, Item<D> | null> } | null = null;
  let clipboard: string | null = null;
  let pasteCount = 0;
  let counter = 0;

  let state: CanvasState<D> = {
    items: [],
    selection: EMPTY_SELECTION,
    viewport: options.viewport ?? IDENTITY,
    size: { w: 0, h: 0 },
    tool: SELECT_TOOL,
    connection: null,
    canUndo: false,
    canRedo: false,
    revision: 0,
  };

  const setState = (patch: Partial<CanvasState<D>>) => {
    state = { ...state, ...patch };
    for (const l of [...listeners]) l();
  };
  /** Publishes `items`, bottom first and already in the index. */
  const setItems = (items: Item<D>[], extra: Partial<CanvasState<D>> = {}) => {
    const selection = pruneSelection(extra.selection ?? state.selection, (id) => index.has(id));
    setState({
      ...extra,
      items,
      selection,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      revision: state.revision + 1,
    });
  };

  const createId =
    options.createId ??
    ((kind: string, exists: (id: string) => boolean) => {
      let id: string;
      do id = `${kind}-${++counter}`;
      while (exists(id));
      return id;
    });
  const newId = (kind: string, taken: Set<string>) =>
    createId(kind, (id) => index.has(id) || taken.has(id));

  const NONE: EngineResult<D> = { ok: false, created: [], json: null };
  const done = (created: Item<D>[] = [], json: string | null = null): EngineResult<D> => ({
    ok: true,
    created,
    json,
  });

  /** Every change of the document goes through here. */
  const commit = (
    patches: Patch<D>[],
    meta: CommitMeta = {},
    extra?: Partial<CanvasState<D>>,
  ): boolean => {
    if (readOnly || patches.length === 0) return false;
    if (gesture) {
      for (const id of touchedIds(patches)) {
        if (!gesture.before.has(id)) gesture.before.set(id, index.get(id) ?? null);
      }
    } else {
      history = record(history, {
        patches,
        ...(meta.label ? { label: meta.label } : {}),
        ...(meta.coalesce ? { coalesce: meta.coalesce } : {}),
      });
    }
    setItems(index.apply(state.items, patches), extra);
    return true;
  };

  const updatePatches = (changes: ReadonlyArray<readonly [string, ItemChange<D>]>) => {
    const out: Patch<D>[] = [];
    for (const [id, change] of changes) {
      const item = index.get(id);
      if (item) out.push({ op: "update", id, before: pick(item, change), after: change });
    }
    return out;
  };

  /** The union of the bounds of these items, or of every item. */
  const boundsOf = (ids?: ReadonlyArray<string>) =>
    unionBounds(
      ids
        ? ids.flatMap((id) => {
            const item = index.get(id);
            return item ? [item.bounds] : [];
          })
        : state.items.map((i) => i.bounds),
    );
  const topZ = () => state.items.at(-1)?.z ?? 0;
  const bottomZ = () => state.items[0]?.z ?? 0;
  const materialise = (list: ReadonlyArray<NewItem<D>>): Item<D>[] => {
    const taken = new Set<string>();
    let z = topZ();
    return list.map((n) => {
      const id = n.id && !index.has(n.id) && !taken.has(n.id) ? n.id : newId(n.kind, taken);
      taken.add(id);
      return { ...n, id, z: n.z ?? ++z } as Item<D>;
    });
  };
  const selected = () => index.inOrder(state.selection);
  const editable = () =>
    selected()
      .filter((i) => !i.locked)
      .map((i) => i.id);
  const middle = (): Point => ({ x: state.size.w / 2, y: state.size.h / 2 });

  const select = (next: ReadonlySet<string>): EngineResult<D> => {
    const pruned = pruneSelection(next, (id) => index.has(id));
    if (sameSelection(pruned, state.selection)) return NONE;
    setState({ selection: pruned });
    return done();
  };
  const setViewport = (v: Viewport): EngineResult<D> => {
    const next = { ...v, zoom: clampZoom(v.zoom, zoom) };
    const cur = state.viewport;
    if (next.x === cur.x && next.y === cur.y && next.zoom === cur.zoom) return NONE;
    setState({ viewport: next });
    return done();
  };
  const move = (ids: ReadonlyArray<string>, dx: number, dy: number, meta: CommitMeta) => {
    if (!dx && !dy) return NONE;
    const changes: [string, ItemChange<D>][] = [];
    for (const id of ids) {
      const item = index.get(id);
      if (!item || !isMovable(kinds, item)) continue;
      const b = item.bounds;
      changes.push([id, { bounds: { ...b, x: b.x + dx, y: b.y + dy } }]);
    }
    return commit(updatePatches(changes), { label: "Move", ...meta }) ? done() : NONE;
  };
  const fitViewport = (ids?: ReadonlyArray<string>, padding?: number, maxZoom?: number) => {
    const box = boundsOf(ids);
    if (!box || !state.size.w || !state.size.h) return state.viewport;
    return fitBounds(box, state.size, {
      limits: zoom,
      ...(padding !== undefined ? { padding } : {}),
      ...(maxZoom !== undefined ? { maxZoom } : {}),
    });
  };
  const step = (dir: "undo" | "redo"): EngineResult<D> => {
    if (readOnly || gesture) return NONE;
    const s = dir === "undo" ? undoStep(history) : redoStep(history);
    if (!s.patches) return NONE;
    history = s.history;
    setItems(index.apply(state.items, s.patches), {
      selection: new Set(touchedIds(s.patches)),
    });
    return done();
  };
  const endGesture = (): EngineResult<D> => {
    const g = gesture;
    gesture = null;
    if (!g || g.before.size === 0) return NONE;
    const patches: Patch<D>[] = [];
    for (const [id, before] of g.before) {
      const now = index.get(id);
      if (!before && now) patches.push({ op: "add", item: now });
      else if (before && !now) patches.push({ op: "remove", item: before });
      else if (before && now && before !== now) {
        const after: Record<string, unknown> = {};
        const was: Record<string, unknown> = {};
        for (const key of ["kind", "bounds", "z", "locked", "data"] as const) {
          if (before[key] !== now[key]) {
            after[key] = now[key];
            was[key] = before[key];
          }
        }
        if (Object.keys(after).length) {
          patches.push({
            op: "update",
            id,
            before: was as ItemChange<D>,
            after: after as ItemChange<D>,
          });
        }
      }
    }
    if (patches.length === 0) return NONE;
    history = record(history, g.label ? { patches, label: g.label } : { patches });
    setState({ canUndo: true, canRedo: false });
    return done();
  };
  const cancelGesture = (): EngineResult<D> => {
    const g = gesture;
    gesture = null;
    if (!g || g.before.size === 0) return NONE;
    let items = state.items.filter((i) => !g.before.has(i.id) || g.before.get(i.id));
    items = items.map((i) => g.before.get(i.id) ?? i);
    for (const [id, before] of g.before) if (before && !index.has(id)) items.push(before);
    setItems(index.reset(items));
    return done();
  };
  const addAll = (created: Item<D>[], label: string, selectThem: boolean) =>
    commit(
      created.map((item) => ({ op: "add", item })),
      { label },
      selectThem ? { selection: new Set(created.map((c) => c.id)) } : undefined,
    )
      ? done(created)
      : NONE;

  const engine: CanvasEngine<D> = {
    settings: { grid, zoom, readOnly },
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get: (id) => index.get(id),

    dispatch(c: EngineCommand<D>): EngineResult<D> {
      switch (c.type) {
        case "add": {
          const created = materialise(c.items);
          return commit(
            created.map((item) => ({ op: "add", item })),
            { label: "Add", ...c },
          )
            ? done(created)
            : NONE;
        }
        case "update":
          return commit(updatePatches(c.changes), c) ? done() : NONE;
        case "remove": {
          const patches: Patch<D>[] = [];
          for (const id of c.ids) {
            const item = index.get(id);
            if (item) patches.push({ op: "remove", item });
          }
          return commit(patches, { label: "Delete", ...c }) ? done() : NONE;
        }
        case "apply":
          return commit([...c.patches], c) ? done() : NONE;
        case "replace":
          history = createHistory(history.limit);
          gesture = null;
          setItems(index.reset(c.items), {
            selection: EMPTY_SELECTION,
            connection: null,
            ...(c.viewport ? { viewport: c.viewport } : {}),
          });
          return done();

        case "gesture":
          if (c.phase === "begin") {
            if (readOnly) return NONE;
            gesture = { label: c.label, before: new Map() };
            return done();
          }
          return c.phase === "end" ? endGesture() : cancelGesture();
        case "drag": {
          let { dx, dy } = c;
          if (c.snap && grid.snap) {
            dx = snap(c.anchor.x + dx, grid.size) - c.anchor.x;
            dy = snap(c.anchor.y + dy, grid.size) - c.anchor.y;
          }
          const changes = c.from
            .filter(([id]) => {
              const item = index.get(id);
              return item !== undefined && isMovable(kinds, item);
            })
            .map(([id, b]) => [id, { bounds: { ...b, x: b.x + dx, y: b.y + dy } }] as const);
          return commit(updatePatches(changes), { label: "Move" }) ? done() : NONE;
        }
        case "resize-handle": {
          const item = index.get(c.id);
          const rule = item && resizeRule(kinds, item);
          if (!item || !rule) return NONE;
          const bounds = resizeBounds(c.from, c.handle, c.dx, c.dy, {
            rule,
            keepAspect: c.keepAspect,
            grid: c.snap && grid.snap ? grid.size : 0,
          });
          return commit(updatePatches([[c.id, { bounds }]]), { label: "Resize" }) ? done() : NONE;
        }

        case "select":
          return select(applySelection(state.selection, c.ids, c.mode));
        case "select-all":
          return select(
            new Set(
              state.items
                .filter((i) => !i.locked && kindOf(kinds, i).selectable !== false)
                .map((i) => i.id),
            ),
          );
        case "clear-selection":
          return select(EMPTY_SELECTION);

        case "move":
          return move(c.ids, c.dx, c.dy, c);
        case "nudge": {
          const ids = [...state.selection].sort();
          return move(ids, c.dx, c.dy, { label: "Move", coalesce: `nudge:${ids.join(",")}` });
        }
        case "resize":
          return commit(updatePatches([[c.id, { bounds: c.bounds }]]), { label: "Resize", ...c })
            ? done()
            : NONE;
        case "delete-selection":
          return engine.dispatch({ type: "remove", ids: editable() });
        case "duplicate-selection": {
          const source = selected().filter((i) => !i.locked);
          if (source.length === 0 || readOnly) return NONE;
          const taken = new Set<string>();
          let z = topZ();
          const copies = source.map((item) => {
            const id = newId(item.kind, taken);
            taken.add(id);
            const own = kindOf(kinds, item).duplicate;
            const b = item.bounds;
            const copy = own
              ? own(item, id)
              : { ...item, id, bounds: { ...b, x: b.x + grid.size, y: b.y + grid.size } };
            const { locked: _locked, ...rest } = copy;
            return { ...rest, z: ++z } as Item<D>;
          });
          return addAll(copies, "Duplicate", true);
        }
        case "copy":
        case "cut": {
          const items = selected();
          if (items.length === 0) return NONE;
          clipboard = serialize(items);
          pasteCount = 0;
          if (c.type === "cut") engine.dispatch({ type: "remove", ids: editable(), label: "Cut" });
          return done([], clipboard);
        }
        case "paste": {
          const json = c.json ?? clipboard;
          if (!json || readOnly) return NONE;
          const doc = deserialize<D>(json);
          const box = unionBounds(doc.items.map((i) => i.bounds));
          if (!box) return NONE;
          pasteCount++;
          const dx = c.at ? c.at.x - box.x : grid.size * pasteCount;
          const dy = c.at ? c.at.y - box.y : grid.size * pasteCount;
          const created = materialise(
            doc.items.map(({ id: _id, z: _z, locked: _locked, ...rest }) => ({
              ...rest,
              bounds: { ...rest.bounds, x: rest.bounds.x + dx, y: rest.bounds.y + dy },
            })),
          );
          return addAll(created, "Paste", true);
        }
        case "bring-to-front": {
          let z = topZ();
          const changes = selected().map((i) => [i.id, { z: ++z }] as const);
          return commit(updatePatches(changes), { label: "Bring to front" }) ? done() : NONE;
        }
        case "send-to-back": {
          const items = selected();
          let z = bottomZ() - items.length;
          const changes = items.map((i) => [i.id, { z: z++ }] as const);
          return commit(updatePatches(changes), { label: "Send to back" }) ? done() : NONE;
        }
        case "undo":
        case "redo":
          return step(c.type);

        case "set-viewport":
          return setViewport(c.viewport);
        case "set-size":
          if (c.size.w === state.size.w && c.size.h === state.size.h) return NONE;
          setState({ size: c.size });
          return done();
        case "pan":
          return setViewport(panBy(state.viewport, c.dx, c.dy));
        case "zoom":
          return setViewport(zoomAt(state.viewport, c.zoom, c.anchor ?? middle(), zoom));
        case "zoom-step":
          return setViewport(
            zoomAt(
              state.viewport,
              stepZoom(state.viewport.zoom, c.direction, zoom),
              c.anchor ?? middle(),
              zoom,
            ),
          );
        case "fit":
          return setViewport(fitViewport(c.ids, c.padding, c.maxZoom));
        case "center-on": {
          const item = index.get(c.id);
          if (!item) return NONE;
          const b = item.bounds;
          return setViewport(
            centerOn(state.viewport, { x: b.x + b.w / 2, y: b.y + b.h / 2 }, state.size),
          );
        }

        case "set-tool":
          if (c.tool === state.tool) return NONE;
          setState({ tool: c.tool });
          return done();
        case "set-connection":
          if (c.connection === state.connection) return NONE;
          setState({ connection: c.connection });
          return done();
      }
    },

    query<Q extends EngineQuery>(q: Q): QueryResults<D>[Q["type"]] {
      const answer = (): QueryResults<D>[EngineQuery["type"]] => {
        switch (q.type) {
          case "hit":
            return index.hit(q.point);
          case "in-rect":
            return index.inRect(q.rect, q.mode);
          case "in-lasso":
            return index.inLasso(q.polygon);
          case "visible": {
            const v = q.viewport ?? state.viewport;
            const size = q.size ?? state.size;
            const area = inflate(visibleWorld(v, size), (q.margin ?? 0) / v.zoom);
            return index.touching(area);
          }
          case "bounds":
            return boundsOf(q.ids);
          case "fit":
            return fitViewport(q.ids, q.padding, q.maxZoom);
          case "handle-at": {
            const one = state.selection.size === 1 ? index.get([...state.selection][0]!) : null;
            const rule = one && !readOnly ? resizeRule(kinds, one) : null;
            if (!one || !rule) return null;
            const h = handleAt(one.bounds, q.point, q.tolerance, rule.handles ?? HANDLES);
            return h ? { itemId: one.id, handle: h } : null;
          }
          case "handles": {
            const item = index.get(q.id);
            const rule = item && !readOnly ? resizeRule(kinds, item) : null;
            return rule ? [...(rule.handles ?? HANDLES)] : [];
          }
          case "movable":
            return readOnly
              ? []
              : q.ids.filter((id) => {
                  const item = index.get(id);
                  return item !== undefined && isMovable(kinds, item);
                });
          case "nearest": {
            const from = index.get(q.from);
            return from ? (index.nearest(from, q.direction)?.id ?? null) : null;
          }
          case "reading-order":
            return readingOrder(state.items).map((i) => i.id);
        }
      };
      return answer() as QueryResults<D>[Q["type"]];
    },

    serialize({ viewport = false } = {}) {
      return serialize(state.items, viewport ? state.viewport : undefined);
    },
    load(json) {
      const doc = deserialize<D>(json);
      engine.dispatch({
        type: "replace",
        items: doc.items,
        ...(doc.viewport ? { viewport: roundViewport(doc.viewport) } : {}),
      });
    },
  };

  if (options.items?.length) state = { ...state, items: index.reset(options.items) };
  return engine;
}
