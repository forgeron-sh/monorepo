// The draw engine: a `CanvasEngine` around any other (the TypeScript one by default) that runs the
// rules of the plugins after every change, in the same undo step as the change. The engine itself
// is neutral: it tracks the gesture, remembers what a gesture touched, keeps the clipboard and
// calls the rules; what a rule does is the plugin's (`engineRules`):
//   - `carry`:  a frame that moves takes its items along;
//   - `remove`: what a deletion leaves behind;
//   - `settle`: where an item belongs (frame membership), when a change ends;
//   - `follow`: bound arrows go back onto their items, and let go of an item dragged away from;
//   - `select`: selecting an item of a group selects the group;
//   - `copy`:   a copy (duplicate, paste) of arrows and groups points at the copies.
// With no plugin at all it is the canvas engine and nothing more. It only speaks the engine
// interface, so a WebAssembly engine can sit underneath unchanged.

import {
  createTsEngine,
  deserialize,
  unionBounds,
  withCommands,
  type CanvasEngine,
  type CanvasStore,
  type EngineCommand,
  type EngineResult,
  type TsEngineOptions,
} from "@forgeron/canvas";
import { registryOf } from "./defaults";
import { BeforeView, changedIds } from "./follow";
import type { Changes, Plugins, Registry } from "./plugin";
import type { DrawData, DrawItem } from "./types";

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
 * The changes that make copies point at copies: what the `copy` rules of the plugins say (arrows
 * bound to an item that was copied too are bound to its copy, others let go; each copied group
 * becomes a new group; a copy of a frame's items is in the copy of the frame).
 */
export function remapCopies(
  sources: ReadonlyArray<DrawItem>,
  copies: ReadonlyArray<DrawItem>,
  groupId: (old: string) => string,
  plugins?: Plugins,
): Changes {
  let current = copies;
  const out: Changes = [];
  for (const rule of registryOf(plugins).rules.copy) {
    const changes = rule({ sources, copies: current, newGroup: groupId });
    out.push(...changes);
    const by = new Map(changes);
    current = current.map((c) => (by.has(c.id) ? ({ ...c, ...by.get(c.id) } as DrawItem) : c));
  }
  return out;
}

/** The ids a command can change, when it says so; null when any item may change. */
function candidates(c: Command): ReadonlyArray<string> | null {
  switch (c.type) {
    case "drag":
      return c.from.map(([id]) => id);
    case "move":
    case "remove":
      return c.ids;
    case "update":
      return c.changes.map(([id]) => id);
    case "resize":
    case "resize-handle":
      return [c.id];
    default:
      return null;
  }
}

export interface DrawEngineOptions extends TsEngineOptions<DrawData> {
  /** The engine underneath; a TypeScript engine with the kinds of the plugins by default. */
  base?: CanvasEngine<DrawData>;
  /** The core halves of the plugins; the `full` preset by default. */
  plugins?: Plugins;
}

/** A canvas engine that also tells which plugins' kinds and rules it runs. */
export type DrawEngine = CanvasEngine<DrawData> & { readonly registry: Registry };

export function createDrawEngine(options: DrawEngineOptions = {}): DrawEngine {
  const { base, plugins, ...rest } = options;
  const registry = registryOf(plugins);
  const rules = registry.rules;
  const inner =
    base ?? createTsEngine<DrawData>({ ...rest, kinds: { ...registry.kinds, ...rest.kinds } });
  let gesture = false;
  /** Items changed while a gesture is open: they are settled when it ends. */
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

  const get = (id: string) => inner.get(id) as DrawItem | undefined;

  /**
   * What the items were before a change. For the commands that say which items they change (a drag
   * step, a move, an update), only those are saved, and whatever a rule writes is saved before it
   * is written: a step costs what it moves, not the board. Others take a snapshot of the board.
   */
  const beforeOf = (c: Command): BeforeView | Map<string, DrawItem> => {
    const ids = candidates(c);
    if (!ids) return snapshot();
    const before = new BeforeView(get, items);
    for (const id of ids) before.save(id);
    return before;
  };

  /** Applies `changes` in the current step: inside the gesture, or merged by `coalesce`. */
  const write = (
    changes: Changes,
    coalesce?: string,
    before?: BeforeView | Map<string, DrawItem>,
  ) => {
    if (changes.length === 0) return;
    if (before instanceof BeforeView) for (const [id] of changes) before.save(id);
    inner.dispatch({ type: "update", changes, ...(coalesce ? { coalesce } : {}) });
  };

  /** Writes what a rule says and adds the ids it changed to `changed`. */
  const apply = (
    changes: Changes,
    coalesce: string | undefined,
    changed: Set<string>,
    before: BeforeView | Map<string, DrawItem>,
  ) => {
    write(changes, coalesce, before);
    for (const [id] of changes) changed.add(id);
  };

  /** The rules after a change, in the same step. */
  const follow = (
    before: BeforeView | Map<string, DrawItem>,
    coalesce: string | undefined,
    settle: boolean,
  ) => {
    const changed = before instanceof BeforeView ? before.changed() : changedIds(before, items());
    if (changed.size === 0) return;
    for (const rule of rules.carry) {
      apply(rule({ before, items: items(), changed, get }), coalesce, changed, before);
    }
    if (rules.remove.length) {
      const removed = new Set([...changed].filter((id) => !inner.get(id)));
      if (removed.size) {
        for (const rule of rules.remove) {
          apply(rule({ before, items: items(), removed }), coalesce, changed, before);
        }
      }
    }
    if (settle) {
      for (const rule of rules.settle) {
        apply(rule({ before, items: items(), ids: changed }), coalesce, changed, before);
      }
    } else for (const id of changed) touched.add(id);
    for (const rule of rules.follow) {
      write(rule({ before, items: items(), changed, get }), coalesce, before);
    }
  };

  /** The copies a duplicate or a paste made, pointed at each other. */
  const remap = (sources: ReadonlyArray<DrawItem>, result: EngineResult<DrawData>) => {
    const created = result.created as DrawItem[];
    for (const rule of rules.copy) {
      const copies = created.map((c) => (inner.get(c.id) as DrawItem | undefined) ?? c);
      write(rule({ sources, copies, newGroup: freshGroup }));
    }
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
      if (r.ok && json && rules.copy.length) {
        remap(deserialize<DrawData>(json).items as DrawItem[], r);
      }
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
      if (rules.select.length === 0) return inner.dispatch(c);
      let ids = [...c.ids];
      for (const rule of rules.select) ids = rule(items(), ids);
      return inner.dispatch({ ...c, ids });
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
        // Settle what the gesture moved, then put back what depends on what that changed.
        const before = new BeforeView(get, items);
        for (const rule of rules.settle) {
          write(rule({ before, items: items(), ids: touched }), undefined, before);
        }
        for (const rule of rules.follow) {
          write(
            rule({ before, items: items(), changed: before.changed(), get }),
            undefined,
            before,
          );
        }
      }
      gesture = false;
      touched = new Set();
      return inner.dispatch(c);
    }
    if (c.type === "nudge" && !gesture) {
      // The TypeScript engine merges repeated nudges of one selection under this key: what
      // follows them joins the same step. Another engine may not merge; nothing breaks.
      const coalesce = `nudge:${[...inner.getState().selection].sort().join(",")}`;
      const before = beforeOf(c);
      const r = inner.dispatch(c);
      if (r.ok) follow(before, coalesce, true);
      return r;
    }
    if (WITH_META.has(c.type) && !gesture) {
      const meta = c as { coalesce?: string };
      const coalesce = meta.coalesce ?? `draw:${++seq}`;
      const before = beforeOf(c);
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
      const before = beforeOf(c);
      const r = run(c);
      if (r.ok) follow(before, undefined, false);
      if (own) dispatch({ type: "gesture", phase: "end" });
      return r;
    }
    return run(c);
  };

  return {
    registry,
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

/** A store on the draw engine: `store.add(…)`, `store.undo()`… with the rules of the plugins. */
export function createDrawStore(options: DrawEngineOptions = {}): DrawStore {
  return withCommands(createDrawEngine(options));
}

/** The union of the bounds of some items, or null. */
export const boundsOfItems = (list: ReadonlyArray<DrawItem>) =>
  unionBounds(list.map((i) => i.bounds));
