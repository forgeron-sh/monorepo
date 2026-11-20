// The properties panel, the shell: the header, the panels of the plugins for the type of the
// selection (or of what the active tool will draw), then the plugins' menu items as rows of
// buttons. What a panel or a button does is the plugin's; every edit is one undo step, and
// dragging a slider merges into one.

import type { ItemChange } from "@forgeron/canvas";
import { useCanvasState } from "@forgeron/canvas/react";
import { IconButton, Tooltip } from "@forgeron/ui";
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

function Action({ item, state, ctx }: { item: MenuItem; state: MenuState; ctx: EditorContext }) {
  const label = resolve(item.label, state);
  return (
    <Tooltip content={label}>
      <IconButton
        icon={resolve(item.icon, state)}
        label={label}
        size="sm"
        onClick={() => item.run(ctx, state)}
        disabled={item.disabled?.(state) ?? false}
      />
    </Tooltip>
  );
}

export function Inspector({ store, slots, ctx, style, onStyle }: InspectorProps) {
  const items = useCanvasState(store, (s) => s.items) as ReadonlyArray<DrawItem>;
  const selection = useCanvasState(store, (s) => s.selection);
  const tool = useCanvasState(store, (s) => s.tool);
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
      for (const item of selected) {
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
            <Action key={item.id} item={item} state={state} ctx={ctx} />
          ))}
        </div>
      ))}
    </aside>
  );
}
