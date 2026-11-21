// A list of slots to pick one from: times of a day, seats, delivery windows. A listbox laid out in
// a grid of buttons, the arrows moving across it, one choice, items that stay in the list but cannot
// be chosen (taken, past). shadcn's composition: a root and parts with `className` and `...rest`.
//
//   <SlotList label="Times on Wed 18" value={time} onValueChange={setTime}>
//     <SlotListItem value="09:00">09:00</SlotListItem>
//     <SlotListItem value="09:30" disabled>09:30</SlotListItem>
//   </SlotList>
//
// With `items` it builds itself: `<SlotList items={[{ value: "09:00", label: "09:00" }]} … />`.

import {
  createContext,
  useContext,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { renderPart, type Part } from "./part";

/** What the shorthand reads of a slot. */
export interface SlotListOption {
  value: string;
  label: ReactNode;
  /** Said to assistive technology in place of the label. */
  ariaLabel?: string;
  /** Stays in the list, struck, and cannot be chosen. */
  disabled?: boolean;
}

interface SlotListBase {
  /** The slot chosen, by `value`. */
  value?: string | null;
  /** A click or Enter on a slot that can be chosen. */
  onValueChange?: (value: string) => void;
  /** Slots per row: how far the up and down arrows go. Default 3. */
  columns?: number;
  /** Names the list for assistive technology: "Times on Wed 18". */
  label?: string;
  asChild?: boolean;
}

export interface SlotListProps
  extends SlotListBase, Omit<Part<ComponentProps<"div">>, "children" | "onChange"> {
  /** Given, `SlotList` builds its items. */
  items: ReadonlyArray<SlotListOption>;
  children?: undefined;
}

export interface SlotListRootProps
  extends SlotListBase, Omit<Part<ComponentProps<"div">>, "children" | "onChange"> {
  items?: undefined;
  children?: ReactNode;
}

interface SlotListState {
  value: string | null;
  choose: (value: string) => void;
}

const SlotListContext = createContext<SlotListState | null>(null);

/** The state of the `SlotList` a part sits in. */
export function useSlotList(part = "useSlotList"): SlotListState {
  const state = useContext(SlotListContext);
  if (!state) throw new Error(`${part} goes inside a SlotList.`);
  return state;
}

const OPTION = '[role="option"]:not([aria-disabled="true"])';
const ALL = '[role="option"]';

/**
 * A listbox of slots in a grid. Arrows move among them (up and down by a row), Home and End go to
 * the ends; a taken slot is skipped by Tab but can be reached by the arrows. One tab stop: the
 * chosen slot, else the list itself, which hands the focus to the first slot that is free.
 */
export function SlotList(props: SlotListProps | SlotListRootProps) {
  const {
    items,
    value = null,
    onValueChange,
    columns = 3,
    label,
    className,
    children,
    asChild,
    onKeyDown,
    onFocus,
    ...rest
  } = props as Omit<SlotListRootProps, "items"> & { items?: ReadonlyArray<SlotListOption> };

  const onKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const list = [...event.currentTarget.querySelectorAll<HTMLElement>(ALL)];
    const at = list.indexOf(document.activeElement as HTMLElement);
    if (at === -1) return;
    const to: Record<string, number> = {
      ArrowRight: at + 1,
      ArrowLeft: at - 1,
      ArrowDown: at + columns,
      ArrowUp: at - columns,
      Home: 0,
      End: list.length - 1,
    };
    const next = to[event.key];
    if (next === undefined) return;
    event.preventDefault();
    list[Math.min(list.length - 1, Math.max(0, next))]?.focus();
  };

  return (
    <SlotListContext.Provider value={{ value, choose: (v) => onValueChange?.(v) }}>
      {renderPart("div", cx("fg-sl", className), asChild, {
        "data-slot": "slot-list",
        role: "listbox",
        "aria-label": label,
        tabIndex: value === null ? 0 : -1,
        ...rest,
        onFocus: (event: FocusEvent<HTMLDivElement>) => {
          onFocus?.(event);
          if (event.target === event.currentTarget) {
            event.currentTarget.querySelector<HTMLElement>(OPTION)?.focus();
          }
        },
        onKeyDown: onKeys,
        children:
          items !== undefined
            ? items.map((item) => (
                <SlotListItem
                  key={item.value}
                  value={item.value}
                  {...(item.disabled ? { disabled: true } : {})}
                  {...(item.ariaLabel ? { "aria-label": item.ariaLabel } : {})}
                >
                  {item.label}
                </SlotListItem>
              ))
            : children,
      })}
    </SlotListContext.Provider>
  );
}

export interface SlotListItemProps extends Omit<Part<ComponentProps<"button">>, "value"> {
  /** Identifies the slot: what `onValueChange` hears. */
  value: string;
  /** Stays in the list, struck, and cannot be chosen. */
  disabled?: boolean;
  asChild?: boolean;
}

/** One slot: a button that is an option of the list. */
export function SlotListItem({
  value,
  disabled,
  className,
  asChild,
  onClick,
  ...rest
}: SlotListItemProps) {
  const state = useSlotList("SlotListItem");
  const on = state.value === value;
  return renderPart(
    "button",
    cx("fg-sl-item", on && "fg-sl-on", disabled && "fg-sl-gone", className),
    asChild,
    {
      "data-slot": "slot-list-item",
      type: "button",
      role: "option",
      "data-value": value,
      "aria-selected": on,
      "aria-disabled": disabled || undefined,
      tabIndex: on ? 0 : -1,
      ...rest,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) state.choose(value);
      },
    },
  );
}

/** Shown in place of the slots when there are none. */
export function SlotListEmpty({
  className,
  asChild,
  ...rest
}: Part<ComponentProps<"p">> & { asChild?: boolean }) {
  return renderPart("p", cx("fg-sl-empty", className), asChild, {
    "data-slot": "slot-list-empty",
    ...rest,
  });
}
