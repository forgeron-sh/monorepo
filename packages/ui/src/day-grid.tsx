// A grid of days with things on them: a month of weeks, or one week, Monday first. Days of other
// months hatched, weekends a shade raised, today's number on ember, at most a few items a day and
// "+n more". Items move to another day by drag and drop, or by Alt and the arrows. Presentational:
// the date in focus and the items are the caller's. shadcn's composition: a root and parts, each
// with `className` and `...rest`, and `asChild` where it is one element.
//
//   <DayGrid days={days} items={items} date={date} onDateChange={setDate} month="2026-11">
//     <DayGridHeader />
//     <DayGridBody />
//   </DayGrid>
//
// `DayGridBody` draws the weeks; draw a day yourself with `<DayGridDay day={d}>…</DayGridDay>`,
// whose default content is `DayGridNumber`, `DayGridItems` and `DayGridMore`. Without children the
// root draws header and body.

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import {
  addDays,
  addMonths,
  formatLong,
  formatShort,
  parseIso,
  toIso,
  WEEKDAYS,
  weekday,
} from "./dates";
import { useControllableState } from "./hooks/use-controllable";
import { renderPart, type Part } from "./part";

/** One thing on a day: a record, an event, a deadline. */
export interface DayGridItemData {
  id: string;
  /** The day it sits on, `YYYY-MM-DD`. */
  day: string;
  /** Its name: read out, and the tooltip. */
  label: string;
  /** A CSS colour for its square, e.g. `var(--accent)`. */
  color?: string;
  /** What is drawn inside the item; the label by default. */
  content?: ReactNode;
}

interface DayGridBase {
  /** The days drawn: whole weeks, Monday first. */
  days: ReadonlyArray<string>;
  items: ReadonlyArray<DayGridItemData>;
  /** The day that holds the focus (one tab stop), `YYYY-MM-DD`. */
  date?: string;
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  /** `YYYY-MM`: days of other months are hatched. Leave out for a week. */
  month?: string;
  /** `YYYY-MM-DD`: marked in ember. Defaults to the device's date. */
  today?: string;
  /** What Page Up and Page Down step by, and whether a day's items are capped. Default `month`. */
  unit?: "month" | "week";
  /** The current item. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** A click on an item. */
  onOpen?: (id: string) => void;
  /** Makes items movable: drag one to another day, or Alt and the arrows on it. */
  onChange?: (id: string, day: string) => void;
  /** The items a day of a month shows before "+n more". Default 3. */
  maxPerDay?: number;
  /** A click on "+n more". */
  onMore?: (day: string) => void;
  /** Names the grid for assistive technology. */
  label?: string;
}

export interface DayGridProps
  extends DayGridBase, Omit<Part<ComponentProps<"div">>, "children" | "onChange"> {
  asChild?: boolean;
  /** Given, `DayGrid` is the root of the parts. */
  children?: undefined;
}

export interface DayGridRootProps
  extends DayGridBase, Omit<Part<ComponentProps<"div">>, "children" | "onChange"> {
  asChild?: boolean;
  children: ReactNode;
}

interface DayGridState {
  days: ReadonlyArray<string>;
  weeks: string[][];
  byDay: ReadonlyMap<string, DayGridItemData[]>;
  date: string;
  today: string;
  month: string | undefined;
  unit: "month" | "week";
  current: string | null;
  maxPerDay: number;
  movable: boolean;
  hintId: string;
  target: string | null;
  dragging: string | null;
  setTarget: (day: string | null) => void;
  setDragging: (id: string | null) => void;
  drop: (event: DragEvent<HTMLElement>, day: string) => void;
  open: (id: string) => void;
  more: (day: string) => void;
}

const DayGridContext = createContext<DayGridState | null>(null);

/** The state of the `DayGrid` a part sits in. */
export function useDayGrid(part = "useDayGrid"): DayGridState {
  const state = useContext(DayGridContext);
  if (!state) throw new Error(`${part} goes inside a DayGrid.`);
  return state;
}

const ARROWS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/**
 * Items on the days of a month or a week. Arrows move between days, Enter goes into a day's items,
 * Escape back out; Alt and the arrows move an item to another day.
 */
export function DayGrid(props: DayGridProps | DayGridRootProps) {
  const {
    days,
    items,
    date: dateProp,
    defaultDate,
    onDateChange,
    month,
    today: todayProp,
    unit = "month",
    selected,
    defaultSelected = null,
    onSelectedChange,
    onOpen,
    onChange,
    maxPerDay = 3,
    onMore,
    label = "Calendar",
    className,
    asChild,
    children,
    onKeyDown,
    ...rest
  } = props;
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const [date, setDate] = useControllableState<string>({
    value: dateProp,
    defaultValue: defaultDate ?? days[0] ?? today,
    onChange: onDateChange,
  });
  const [current, select] = useControllableState<string | null>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (id) => {
      if (id !== null) onSelectedChange?.(id);
    },
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const focusDay = useRef(false);
  const focusItem = useRef<string | null>(null);
  const hintId = useId();

  // After a move by the keyboard, the focus follows: to the day, or to the item in its new day.
  useEffect(() => {
    const root = grid.current;
    if (!root) return;
    if (focusItem.current !== null) {
      const id = focusItem.current;
      focusItem.current = null;
      focusDay.current = false;
      [...root.querySelectorAll<HTMLElement>("[data-item]")]
        .find((el) => el.dataset.item === id)
        ?.focus();
      return;
    }
    if (focusDay.current) {
      focusDay.current = false;
      root.querySelector<HTMLElement>(`[data-day="${date}"]`)?.focus();
    }
  });

  const byDay = new Map<string, DayGridItemData[]>();
  for (const item of items) {
    const list = byDay.get(item.day);
    if (list) list.push(item);
    else byDay.set(item.day, [item]);
  }
  const weeks = Array.from({ length: Math.floor(days.length / 7) }, (_, w) =>
    days.slice(w * 7, w * 7 + 7),
  );

  const goDay = (next: string) => {
    focusDay.current = true;
    setDate(next);
  };

  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const el = event.target as HTMLElement;
    const cell = el.closest<HTMLElement>("[data-day]");
    if (!cell) return;
    const day = cell.dataset.day!;
    const inner = el.dataset.item !== undefined || el.dataset.more !== undefined;

    if (inner) {
      const id = el.dataset.item;
      if (event.altKey && id !== undefined && onChange && ARROWS[event.key] !== undefined) {
        event.preventDefault();
        const next = addDays(day, ARROWS[event.key]!);
        focusItem.current = id;
        onChange(id, next);
        setDate(next);
        return;
      }
      const inside = [...cell.querySelectorAll<HTMLElement>("[data-item], [data-more]")];
      const at = inside.indexOf(el);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = inside[at + (event.key === "ArrowDown" ? 1 : -1)];
        if (next) next.focus();
        else cell.focus();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        cell.focus();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        goDay(addDays(day, ARROWS[event.key]!));
      }
      return;
    }

    if (el !== cell) return;
    if (event.key === "Enter" || event.key === " ") {
      const first = cell.querySelector<HTMLElement>("[data-item], [data-more]");
      if (first) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(day, -1),
      ArrowRight: () => addDays(day, 1),
      ArrowUp: () => addDays(day, -7),
      ArrowDown: () => addDays(day, 7),
      PageUp: () => (unit === "month" ? addMonths(day, -1) : addDays(day, -7)),
      PageDown: () => (unit === "month" ? addMonths(day, 1) : addDays(day, 7)),
      Home: () => addDays(day, -weekday(day)),
      End: () => addDays(day, 6 - weekday(day)),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    goDay(move());
  };

  const state: DayGridState = {
    days,
    weeks,
    byDay,
    date,
    today,
    month,
    unit,
    current,
    maxPerDay,
    movable: onChange !== undefined,
    hintId,
    target,
    dragging,
    setTarget,
    setDragging,
    drop: (event, day) => {
      if (!dragging || !onChange) return;
      event.preventDefault();
      const item = items.find((i) => i.id === dragging);
      if (item && item.day !== day) onChange(dragging, day);
      setDragging(null);
      setTarget(null);
    },
    open: (id) => {
      select(id);
      onOpen?.(id);
    },
    more: (day) => onMore?.(day),
  };

  return (
    <DayGridContext.Provider value={state}>
      {renderPart("div", cx("fg-dg", unit === "week" && "fg-dg-weekmode", className), asChild, {
        "data-slot": "day-grid",
        role: "grid",
        "aria-label": label,
        ref: grid,
        ...rest,
        onKeyDown: keys,
        children: (
          <>
            {onChange ? (
              <span id={hintId} className="fg-sr">
                Alt and the arrows move an item to another day.
              </span>
            ) : null}
            {children ?? (
              <>
                <DayGridHeader />
                <DayGridBody />
              </>
            )}
          </>
        ),
      })}
    </DayGridContext.Provider>
  );
}

/** The row of weekday names. */
export function DayGridHeader({
  className,
  asChild,
  children,
  ...rest
}: Part<ComponentProps<"div">> & { asChild?: boolean }) {
  return renderPart("div", cx("fg-dg-row", className), asChild, {
    "data-slot": "day-grid-header",
    role: "row",
    ...rest,
    children:
      children ??
      WEEKDAYS.map((name) => (
        <div key={name} role="columnheader" className="fg-dg-dow" aria-label={name}>
          {name.slice(0, 3)}
        </div>
      )),
  });
}

/** The weeks: a row of seven `DayGridDay` each. Give a function to draw a week or a day yourself. */
export function DayGridBody({
  children,
}: {
  children?: (week: string[], index: number) => ReactNode;
}) {
  const { weeks } = useDayGrid("DayGridBody");
  return (
    <>
      {weeks.map((week, index) =>
        children ? (
          children(week, index)
        ) : (
          <DayGridWeek key={week[0]}>
            {week.map((day) => (
              <DayGridDay key={day} day={day} />
            ))}
          </DayGridWeek>
        ),
      )}
    </>
  );
}

/** A row of seven days. */
export function DayGridWeek({
  className,
  asChild,
  ...rest
}: Part<ComponentProps<"div">> & { asChild?: boolean }) {
  return renderPart("div", cx("fg-dg-row", className), asChild, {
    "data-slot": "day-grid-week",
    role: "row",
    ...rest,
  });
}

export interface DayGridDayProps extends Part<Omit<ComponentProps<"div">, "children">> {
  /** `YYYY-MM-DD`. */
  day: string;
  asChild?: boolean;
  /** Its content; the number, the items and "more" by default. */
  children?: ReactNode;
}

/** One day: a grid cell that holds the focus, takes a drop, and draws its items. */
export function DayGridDay({ day, className, asChild, children, ...rest }: DayGridDayProps) {
  const g = useDayGrid("DayGridDay");
  const list = g.byDay.get(day) ?? [];
  return renderPart(
    "div",
    cx(
      "fg-dg-day",
      weekday(day) > 4 && "fg-dg-weekend",
      g.month !== undefined && day.slice(0, 7) !== g.month && "fg-dg-out",
      day === g.today && "fg-dg-today",
      g.target === day && "fg-dg-target",
      className,
    ),
    asChild,
    {
      "data-slot": "day-grid-day",
      role: "gridcell",
      "data-day": day,
      tabIndex: day === g.date ? 0 : -1,
      "aria-label": `${formatLong(day)}${list.length ? `, ${list.length} ${list.length === 1 ? "item" : "items"}` : ""}`,
      "aria-selected": day === g.date,
      ...(day === g.today ? { "aria-current": "date" } : {}),
      onDragOver: (e: DragEvent<HTMLElement>) => {
        if (!g.dragging) return;
        e.preventDefault();
        if (g.target !== day) g.setTarget(day);
      },
      onDrop: (e: DragEvent<HTMLElement>) => g.drop(e, day),
      ...rest,
      children: children ?? (
        <>
          <DayGridNumber day={day} />
          <DayGridItems day={day} />
          <DayGridMore day={day} />
        </>
      ),
    },
  );
}

/** The number of the day, with its month on the first of the month. */
export function DayGridNumber({
  day,
  className,
  asChild,
  children,
  ...rest
}: Part<ComponentProps<"span">> & { day: string; asChild?: boolean }) {
  const n = parseIso(day).getDate();
  return renderPart("span", cx("fg-dg-num", className), asChild, {
    "data-slot": "day-grid-number",
    "aria-hidden": true,
    ...rest,
    children: children ?? (n === 1 ? formatShort(day) : n),
  });
}

/** What a day shows of its items: all of them, or all but those that go under "more". */
function shownOf(g: DayGridState, day: string) {
  const list = g.byDay.get(day) ?? [];
  const capped = g.unit === "month" && list.length > g.maxPerDay + 1;
  return { list, capped, shown: capped ? list.slice(0, g.maxPerDay) : list };
}

/** The items of a day, as a list. Give a function to draw an item yourself. */
export function DayGridItems({
  day,
  className,
  asChild,
  children,
  ...rest
}: Omit<Part<ComponentProps<"ul">>, "children"> & {
  day: string;
  asChild?: boolean;
  children?: (item: DayGridItemData) => ReactNode;
}) {
  const g = useDayGrid("DayGridItems");
  const { shown } = shownOf(g, day);
  if (shown.length === 0) return null;
  return renderPart("ul", cx("fg-dg-items", className), asChild, {
    "data-slot": "day-grid-items",
    ...rest,
    children: shown.map((item) => (
      <li key={item.id}>{children ? children(item) : <DayGridItem item={item} />}</li>
    )),
  });
}

export interface DayGridItemProps extends Omit<Part<ComponentProps<"button">>, "children"> {
  item: DayGridItemData;
  asChild?: boolean;
  /** Its content; `item.content`, else its label. */
  children?: ReactNode;
}

/** One item: a button with the colour of its record on its square. */
export function DayGridItem({ item, className, asChild, children, ...rest }: DayGridItemProps) {
  const g = useDayGrid("DayGridItem");
  const on = item.id === g.current;
  return renderPart("button", cx("fg-dg-item", on && "fg-dg-current", className), asChild, {
    "data-slot": "day-grid-item",
    type: "button",
    "data-item": item.id,
    tabIndex: -1,
    title: item.label,
    draggable: g.movable ? true : undefined,
    "aria-describedby": g.movable ? g.hintId : undefined,
    ...(on ? { "aria-current": true } : {}),
    style: item.color ? ({ "--c": item.color } as CSSProperties) : undefined,
    onClick: () => g.open(item.id),
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.dataTransfer.setData("text/plain", item.id);
      e.dataTransfer.effectAllowed = "move";
      g.setDragging(item.id);
    },
    onDragEnd: () => {
      g.setDragging(null);
      g.setTarget(null);
    },
    ...rest,
    children: (
      <>
        <span className="fg-dg-sq" aria-hidden="true" />
        <span className="fg-dg-text">{children ?? item.content ?? item.label}</span>
      </>
    ),
  });
}

/** "+n more" under a day whose items are capped; nothing when they all fit. */
export function DayGridMore({
  day,
  className,
  asChild,
  ...rest
}: Omit<Part<ComponentProps<"button">>, "children"> & { day: string; asChild?: boolean }) {
  const g = useDayGrid("DayGridMore");
  const { list, capped, shown } = shownOf(g, day);
  if (!capped) return null;
  const hidden = list.length - shown.length;
  return renderPart("button", cx("fg-dg-more", className), asChild, {
    "data-slot": "day-grid-more",
    type: "button",
    "data-more": "",
    tabIndex: -1,
    "aria-label": `${hidden} more on ${formatLong(day)}`,
    onClick: () => g.more(day),
    ...rest,
    children: `+${hidden} more`,
  });
}
