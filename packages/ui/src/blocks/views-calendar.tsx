// The calendar of a list view, after the month grid of the Agenda prototype: Monday first, days of
// other months hatched, weekends a shade raised, today's number on ember, at most a few records a
// day and "+n more". A week mode lists every record of seven days. Records move to another day
// by drag and drop, or by Alt and the arrows.
//
// The grid of days is the `DayGrid` primitive; this block adds the toolbar and reads records. Two
// ways to use it. With props it is the whole calendar. With children it is the root of the parts:
//
//   <CalendarView records={issues} onChange={move}>
//     <CalendarViewToolbar />
//     <CalendarViewBody />
//   </CalendarView>
//
// `CalendarViewToolbar` is Today, the arrows, the title and the modes; build it from
// `CalendarViewToday`, `CalendarViewPrevious`, `CalendarViewNext`, `CalendarViewTitle`,
// `CalendarViewWeekNumber` and `CalendarViewModes`. `CalendarViewBody` is the grid; give it
// `DayGrid` parts to draw days or items yourself.

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { Segmented } from "../controls";
import { cx } from "../cx";
import {
  DayGrid,
  type DayGridItemData,
  type DayGridProps,
  type DayGridRootProps,
} from "../day-grid";
import {
  addDays,
  addMonths,
  formatShort,
  MONTHS,
  monthGrid,
  parseIso,
  toIso,
  weekday,
} from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import {
  PeriodNav,
  PeriodNavBadge,
  PeriodNavGroup,
  PeriodNavNext,
  PeriodNavPrevious,
  PeriodNavTitle,
  PeriodNavToday,
} from "../period-nav";
import { renderPart, type Part } from "../part";
import {
  defaultLabel,
  isoWeek,
  fieldDay,
  resolveAccessors,
  textField,
  type RecordAccessors,
  type RecordFieldProps,
} from "./views-parts";

/** A month of weeks, or one week with every record of each day. */
export type CalendarMode = "month" | "week";

interface CalendarViewBase<T> extends RecordAccessors<T>, RecordFieldProps<T> {
  records: ReadonlyArray<T>;
  /** The day a record sits on, `YYYY-MM-DD`: `record.due`, else `record.date`. Records without one are left out. */
  getDate?: (record: T) => string | null | undefined;
  /** With `fields`: the date field a record sits on; `getDate` wins when both are given. */
  dateField?: string;
  /** The content of an item; the identifier and title of an issue by default. */
  renderItem?: (record: T) => ReactNode;
  /** The day in focus, `YYYY-MM-DD`: its month or its week is shown. */
  date?: string;
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  mode?: CalendarMode;
  defaultMode?: CalendarMode;
  onModeChange?: (mode: CalendarMode) => void;
  /** The modes offered by the toolbar; both by default. */
  modes?: ReadonlyArray<CalendarMode>;
  /** `YYYY-MM-DD`: marked in ember. Defaults to the device's date. */
  today?: string;
  /** The current record. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** A click or Enter on a record. */
  onOpen?: (id: string) => void;
  /** Makes records movable: drag one to another day, or Alt and the arrows on it. */
  onChange?: (id: string, date: string) => void;
  /** The records a day of the month shows before "+n more". */
  maxPerDay?: number;
  /** Today, the arrows, the title and the modes above the grid; on by default. */
  toolbar?: boolean;
  /** Names the grid for assistive technology. */
  label?: string;
}

type RootAttrs = Omit<Part<ComponentProps<"div">>, "children" | "onChange"> & { asChild?: boolean };

export interface CalendarViewProps<T> extends CalendarViewBase<T>, RootAttrs {
  /** Given, `CalendarView` is the root of the parts. */
  children?: undefined;
}

export interface CalendarViewRootProps<T> extends CalendarViewBase<T>, RootAttrs {
  children: ReactNode;
}

const MODES: Record<CalendarMode, string> = { month: "Month", week: "Week" };

/** The days a mode shows around `date`: whole weeks of its month, or its week. */
export function calendarDays(date: string, mode: CalendarMode): string[] {
  if (mode === "week") {
    const monday = addDays(date, -weekday(date));
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }
  const d = parseIso(date);
  const days = monthGrid(d.getFullYear(), d.getMonth());
  const month = date.slice(0, 7);
  // Drop the last weeks that hold no day of the month.
  let weeks = 6;
  while (weeks > 4 && days[(weeks - 1) * 7]!.slice(0, 7) !== month) weeks--;
  return days.slice(0, weeks * 7);
}

interface CalendarViewState {
  date: string;
  setDate: (date: string) => void;
  today: string;
  mode: CalendarMode;
  setMode: (mode: CalendarMode) => void;
  modes: ReadonlyArray<CalendarMode>;
  /** The days drawn: whole weeks, Monday first. */
  days: string[];
  title: string;
  /** Steps the period: a month in month mode, a week in week mode. */
  step: (by: -1 | 1) => void;
  /** The props the grid inside draws from. */
  grid: Omit<DayGridProps, "children" | "label"> & { label: string };
}

const CalendarViewContext = createContext<CalendarViewState | null>(null);

/** The state of the `CalendarView` a part sits in: the date, the mode, the days and the title. */
export function useCalendarView(part = "useCalendarView"): CalendarViewState {
  const state = useContext(CalendarViewContext);
  if (!state) throw new Error(`${part} goes inside a CalendarView.`);
  return state;
}

/**
 * Records on the days of a month (or a week), Monday first. Arrows move between days, Enter goes
 * into a day's records, Escape back out; Alt and the arrows move a record to another day.
 */
export function CalendarView<T>(props: CalendarViewProps<T> | CalendarViewRootProps<T>) {
  const {
    records,
    getDate,
    renderItem,
    date: dateProp,
    defaultDate,
    onDateChange,
    mode: modeProp,
    defaultMode = "month",
    onModeChange,
    modes = ["month", "week"],
    today: todayProp,
    selected,
    defaultSelected,
    onSelectedChange,
    onOpen,
    onChange,
    maxPerDay,
    toolbar = true,
    label = "Calendar",
    className,
    asChild,
    children,
    dateField,
    getId,
    getLabel,
    getColor,
    fields,
    context,
    labelField,
    markField,
    ...rest
  } = props;
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const acc = resolveAccessors({
    ...(getId ? { getId } : {}),
    ...(getLabel ? { getLabel } : {}),
    ...(getColor ? { getColor } : {}),
    ...(fields ? { fields } : {}),
    ...(context ? { context } : {}),
    ...(labelField ? { labelField } : {}),
    ...(markField ? { markField } : {}),
  });
  const dayOf = (r: T) =>
    (getDate
      ? getDate(r)
      : fields && dateField
        ? fieldDay(fields, dateField, r)
        : (textField(r, "due") ?? textField(r, "date"))) ?? null;

  const [date, setDate] = useControllableState<string>({
    value: dateProp,
    defaultValue: defaultDate ?? today,
    onChange: onDateChange,
  });
  const [mode, setMode] = useControllableState<CalendarMode>({
    value: modeProp,
    defaultValue: defaultMode,
    onChange: onModeChange,
  });

  const days = calendarDays(date, mode);
  const year = parseIso(date).getFullYear();
  const title =
    mode === "month"
      ? `${MONTHS[parseIso(date).getMonth()]} ${year}`
      : `${formatShort(days[0]!)} – ${formatShort(days[6]!)}, ${parseIso(days[6]!).getFullYear()}`;

  const items: DayGridItemData[] = [];
  for (const r of records) {
    const day = dayOf(r);
    if (!day) continue;
    const name = acc.label(r);
    const color = acc.color(r);
    items.push({
      id: acc.id(r),
      day,
      label: name,
      ...(color ? { color } : {}),
      content: renderItem ? (
        renderItem(r)
      ) : (
        <>
          {acc.mark(r)}
          {defaultLabel(r, name, "fg-dg-id")}
        </>
      ),
    });
  }

  const state: CalendarViewState = {
    date,
    setDate,
    today,
    mode,
    setMode,
    modes,
    days,
    title,
    step: (by) => setDate(mode === "month" ? addMonths(date, by) : addDays(date, by * 7)),
    grid: {
      days,
      items,
      date,
      onDateChange: setDate,
      today,
      unit: mode,
      ...(mode === "month" ? { month: date.slice(0, 7) } : {}),
      ...(selected !== undefined ? { selected } : {}),
      ...(defaultSelected !== undefined ? { defaultSelected } : {}),
      ...(onSelectedChange ? { onSelectedChange } : {}),
      ...(onOpen ? { onOpen } : {}),
      ...(onChange ? { onChange } : {}),
      ...(maxPerDay !== undefined ? { maxPerDay } : {}),
      onMore: (day) => {
        setDate(day);
        if (modes.includes("week")) setMode("week");
      },
      label: `${label}, ${title}`,
    },
  };

  return (
    <CalendarViewContext.Provider value={state}>
      {renderPart("div", cx("fg-calv", className), asChild, {
        "data-slot": "calendar-view",
        ...rest,
        children: children ?? (
          <>
            {toolbar ? <CalendarViewToolbar /> : null}
            <CalendarViewBody />
          </>
        ),
      })}
    </CalendarViewContext.Provider>
  );
}

type Parted<T> = Part<T> & { asChild?: boolean };

/** Today, the arrows and the title on the left, the modes on the right. */
export function CalendarViewToolbar({ children, ...rest }: Parted<ComponentProps<"div">>) {
  const g = useCalendarView("CalendarViewToolbar");
  return (
    <PeriodNav data-slot="calendar-view-toolbar" {...rest}>
      {children ?? (
        <>
          <PeriodNavGroup>
            <CalendarViewToday />
            <CalendarViewPrevious />
            <CalendarViewNext />
            <CalendarViewTitle />
            {g.mode === "week" ? <CalendarViewWeekNumber /> : null}
          </PeriodNavGroup>
          {g.modes.length > 1 ? <CalendarViewModes /> : null}
        </>
      )}
    </PeriodNav>
  );
}

/** Goes back to today. */
export function CalendarViewToday({ onClick, ...rest }: Part<ComponentProps<"button">>) {
  const g = useCalendarView("CalendarViewToday");
  return (
    <PeriodNavToday
      data-slot="calendar-view-today"
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) g.setDate(g.today);
      }}
    />
  );
}

/** The month before, or the week before. */
export function CalendarViewPrevious({ onClick, ...rest }: Part<ComponentProps<"button">>) {
  const g = useCalendarView("CalendarViewPrevious");
  return (
    <PeriodNavPrevious
      data-slot="calendar-view-previous"
      label={g.mode === "month" ? "Previous month" : "Previous week"}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) g.step(-1);
      }}
    />
  );
}

/** The month after, or the week after. */
export function CalendarViewNext({ onClick, ...rest }: Part<ComponentProps<"button">>) {
  const g = useCalendarView("CalendarViewNext");
  return (
    <PeriodNavNext
      data-slot="calendar-view-next"
      label={g.mode === "month" ? "Next month" : "Next week"}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) g.step(1);
      }}
    />
  );
}

/** The month or the week shown. */
export function CalendarViewTitle({ children, ...rest }: Parted<ComponentProps<"span">>) {
  const g = useCalendarView("CalendarViewTitle");
  return (
    <PeriodNavTitle data-slot="calendar-view-title" {...rest}>
      {children ?? g.title}
    </PeriodNavTitle>
  );
}

/** "W47": the number of the week shown, in week mode. */
export function CalendarViewWeekNumber({ children, ...rest }: Parted<ComponentProps<"span">>) {
  const g = useCalendarView("CalendarViewWeekNumber");
  return (
    <PeriodNavBadge data-slot="calendar-view-week-number" {...rest}>
      {children ?? `W${isoWeek(g.days[0]!)}`}
    </PeriodNavBadge>
  );
}

/** The switch of modes: month, week. */
export function CalendarViewModes({
  modes: only,
  className,
}: {
  /** The modes offered; the calendar's `modes` by default. */
  modes?: ReadonlyArray<CalendarMode>;
  className?: string;
}) {
  const g = useCalendarView("CalendarViewModes");
  return (
    <Segmented
      label="Calendar mode"
      {...(className ? { className } : {})}
      options={(only ?? g.modes).map((m) => ({ value: m, label: MODES[m] }))}
      value={g.mode}
      onChange={(m) => g.setMode(m as CalendarMode)}
    />
  );
}

/** The grid of days: the `DayGrid` of this calendar. Give it `DayGrid` parts to draw it yourself. */
export function CalendarViewBody({
  children,
  ...rest
}: Omit<DayGridProps, "days" | "items" | "children"> & { children?: ReactNode }) {
  const { grid } = useCalendarView("CalendarViewBody");
  const merged = { ...grid, ...rest };
  return children !== undefined ? (
    <DayGrid {...(merged as DayGridRootProps)}>{children}</DayGrid>
  ) : (
    <DayGrid {...(merged as DayGridProps)} />
  );
}
