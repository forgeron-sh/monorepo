// The actions of a screen, declared once: each one appears in the "…" menu, the right-click menu
// and the command palette, answers its shortcut, and runs the same code from all four.
//
//   const actions = useActions([
//     { id: "assign-me", label: "Assign to me", icon: UserIcon, shortcut: "i", run: assignMe },
//     { id: "status", label: "Status", icon: Loading03Icon, actions: statusChoices },
//     { id: "delete", label: "Delete", icon: Delete02Icon, danger: true, run: remove },
//   ]);
//   <ActionMenu items={actions.menu} onSelect={actions.run} />
//   <CommandPalette groups={actions.commands} onSelect={actions.run} {...palette.props} />

import type { IconDefinition } from "@forgeron/icons";
import { useMemo, type ReactNode } from "react";
import type { ActionMenuEntry, ActionMenuItem } from "../action-menu";
import type { CommandPaletteGroup } from "../command-palette";
import { formatShortcut, useShortcuts } from "./use-shortcuts";

export interface Action {
  /** Unique across the actions and their choices, e.g. `status:done`. */
  id: string;
  label: string;
  icon?: IconDefinition;
  /** Any mark in place of `icon`: a status glyph, an avatar. */
  glyph?: ReactNode;
  /** The key that runs it from anywhere on the page, e.g. `"i"`, `"mod+backspace"`. */
  shortcut?: string;
  /** Actions of a group sit together: a separator between groups in a menu, a heading in the palette. */
  group?: string;
  /** Other words that find it in the palette. */
  keywords?: ReadonlyArray<string>;
  /** Destructive: last in a menu, in the danger colour. */
  danger?: boolean;
  disabled?: boolean;
  /** The current choice, in a list of choices: ticked. */
  checked?: boolean;
  run?: () => void;
  /** Choices under this action: a submenu in a menu, one row each in the palette. */
  actions?: ReadonlyArray<Action>;
}

export interface UseActionsOptions {
  /** Binds the shortcuts on the page; true by default. Turn off on a page that shows several records. */
  shortcuts?: boolean;
  /** The heading of the actions without a `group` in the palette; "Actions" by default. */
  label?: string;
}

export interface Actions {
  /** Runs an action by id, if it exists and is enabled; returns whether it ran. */
  run: (id: string) => boolean;
  /** For `ActionMenu` and `ContextMenu`: groups apart, danger last. */
  menu: ActionMenuEntry[];
  /** For `CommandPalette`: one group per `group`, choices as "Status: Done". */
  commands: CommandPaletteGroup[];
}

const walk = (actions: ReadonlyArray<Action>): Action[] =>
  actions.flatMap((a) => [a, ...walk(a.actions ?? [])]);

function toMenuItem(a: Action): ActionMenuItem {
  return {
    id: a.id,
    label: a.label,
    ...(a.icon ? { icon: a.icon } : {}),
    ...(a.glyph !== undefined ? { glyph: a.glyph } : {}),
    ...(a.shortcut ? { kbd: formatShortcut(a.shortcut) } : {}),
    ...(a.danger ? { danger: true } : {}),
    ...(a.disabled ? { disabled: true } : {}),
    ...(a.checked !== undefined ? { checked: a.checked } : {}),
    ...(a.actions ? { items: buildMenu(a.actions) } : {}),
  };
}

/** The menu entries of a list of actions: one block per group, then the destructive ones. */
export function buildMenu(actions: ReadonlyArray<Action>): ActionMenuEntry[] {
  const order: string[] = [];
  const byGroup = new Map<string, Action[]>();
  for (const a of actions) {
    const key = a.danger ? "\u0000danger" : (a.group ?? "");
    if (!byGroup.has(key)) {
      byGroup.set(key, []);
      if (!a.danger) order.push(key);
    }
    byGroup.get(key)!.push(a);
  }
  if (byGroup.has("\u0000danger")) order.push("\u0000danger");
  return order.flatMap((key, i) => [
    ...(i > 0 ? [{ separator: true as const }] : []),
    ...byGroup.get(key)!.map(toMenuItem),
  ]);
}

/** The palette groups of a list of actions: a choice reads "Status: Done". */
export function buildCommands(
  actions: ReadonlyArray<Action>,
  label = "Actions",
): CommandPaletteGroup[] {
  const groups = new Map<string, CommandPaletteGroup["items"][number][]>();
  const add = (a: Action, group: string, prefix: string) => {
    if (a.actions) {
      for (const c of a.actions) add(c, group, `${prefix}${a.label}: `);
      return;
    }
    if (a.disabled) return;
    const items = groups.get(group) ?? [];
    items.push({
      id: a.id,
      label: `${prefix}${a.label}`,
      ...(a.icon ? { icon: a.icon } : {}),
      ...(a.glyph !== undefined ? { glyph: a.glyph } : {}),
      ...(a.shortcut ? { kbd: formatShortcut(a.shortcut) } : {}),
      ...(a.keywords ? { keywords: a.keywords } : {}),
    });
    groups.set(group, items);
  };
  for (const a of actions) add(a, a.group ?? label, "");
  return [...groups].map(([g, items]) => ({ label: g, items }));
}

/** One list of actions for the menus, the palette and the keyboard. */
export function useActions(
  actions: ReadonlyArray<Action>,
  { shortcuts = true, label }: UseActionsOptions = {},
): Actions {
  const all = useMemo(() => walk(actions), [actions]);
  const run = (id: string) => {
    const action = all.find((a) => a.id === id);
    if (!action?.run || action.disabled) return false;
    action.run();
    return true;
  };
  const bindings = useMemo(
    () =>
      Object.fromEntries(
        all
          .filter((a) => a.shortcut && a.run && !a.disabled)
          .map((a) => [a.shortcut!, () => a.run!()]),
      ),
    [all],
  );
  useShortcuts(bindings, { enabled: shortcuts });
  const menu = useMemo(() => buildMenu(actions), [actions]);
  const commands = useMemo(() => buildCommands(actions, label), [actions, label]);
  return { run, menu, commands };
}
