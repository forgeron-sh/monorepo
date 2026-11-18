// The bar that takes the place of the filters while items are selected: how many, a way out, and
// the actions on them. The actions are the screen's (`useActions`): the first ones as buttons,
// the rest behind ⋯, the destructive one last.

import { Cancel01Icon, MoreVerticalIcon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { buildMenu, type Action } from "../hooks/use-actions";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { ActionMenu } from "./navigation-action-menu";

export interface SelectionBarProps {
  /** How many items are selected; the bar is drawn for one or more. */
  count: number;
  /** The way out: the × and Escape. */
  onClear: () => void;
  /** The actions on the selection, the same list as the menus' (`useActions`). */
  actions: ReadonlyArray<Action>;
  /** Called after an action's own `run`, with its id. */
  onAction?: (id: string) => void;
  /** How many actions show as buttons before the ⋯; 4 by default. Destructive ones count too. */
  inline?: number;
  /** The ids of the actions shown as an icon alone (their label becomes the tooltip). */
  iconOnly?: ReadonlyArray<string>;
  /** Written in place of "3 selected". */
  children?: ReactNode;
  className?: string;
}

/** "3 selected", the × that clears, the actions as buttons and the rest behind ⋯. */
export function SelectionBar({
  count,
  onClear,
  actions,
  onAction,
  inline = 4,
  iconOnly = [],
  children,
  className,
}: SelectionBarProps) {
  if (count < 1) return null;
  const all = actions.filter((a) => !a.actions || a.actions.length > 0);
  const shown = all.slice(0, inline);
  const rest = all.slice(inline);
  const run = (a: Action) => {
    if (a.disabled) return;
    a.run?.();
    onAction?.(a.id);
  };
  const byId = new Map(
    all.flatMap((a) => [a, ...(a.actions ?? [])]).map((a) => [a.id, a] as const),
  );
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    onClear();
  };
  return (
    <div
      role="toolbar"
      aria-label="Selection"
      className={cx("fg-selbar", className)}
      onKeyDown={onKeyDown}
    >
      <IconButton icon={Cancel01Icon} label="Clear selection" size="sm" onClick={onClear} />
      <b className="fg-selbar-count" aria-live="polite">
        {children ?? `${count} selected`}
      </b>
      <span className="fg-selbar-rule" aria-hidden="true" />
      {shown.map((a) =>
        a.actions ? (
          <ActionMenu
            key={a.id}
            items={buildMenu(a.actions)}
            onSelect={(id) => {
              const chosen = byId.get(id);
              if (chosen) run(chosen);
            }}
            label={a.label}
            trigger={
              <Button variant="ghost" size="sm" disabled={a.disabled}>
                {a.icon ? <Icon icon={a.icon} size={12} variant="mono" /> : null}
                {a.label}
              </Button>
            }
          />
        ) : iconOnly.includes(a.id) && a.icon ? (
          <IconButton
            key={a.id}
            icon={a.icon}
            label={a.label}
            title={a.label}
            size="sm"
            disabled={a.disabled}
            className={cx(a.danger && "fg-selbar-danger")}
            onClick={() => run(a)}
          />
        ) : (
          <Button
            key={a.id}
            variant="ghost"
            size="sm"
            disabled={a.disabled}
            className={cx(a.danger && "fg-selbar-danger")}
            onClick={() => run(a)}
          >
            {a.icon ? <Icon icon={a.icon} size={12} variant="mono" /> : null}
            {a.label}
          </Button>
        ),
      )}
      {rest.length > 0 ? (
        <ActionMenu
          items={buildMenu(rest)}
          onSelect={(id) => {
            const chosen = byId.get(id);
            if (chosen) run(chosen);
          }}
          label="More actions"
          align="end"
          trigger={<IconButton icon={MoreVerticalIcon} label="More actions" size="sm" />}
        />
      ) : null}
    </div>
  );
}
