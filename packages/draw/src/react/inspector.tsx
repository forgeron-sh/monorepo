// The properties panel, the shell: the header, the panels of the plugins for the type of the
// selection (or of what the active tool will draw), then the plugins' menu items as rows of
// buttons. What a panel or a button does is the plugin's; every edit is one undo step, and
// dragging a slider merges into one. It is drawn again when what it shows changes, not when items
// only move (a drag of thousands, every step): what a panel or a button acts on is read when it
// acts.

import type { CanvasState, ItemChange } from "@forgeron/canvas";
import { IconButton, Tooltip } from "@forgeron/ui";
import { useCallback, useRef, useSyncExternalStore } from "react";
import type { DrawStore } from "../core/engine";
import type { DrawStyle } from "../core/style";
import type { DrawData, DrawItem } from "../core/types";
import type { EditorContext, MenuItem, MenuState, PanelProps, Slots } from "./plugin";

export { fromEditorFill, fromEditorStroke, toEditorFill, toEditorStroke } from "./pickers";

export interface InspectorProps {
  store: DrawStore;
  slots: Slots;
  ctx: EditorContext;
  style: DrawStyle;
  onStyle: (style: DrawStyle) => void;
}

/** The title of a section of menu items: `arrange` is `Arrange`. */
const sectionLabel = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

const resolve = <T,>(value: T | ((state: MenuState) => T), state: MenuState): T =>
  typeof value === "function" ? (value as (state: MenuState) => T)(state) : value;

/** The menu's state as it is now: what a button acts on. */
const stateNow = (store: DrawStore): MenuState => {
  const s = store.getState();
  const items = s.items as ReadonlyArray<DrawItem>;
  return { items, selected: s.selection.size ? items.filter((i) => s.selection.has(i.id)) : [] };
};

function Action({
  item,
  state,
  ctx,
  store,
}: {
  item: MenuItem;
  state: MenuState;
  ctx: EditorContext;
  store: DrawStore;
}) {
  const label = resolve(item.label, state);
  return (
    <Tooltip content={label}>
      <IconButton
        icon={resolve(item.icon, state)}
        label={label}
        size="sm"
        onClick={() => item.run(ctx, stateNow(store))}
        disabled={item.disabled?.(state) ?? false}
      />
    </Tooltip>
  );
}

/** A point in data (an arrow's end): its place may change, not what it is bound to. */
const isPoint = (v: unknown): v is { x: number; y: number; bind?: string } => {
  if (typeof v !== "object" || v === null) return false;
  for (const k in v) if (k !== "x" && k !== "y" && k !== "bind") return false;
  return true;
};

/** The same data but for where its points are (an arrow following its items). */
const sameButPoints = (a: DrawData, b: DrawData) => {
  if (a === b) return true;
  const x = a as unknown as Record<string, unknown>;
  const y = b as unknown as Record<string, unknown>;
  let n = 0;
  for (const _ in y) n--;
  for (const k in x) {
    n++;
    const u = x[k];
    const v = y[k];
    if (u === v) continue;
    if (!isPoint(u) || !isPoint(v) || u.bind !== v.bind) return false;
  }
  return n === 0;
};

/**
 * The same item but for its place and size (an arrow following its items is laid out again): its
 * kind, data, lock and stacking are the same. No panel shows a place or a size.
 */
const sameButPlace = (a: DrawItem | undefined, b: DrawItem) =>
  a === b ||
  (!!a &&
    a.id === b.id &&
    a.kind === b.kind &&
    sameButPoints(a.data, b.data) &&
    a.locked === b.locked &&
    a.z === b.z);

interface Shown {
  items: ReadonlyArray<DrawItem>;
  selection: CanvasState<DrawData>["selection"];
  tool: string;
}

/**
 * The items, selection and tool the panel shows: the same object while the items only move, so
 * a drag does not draw the panel again at every step.
 */
function useShown(store: DrawStore): Shown {
  const last = useRef<{ seen: Shown; shown: Shown } | null>(null);
  const read = useCallback((): Shown => {
    const s = store.getState();
    const items = s.items as ReadonlyArray<DrawItem>;
    const l = last.current;
    if (l && l.seen.items === items && l.seen.selection === s.selection && l.seen.tool === s.tool)
      return l.shown;
    const seen = { items, selection: s.selection, tool: s.tool };
    const moved =
      !!l &&
      l.seen.selection === s.selection &&
      l.seen.tool === s.tool &&
      l.seen.items.length === items.length &&
      items.every((item, i) => sameButPlace(l.seen.items[i], item));
    last.current = { seen, shown: moved ? l.shown : seen };
    return last.current.shown;
  }, [store]);
  return useSyncExternalStore(store.subscribe, read, read);
}

export function Inspector({ store, slots, ctx, style, onStyle }: InspectorProps) {
  const { items, selection, tool } = useShown(store);
  const selected = selection.size ? items.filter((i) => selection.has(i.id)) : [];
  const types = new Set(selected.map((i) => i.data.type));
  const type: DrawData["type"] | string | undefined = selected.length
    ? types.size === 1
      ? selected[0]!.data.type
      : undefined
    : slots.tools.find((t) => t.id === tool)?.draws;
  if (!selected.length && !type) return null;

  const first = selected[0];
  const key = selected.map((i) => i.id).join(",");
  const props: PanelProps = {
    store,
    style,
    onStyle,
    ctx,
    selected,
    dataOf: <D extends DrawData>(t: D["type"]) =>
      (first?.data.type === t ? first.data : undefined) as D | undefined,
    edit(field, change, next) {
      if (next) onStyle({ ...style, ...next });
      const changes: Array<readonly [string, ItemChange<DrawData>]> = [];
      for (const shown of selected) {
        // As it is now: the panel may show it from before a move.
        const item = (store.get(shown.id) as DrawItem | undefined) ?? shown;
        const c = change(item);
        if (c) changes.push([item.id, c]);
      }
      if (changes.length)
        store.updateMany(changes, { label: "Style", coalesce: `style:${field}:${key}` });
    },
  };
  const panels = type ? slots.panels.filter((p) => p.type === type) : [];

  // The rows of buttons: the menu items that are shown, in order, a toolbar per section.
  const state: MenuState = { selected, items };
  const sections: Array<{ id: string; items: MenuItem[] }> = [];
  if (selected.length) {
    for (const item of slots.menu) {
      if (item.when && !item.when(state)) continue;
      let section = sections.find((s) => s.id === item.section);
      if (!section) sections.push((section = { id: item.section, items: [] }));
      section.items.push(item);
    }
  }
  const header =
    selected.length === 0
      ? `New ${slots.registry.kind(tool)?.label.toLowerCase() ?? "item"}`
      : selected.length === 1
        ? (slots.registry.kind(first!.kind)?.label ?? first!.kind)
        : "Selection";

  return (
    <aside className="fgd-inspector" aria-label="Properties">
      <header className="fgd-insp-head t-mono">{header}</header>
      {panels.map((p) => (
        <p.Component key={p.id} {...props} />
      ))}
      {sections.map((section) => (
        <div
          key={section.id}
          className="fgd-insp-actions"
          role="toolbar"
          aria-label={sectionLabel(section.id)}
        >
          {section.items.map((item) => (
            <Action key={item.id} item={item} state={state} ctx={ctx} store={store} />
          ))}
        </div>
      ))}
    </aside>
  );
}
