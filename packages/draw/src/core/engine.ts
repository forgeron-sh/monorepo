// The draw engine: a `CanvasEngine` around any other (the TypeScript one by default) that keeps the
// whiteboard's rules after every change, in the same undo step as the change:
//   - a frame that moves takes its items along; membership is settled when a change ends;
//   - bound arrows follow their items, and let go of an item when dragged away from it;
//   - selecting an item of a group selects the group;
//   - a copy (duplicate, paste) of arrows and groups points at the copies, not the originals.
// It only speaks the engine interface, so a WebAssembly engine can sit underneath unchanged.

import {
  createTsEngine,
  deserialize,
  unionBounds,
  withCommands,
  type CanvasEngine,
  type CanvasStore,
  type EngineCommand,
  type EngineResult,
  type ItemChange,
  type TsEngineOptions,
} from "@forgeron/canvas";
import { expandGroups } from "./arrange";
import { arrowFollow, changedIds, frameFollow } from "./follow";
import { membershipChanges } from "./frames";
import { drawKinds } from "./kinds";
import type { ArrowEnd, DrawData, DrawItem } from "./types";

type Changes = Array<readonly [string, ItemChange<DrawData>]>;
type Command = EngineCommand<DrawData>;

/** Commands that change the document and take a `CommitMeta` (a label, a coalesce key). */
const WITH_META = new Set<Command["type"]>(["add", "update", "remove", "apply", "move", "resize"]);
/** Commands that change the document without one: run inside a gesture to share one step. */
const WITHOUT_META = new Set<Command["type"]>([
  "drag",
  "resize-handle",
  "delete-selection",
  "duplicate-selection",
  "cut",
  "paste",
  "bring-to-front",
  "send-to-back",
]);

const LABELS: Partial<Record<Command["type"], string>> = {
  "delete-selection": "Delete",
  "duplicate-selection": "Duplicate",
  cut: "Cut",
  paste: "Paste",
  "bring-to-front": "Bring to front",
  "send-to-back": "Send to back",
};

/**
 * The changes that make copies point at copies: arrows bound to an item that was copied too are
 * bound to its copy, others let go; each copied group becomes a new group.
 */
export function remapCopies(
  sources: ReadonlyArray<DrawItem>,
  copies: ReadonlyArray<DrawItem>,
  groupId: (old: string) => string,
): Changes {
  const ids = new Map<string, string>();
  sources.forEach((s, i) => {
    const c = copies[i];
    if (c) ids.set(s.id, c.id);
  });
  const groups = new Map<string, string>();
  const out: Changes = [];
  copies.forEach((copy) => {
    let data = copy.data;
    if (data.group) {
      let g = groups.get(data.group);
      if (!g) {
        g = groupId(data.group);
        groups.set(data.group, g);
      }
      data = { ...data, group: g };
    }
    if (data.type !== "frame" && data.frame && ids.has(data.frame)) {
      data = { ...data, frame: ids.get(data.frame)! };
    }
    if (data.type === "arrow") {
      const end = (e: ArrowEnd) => {
        if (!e.bind) return e;
        const to = ids.get(e.bind);
        const { bind: _b, ...rest } = e;
        return to ? { ...rest, bind: to } : rest;
      };
      data = { ...data, start: end(data.start), end: end(data.end) };
    }
    if (data !== copy.data) out.push([copy.id, { data }]);
  });
  return out;
}

export interface DrawEngineOptions extends TsEngineOptions<DrawData> {
  /** The engine underneath; a TypeScript engine with the draw kinds by default. */
  base?: CanvasEngine<DrawData>;
}

export function createDrawEngine(options: DrawEngineOptions = {}): CanvasEngine<DrawData> {
  const { base, ...rest } = options;
  const inner =
    base ?? createTsEngine<DrawData>({ ...rest, kinds: { ...drawKinds, ...rest.kinds } });
  let gesture = false;
  /** Items changed while a gesture is open: their frames are settled when it ends. */
  let touched = new Set<string>();
  let clipboard: string | null = null;
  let seq = 0;
  let groupSeq = 0;

  const items = () => inner.getState().items as ReadonlyArray<DrawItem>;
  const snapshot = () => new Map(items().map((i) => [i.id, i]));
  const freshGroup = () => {
    const used = new Set(items().map((i) => i.data.group));
    let id: string;
    do id = `group-c${++groupSeq}`;
    while (used.has(id));
    return id;
  };

  /** The items whose frame may have changed: all of them when a frame itself changed. */
  const settleSet = (before: Map<string, DrawItem>, ids: ReadonlySet<string>) =>
    [...ids].some((id) => (before.get(id) ?? inner.get(id))?.data.type === "frame")
      ? undefined
      : ids;

  /** Applies `changes` in the current step: inside the gesture, or merged by `coalesce`. */
  const write = (changes: Changes, coalesce?: string) => {
    if (changes.length === 0) return;
    inner.dispatch({ type: "update", changes, ...(coalesce ? { coalesce } : {}) });
  };

  /** Frames, membership and arrows after a change, in the same step. */
  const follow = (before: Map<string, DrawItem>, coalesce: string | undefined, settle: boolean) => {
    const changed = changedIds(before, items());
    if (changed.size === 0) return;
    const framed = frameFollow(before, items(), changed);
    write(framed, coalesce);
    for (const [id] of framed) changed.add(id);
    if (settle) {
      const members = membershipChanges(items(), settleSet(before, changed));
      write(members, coalesce);
      for (const [id] of members) changed.add(id);
    } else for (const id of changed) touched.add(id);
    write(arrowFollow(before, items(), changed), coalesce);
  };

  /** The copies a duplicate or a paste made, pointed at each other. */
  const remap = (sources: ReadonlyArray<DrawItem>, result: EngineResult<DrawData>) => {
    write(remapCopies(sources, result.created as DrawItem[], freshGroup));
  };

  const run = (c: Command): EngineResult<DrawData> => {
    if (c.type === "copy" || c.type === "cut") {
      const r = inner.dispatch(c);
      if (r.json) clipboard = r.json;
      return r;
    }
    if (c.type === "paste") {
      const json = c.json ?? clipboard;
      const r = inner.dispatch(c);
      if (r.ok && json) remap(deserialize<DrawData>(json).items as DrawItem[], r);
      return r;
    }
    if (c.type === "duplicate-selection") {
      const s = inner.getState();
      const sources = items().filter((i) => s.selection.has(i.id) && !i.locked);
      const r = inner.dispatch(c);
      if (r.ok) remap(sources, r);
      return r;
    }
    return inner.dispatch(c);
  };

  const dispatch = (c: Command): EngineResult<DrawData> => {
    if (c.type === "select") {
      return inner.dispatch({ ...c, ids: expandGroups(items(), c.ids) });
    }
    if (c.type === "gesture") {
      if (c.phase === "begin") {
        const r = inner.dispatch(c);
        if (r.ok) {
          gesture = true;
          touched = new Set();
        }
        return r;
      }
      if (c.phase === "end" && gesture && touched.size) {
        // Settle the frames of what the gesture moved, then the arrows of what that changed.
        const before = snapshot();
        write(membershipChanges(items(), settleSet(before, touched)));
        write(arrowFollow(before, items(), changedIds(before, items())));
      }
      gesture = false;
      touched = new Set();
      return inner.dispatch(c);
    }
    if (c.type === "nudge" && !gesture) {
      // The TypeScript engine merges repeated nudges of one selection under this key: what
      // follows them joins the same step. Another engine may not merge; nothing breaks.
      const coalesce = `nudge:${[...inner.getState().selection].sort().join(",")}`;
      const before = snapshot();
      const r = inner.dispatch(c);
      if (r.ok) follow(before, coalesce, true);
      return r;
    }
    if (WITH_META.has(c.type) && !gesture) {
      const meta = c as { coalesce?: string };
      const coalesce = meta.coalesce ?? `draw:${++seq}`;
      const before = snapshot();
      const r = run({ ...c, coalesce } as Command);
      if (r.ok) follow(before, coalesce, true);
      return r;
    }
    if (WITH_META.has(c.type) || WITHOUT_META.has(c.type) || c.type === "nudge") {
      const own = !gesture;
      if (own) {
        const label = LABELS[c.type];
        if (!inner.dispatch({ type: "gesture", phase: "begin", ...(label ? { label } : {}) }).ok) {
          return run(c);
        }
        gesture = true;
        touched = new Set();
      }
      const before = snapshot();
      const r = run(c);
      if (r.ok) follow(before, undefined, false);
      if (own) dispatch({ type: "gesture", phase: "end" });
      return r;
    }
    return run(c);
  };

  return {
    get settings() {
      return inner.settings;
    },
    getState: () => inner.getState(),
    subscribe: (l) => inner.subscribe(l),
    get: (id) => inner.get(id),
    dispatch,
    query: (q) => inner.query(q),
    serialize: (o) => inner.serialize(o),
    load: (json) => {
      gesture = false;
      touched = new Set();
      inner.load(json);
    },
  };
}

export type DrawStore = CanvasStore<DrawData>;

/** A store on the draw engine: `store.add(…)`, `store.undo()`… with the whiteboard's rules. */
export function createDrawStore(options: DrawEngineOptions = {}): DrawStore {
  return withCommands(createDrawEngine(options));
}

/** The union of the bounds of some items, or null. */
export const boundsOfItems = (list: ReadonlyArray<DrawItem>) =>
  unionBounds(list.map((i) => i.bounds));
