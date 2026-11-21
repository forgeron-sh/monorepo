// The bar that takes the place of the filters while items are selected (D-156, D-157): the parts
// (SelectionBar, SelectionBarClear, SelectionBarCount, SelectionBarSeparator, SelectionBarActions).
// It is drawn for one or more items, says "3 selected" politely, and Escape inside it clears. The
// actions are the screen's (`useActions`): the first ones as buttons, the rest behind ⋯, the
// destructive one last. Selecting is `useCollection`'s; the bar only shows and clears.

import { useRender } from "@base-ui/react/use-render";
import { Cancel01Icon, MoreVerticalIcon } from "@forgeron/icons";
import {
  cloneElement,
  createContext,
  isValidElement,
  use,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { ActionMenu } from "./action-menu";
import { Button } from "./button";
import { cx } from "./cx";
import { buildMenu, type Action } from "./hooks/use-actions";
import { Icon } from "./icon";
import { IconButton } from "./identity";

interface SelectionBarContextValue {
  count: number;
  onClear: () => void;
}

const SelectionBarContext = createContext<SelectionBarContextValue | null>(null);

function useSelectionBar(): SelectionBarContextValue {
  const context = use(SelectionBarContext);
  if (!context) throw new Error("A SelectionBar part is used outside of a SelectionBar.");
  return context;
}

export interface SelectionBarProps extends Omit<ComponentProps<"div">, "ref"> {
  /** How many items are selected; the bar is drawn for one or more. */
  count: number;
  /** The way out: the × and Escape. */
  onClear: () => void;
  /** Draws another element in place of the `div`. */
  render?: ReactElement;
  ref?: Ref<HTMLElement>;
}

/** The root: a toolbar named "Selection", drawn while `count` is 1 or more. */
export function SelectionBar({
  count,
  onClear,
  render,
  className,
  children,
  onKeyDown,
  ref,
  ...rest
}: SelectionBarProps) {
  const element = useRender({
    defaultTagName: "div",
    render,
    ref,
    props: {
      role: "toolbar",
      "aria-label": "Selection",
      "data-slot": "selection-bar",
      ...rest,
      className: cx("fg-selbar", className),
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        event.stopPropagation();
        onClear();
      },
      children,
    },
  });
  if (count < 1) return null;
  return <SelectionBarContext value={{ count, onClear }}>{element}</SelectionBarContext>;
}

export interface SelectionBarClearProps extends Omit<ComponentProps<"button">, "ref"> {
  /** Names the × for assistive technology. Default "Clear selection". */
  label?: string;
  /** The one child element is the control (your own button): it gets the click. */
  asChild?: boolean;
}

/** The × that clears the selection. */
export function SelectionBarClear({
  label = "Clear selection",
  asChild,
  children,
  onClick,
  ...rest
}: SelectionBarClearProps) {
  const { onClear } = useSelectionBar();
  const click = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) onClear();
  };
  if (asChild && isValidElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>(children)) {
    return cloneElement(children, {
      "data-slot": "selection-bar-clear",
      ...rest,
      onClick: (event: MouseEvent<HTMLElement>) => {
        children.props.onClick?.(event);
        click(event as MouseEvent<HTMLButtonElement>);
      },
    } as never);
  }
  return (
    <IconButton
      data-slot="selection-bar-clear"
      {...rest}
      icon={Cancel01Icon}
      label={label}
      size="sm"
      onClick={click}
    />
  );
}

export interface SelectionBarCountProps extends Omit<ComponentProps<"b">, "ref"> {
  /** Draws another element in place of the `b`. */
  render?: ReactElement;
  ref?: Ref<HTMLElement>;
}

/** "3 selected", announced politely as it changes; `children` is written in its place. */
export function SelectionBarCount({
  render,
  className,
  children,
  ref,
  ...rest
}: SelectionBarCountProps) {
  const { count } = useSelectionBar();
  return useRender({
    defaultTagName: "b",
    render,
    ref,
    props: {
      "aria-live": "polite",
      "data-slot": "selection-bar-count",
      ...rest,
      className: cx("fg-selbar-count", className),
      children: children ?? `${count} selected`,
    },
  });
}

/** The thin rule between the count and the actions. */
export function SelectionBarSeparator({ className, ...rest }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="selection-bar-separator"
      {...rest}
      className={cx("fg-selbar-rule", className)}
    />
  );
}

export interface SelectionBarActionsProps {
  /** The actions on the selection, the same list as the menus' (`useActions`). */
  actions: ReadonlyArray<Action>;
  /** Called after an action's own `run`, with its id. */
  onAction?: (id: string) => void;
  /** How many actions show as buttons before the ⋯; 4 by default. Destructive ones count too. */
  inline?: number;
  /** The ids of the actions shown as an icon alone (their label becomes the tooltip). */
  iconOnly?: ReadonlyArray<string>;
}

/** The actions as ghost buttons, the rest behind ⋯; an action with `actions` opens a menu. */
export function SelectionBarActions({
  actions,
  onAction,
  inline = 4,
  iconOnly = [],
}: SelectionBarActionsProps): ReactNode {
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
  const choose = (id: string) => {
    const chosen = byId.get(id);
    if (chosen) run(chosen);
  };
  return (
    <>
      {shown.map((a) =>
        a.actions ? (
          <ActionMenu
            key={a.id}
            items={buildMenu(a.actions)}
            onSelect={choose}
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
          onSelect={choose}
          label="More actions"
          align="end"
          trigger={<IconButton icon={MoreVerticalIcon} label="More actions" size="sm" />}
        />
      ) : null}
    </>
  );
}
