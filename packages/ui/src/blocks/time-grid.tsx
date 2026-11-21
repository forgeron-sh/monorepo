// The time grid of an agenda, after the Agenda prototype: day, work week or week as columns of
// hours, events laid out side by side where they overlap, an all-day row, one ember line for now,
// hours of work left plain and the rest hatched. Drag on empty space to create, drag an event to
// move it or its foot to resize it (15 minutes at a time); the keyboard does the same.
// Records are read through accessors, so it holds meetings, shifts or bookings alike.
//
// The grid itself is the `EventGrid` primitive; this block adds the toolbar and reads records. Two
// ways to use it. With props it is the whole agenda. With children it is the root of the parts:
//
//   <TimeGrid records={meetings} view={view} onViewChange={setView}>
//     <TimeGridToolbar />
//     <TimeGridBody />
//   </TimeGrid>
//
// `TimeGridToolbar` is Today, the arrows, the title and the views; build it from `TimeGridToday`,
// `TimeGridPrevious`, `TimeGridNext`, `TimeGridTitle`, `TimeGridWeekNumber` and `TimeGridViews`.
// `TimeGridBody` is the grid; give it `EventGrid` parts to draw columns or events yourself.

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { formatLong, formatShort, parseIso, toIso } from "../dates";
import {
  EventGrid,
  type EventGridChange,
  type EventGridEvent,
  type EventGridEventInfo,
  type EventGridProps,
  type EventGridResource,
  type EventGridRootProps,
} from "../event-grid";
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
import { stepView, toMinutes, viewDays, type GridView, type TimeSpan } from "./time-model";
import { isoWeek, resolveAccessors, type RecordAccessors } from "./views-parts";

/** The new place of an event, or of one about to be created. */
export type TimeGridChange = EventGridChange;
/** A column of the resource variant: a person, a room, a chair. */
export type TimeGridResource = EventGridResource;
/** What an event knows about itself when it is drawn. */
export type TimeGridEventInfo = EventGridEventInfo;

interface TimeGridBase<T> extends RecordAccessors<T> {
  records: ReadonlyArray<T>;
  /** The day of a record, `YYYY-MM-DD`: `record.date` by default. */
  getDate?: (record: T) => string | null | undefined;
  /** The last day of an all-day record that spans several days: `record.endDate`. */
  getEndDate?: (record: T) => string | null | undefined;
  /** `HH:mm`: `record.start` by default. */
  getStart?: (record: T) => string | null | undefined;
  /** `HH:mm`: `record.end` by default. */
  getEnd?: (record: T) => string | null | undefined;
  /** Records of the all-day row: `record.allDay === true` by default. */
  getAllDay?: (record: T) => boolean;
  /** The resource column of a record: `record.resource` by default. */
  getResource?: (record: T) => string | null | undefined;
  /** The inside of a timed event: its label and times by default. */
  renderEvent?: (record: T, info: TimeGridEventInfo) => ReactNode;
  /** The inside of an all-day chip: its label by default. */
  renderAllDay?: (record: T) => ReactNode;
  /** The days shown: a day, Monday to Friday, or the whole week. */
  view?: GridView;
  defaultView?: GridView;
  onViewChange?: (view: GridView) => void;
  /** The views the toolbar offers; the three by default. */
  views?: ReadonlyArray<GridView>;
  /** The day in focus, `YYYY-MM-DD`: its day or its week is shown. */
  date?: string;
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  /** Columns per resource in place of per day: with a day view, the columns of one day. */
  resources?: ReadonlyArray<TimeGridResource>;
  /** The local moment, `YYYY-MM-DDTHH:mm`, for the ember line. Defaults to the device's clock. */
  now?: string;
  /** The hours drawn, `[from, to]`, from 0 to 24. Default `[0, 24]`. */
  hours?: readonly [number, number];
  /** The hour at the top of the screen when the grid appears. Default 7. */
  scrollTo?: number;
  /** The height of an hour, in px. Default 48. */
  hourHeight?: number;
  /** Minutes an event moves, grows or is created by. Default 15. */
  step?: number;
  /** Minutes of an event created by a double click or Enter. Default 60. */
  defaultDuration?: number;
  /**
   * The hours of work: seven lists of spans (Monday first, like `Availability.weekly`), or a
   * function of the date and the resource. What is outside them is hatched.
   */
  workingHours?:
    | ReadonlyArray<ReadonlyArray<TimeSpan>>
    | ((date: string, resource?: string) => ReadonlyArray<TimeSpan>);
  /** Written in 12 hours with AM and PM. */
  hour12?: boolean;
  /** The current event. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** A click or Enter on an event. */
  onOpen?: (id: string) => void;
  /** Makes empty space able to create: drag, double click, or Enter on a column. */
  onCreate?: (slot: TimeGridChange) => void;
  /** Makes events movable and resizable: by pointer, or by the arrows (Shift resizes). */
  onChange?: (id: string, change: TimeGridChange) => void;
  /** Today, the arrows, the title and the views above the grid; on by default. */
  toolbar?: boolean;
  /** Always show the all-day row, even with nothing in it. Default: only when it has records. */
  allDayRow?: boolean;
  /** Names the grid for assistive technology. */
  label?: string;
}

type RootAttrs = Omit<Part<ComponentProps<"div">>, "children" | "onChange"> & { asChild?: boolean };

export interface TimeGridProps<T> extends TimeGridBase<T>, RootAttrs {
  /** Given, `TimeGrid` is the root of the parts. */
  children?: undefined;
}

export interface TimeGridRootProps<T> extends TimeGridBase<T>, RootAttrs {
  children: ReactNode;
}

const VIEWS: Record<GridView, string> = { day: "Day", workweek: "Work week", week: "Week" };
const NAMES: Record<GridView, string> = { day: "day", workweek: "week", week: "week" };

const read = (record: unknown, name: string): unknown =>
  record !== null && typeof record === "object"
    ? (record as Record<string, unknown>)[name]
    : undefined;
const text = (record: unknown, name: string): string | undefined => {
  const v = read(record, name);
  return typeof v === "string" && v !== "" ? v : undefined;
};

interface TimeGridState {
  date: string;
  setDate: (date: string) => void;
  today: string;
  view: GridView;
  setView: (view: GridView) => void;
  views: ReadonlyArray<GridView>;
  /** The days of the view. */
  days: string[];
  /** "Wed, 18 November 2026", or "16 Nov – 20 Nov, 2026". */
  title: string;
  /** "day" or "week": what the arrows step by. */
  unit: string;
  /** The props the grid inside draws from. */
  grid: Omit<EventGridProps, "children" | "label"> & { label: string };
}

const TimeGridContext = createContext<TimeGridState | null>(null);

/** The state of the `TimeGrid` a part sits in: the date, the view, the days and the title. */
export function useTimeGrid(part = "useTimeGrid"): TimeGridState {
  const state = useContext(TimeGridContext);
  if (!state) throw new Error(`${part} goes inside a TimeGrid.`);
  return state;
}

/**
 * Events on a grid of hours, for a day, a work week or a week, or for the resources of a day.
 * Drag empty space to create (`onCreate`), an event to move it or its foot to resize it
 * (`onChange`); the arrows move an event, Shift and the arrows resize it, Enter opens it.
 */
export function TimeGrid<T>(props: TimeGridProps<T> | TimeGridRootProps<T>) {
  const {
    records,
    getDate,
    getEndDate,
    getStart,
    getEnd,
    getAllDay,
    getResource,
    renderEvent,
    renderAllDay,
    view: viewProp,
    defaultView,
    onViewChange,
    views = ["day", "workweek", "week"],
    date: dateProp,
    defaultDate,
    onDateChange,
    resources,
    now,
    step = 15,
    toolbar = true,
    label = "Schedule",
    className,
    asChild,
    children,
    getId,
    getLabel,
    getColor,
    hours,
    scrollTo,
    hourHeight,
    defaultDuration,
    workingHours,
    hour12,
    selected,
    defaultSelected,
    onSelectedChange,
    onOpen,
    onCreate,
    onChange,
    allDayRow,
    ...rest
  } = props;
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = now !== undefined ? now.slice(0, 10) : deviceToday;
  const acc = resolveAccessors({
    ...(getId ? { getId } : {}),
    ...(getLabel ? { getLabel } : {}),
    ...(getColor ? { getColor } : {}),
  });
  const stepMin = Math.max(1, Math.floor(step));

  const [date, setDate] = useControllableState<string>({
    value: dateProp,
    defaultValue: defaultDate ?? today,
    onChange: onDateChange,
  });
  const [view, setView] = useControllableState<GridView>({
    value: viewProp,
    defaultValue: defaultView ?? (resources ? "day" : "workweek"),
    onChange: onViewChange,
  });

  const events: EventGridEvent[] = [];
  for (const record of records) {
    const d = (getDate ? getDate(record) : text(record, "date")) ?? null;
    if (!d) continue;
    const allDay = getAllDay ? getAllDay(record) : read(record, "allDay") === true;
    const s = toMinutes((getStart ? getStart(record) : text(record, "start")) ?? null);
    const e = toMinutes((getEnd ? getEnd(record) : text(record, "end")) ?? null);
    if (!allDay && s === null) continue;
    const last = (getEndDate ? getEndDate(record) : text(record, "endDate")) ?? d;
    const color = acc.color(record);
    const resource = (getResource ? getResource(record) : text(record, "resource")) ?? undefined;
    events.push({
      id: acc.id(record),
      label: acc.label(record),
      ...(color ? { color } : {}),
      date: d,
      endDate: last < d ? d : last,
      start: s ?? 0,
      end: e !== null && s !== null && e > s ? e : (s ?? 0) + stepMin,
      ...(allDay ? { allDay } : {}),
      ...(resource !== undefined ? { resource } : {}),
      data: record,
    });
  }

  const days = resources && view === "day" ? [date] : viewDays(date, view);
  const title =
    days.length === 1
      ? formatLong(days[0]!)
      : `${formatShort(days[0]!)} – ${formatShort(days[days.length - 1]!)}, ${parseIso(days[days.length - 1]!).getFullYear()}`;

  const state: TimeGridState = {
    date,
    setDate,
    today,
    view,
    setView,
    views,
    days,
    title,
    unit: NAMES[view],
    grid: {
      days,
      events,
      ...(resources ? { resources } : {}),
      ...(renderEvent ? { renderEvent: (e, info) => renderEvent(e.data as T, info) } : {}),
      ...(renderAllDay ? { renderAllDay: (e) => renderAllDay(e.data as T) } : {}),
      ...(now !== undefined ? { now } : {}),
      ...(hours ? { hours } : {}),
      ...(scrollTo !== undefined ? { scrollTo } : {}),
      ...(hourHeight !== undefined ? { hourHeight } : {}),
      step: stepMin,
      ...(defaultDuration !== undefined ? { defaultDuration } : {}),
      ...(workingHours ? { workingHours } : {}),
      ...(hour12 !== undefined ? { hour12 } : {}),
      ...(selected !== undefined ? { selected } : {}),
      ...(defaultSelected !== undefined ? { defaultSelected } : {}),
      ...(onSelectedChange ? { onSelectedChange } : {}),
      ...(onOpen ? { onOpen } : {}),
      ...(onCreate ? { onCreate } : {}),
      ...(onChange ? { onChange } : {}),
      ...(allDayRow !== undefined ? { allDayRow } : {}),
      onPage: (by) => setDate(stepView(date, view, by)),
      onReveal: setDate,
      label: `${label}, ${title}`,
    },
  };

  return (
    <TimeGridContext.Provider value={state}>
      {renderPart("div", cx("fg-tg", className), asChild, {
        "data-slot": "time-grid",
        ...rest,
        children: children ?? (
          <>
            {toolbar ? <TimeGridToolbar /> : null}
            <TimeGridBody />
          </>
        ),
      })}
    </TimeGridContext.Provider>
  );
}

type Parted<T> = Part<T> & { asChild?: boolean };

/** Today, the arrows and the title on the left, the views on the right. */
export function TimeGridToolbar({ children, ...rest }: Parted<ComponentProps<"div">>) {
  const g = useTimeGrid("TimeGridToolbar");
  return (
    <PeriodNav data-slot="time-grid-toolbar" {...rest}>
      {children ?? (
        <>
          <PeriodNavGroup>
            <TimeGridToday />
            <TimeGridPrevious />
            <TimeGridNext />
            <TimeGridTitle />
            {g.view !== "day" ? <TimeGridWeekNumber /> : null}
          </PeriodNavGroup>
          {g.views.length > 1 ? <TimeGridViews /> : null}
        </>
      )}
    </PeriodNav>
  );
}

/** Goes back to today. */
export function TimeGridToday({ onClick, ...rest }: Part<ComponentProps<"button">>) {
  const g = useTimeGrid("TimeGridToday");
  return (
    <PeriodNavToday
      data-slot="time-grid-today"
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) g.setDate(g.today);
      }}
    />
  );
}

/** The period before: the day before, or the week before. */
export function TimeGridPrevious({ onClick, ...rest }: Part<ComponentProps<"button">>) {
  const g = useTimeGrid("TimeGridPrevious");
  return (
    <PeriodNavPrevious
      data-slot="time-grid-previous"
      label={`Previous ${g.unit}`}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) g.setDate(stepView(g.date, g.view, -1));
      }}
    />
  );
}

/** The period after. */
export function TimeGridNext({ onClick, ...rest }: Part<ComponentProps<"button">>) {
  const g = useTimeGrid("TimeGridNext");
  return (
    <PeriodNavNext
      data-slot="time-grid-next"
      label={`Next ${g.unit}`}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) g.setDate(stepView(g.date, g.view, 1));
      }}
    />
  );
}

/** The day or the stretch of days shown. */
export function TimeGridTitle({ children, ...rest }: Parted<ComponentProps<"span">>) {
  const g = useTimeGrid("TimeGridTitle");
  return (
    <PeriodNavTitle data-slot="time-grid-title" {...rest}>
      {children ?? g.title}
    </PeriodNavTitle>
  );
}

/** "W47": the number of the week shown. */
export function TimeGridWeekNumber({ children, ...rest }: Parted<ComponentProps<"span">>) {
  const g = useTimeGrid("TimeGridWeekNumber");
  return (
    <PeriodNavBadge data-slot="time-grid-week-number" {...rest}>
      {children ?? `W${isoWeek(g.days[0]!)}`}
    </PeriodNavBadge>
  );
}

/** The switch of views: day, work week, week. */
export function TimeGridViews({
  views: only,
  className,
}: {
  /** The views offered; the grid's `views` by default. */
  views?: ReadonlyArray<GridView>;
  className?: string;
}) {
  const g = useTimeGrid("TimeGridViews");
  return (
    <Segmented
      label="View"
      {...(className ? { className } : {})}
      options={(only ?? g.views).map((v) => ({ value: v, label: VIEWS[v] }))}
      value={g.view}
      onChange={(v) => g.setView(v as GridView)}
    />
  );
}

/** The grid of hours: the `EventGrid` of this agenda. Give it `EventGrid` parts to draw it yourself. */
export function TimeGridBody({
  children,
  ...rest
}: Omit<EventGridProps, "days" | "events" | "children"> & { children?: ReactNode }) {
  const { grid } = useTimeGrid("TimeGridBody");
  const merged = { ...grid, ...rest };
  return children !== undefined ? (
    <EventGrid {...(merged as EventGridRootProps)}>{children}</EventGrid>
  ) : (
    <EventGrid {...(merged as EventGridProps)} />
  );
}
