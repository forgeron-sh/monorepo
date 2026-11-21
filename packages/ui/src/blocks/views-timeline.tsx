// The timeline of a list view, after the project timeline of the owner's Linear clone, drawn in the
// lab language: a sticky column of names, a two-row axis in mono capitals, records as flat bars
// with a coloured edge, points for what only has a due date, pixel diamonds for milestones,
// hatched weekends and one ember line for today. Zoom by weeks, months or quarters.
//
// Two ways to use it. With props it is the whole timeline. With children it is the root of the
// parts:
//
//   <Timeline groups={groups} onChange={move}>
//     <TimelineToolbar />
//     <TimelineScroller />
//   </Timeline>
//
// `TimelineToolbar` is Today and the zoom (`TimelineToday`, `TimelineZoomControl`).
// `TimelineScroller` is the scrolling region; it draws a `TimelineCanvas`: the axis
// (`TimelineHeader`), what lies under the rows (`TimelineLayer`) and the rows (`TimelineRows`).
// Draw a row yourself with `<TimelineRows>{(row) => …}</TimelineRows>`: a section is a
// `TimelineGroupRow`, a record a `TimelineRow` made of a `TimelineLabel` and a `TimelineTrack` that
// holds a `TimelineBar` or `TimelinePoint` and its `TimelineDiamond`s.

import { ArrowDown01Icon, DiamondFillIcon, DiamondIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { addDays, addMonths, formatShort, MONTHS, parseIso, toIso, weekday } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { PeriodNav, PeriodNavToday } from "../period-nav";
import { renderPart, type Part } from "../part";
import {
  daysBetween,
  defaultLabel,
  isoWeek,
  monthStart,
  fieldDay,
  resolveAccessors,
  textField,
  type RecordFieldProps,
  type RecordAccessors,
} from "./views-parts";
import { recordGroups } from "./records-fields";

/* ------------------------------------------------------------------ geometry (pure) */

/** How much time a screen holds: a day is 28px by weeks, 6px by months, 2px by quarters. */
export type TimelineZoom = "weeks" | "months" | "quarters";

const PX: Record<TimelineZoom, number> = { weeks: 28, months: 6, quarters: 2 };

/** The width of one day, in px, at a zoom. */
export const timelinePxPerDay = (zoom: TimelineZoom) => PX[zoom];

/** The days drawn, both included. */
export interface TimelineRange {
  start: string;
  end: string;
  days: number;
}

const endOfMonth = (iso: string) => addDays(addMonths(monthStart(iso), 1), -1);
const quarterStart = (iso: string) => {
  const d = parseIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth() - (d.getMonth() % 3), 1));
};

/**
 * The days a timeline draws: every date given and today, from the start of the first week (Monday
 * first), month or quarter, to one more week, month or quarter after the last; at least six
 * weeks, six months or four quarters long. Starting close to the first date keeps the bars in
 * view when the page is drawn without script, scrolled to the left.
 */
export function timelineRange(
  dates: ReadonlyArray<string>,
  today: string,
  zoom: TimelineZoom,
): TimelineRange {
  let min = today;
  let max = today;
  for (const d of dates) {
    if (d < min) min = d;
    if (d > max) max = d;
  }
  let start: string;
  let end: string;
  if (zoom === "weeks") {
    start = addDays(min, -weekday(min));
    const hi = addDays(max, 7);
    end = addDays(hi, 6 - weekday(hi));
    if (daysBetween(start, end) < 41) end = addDays(start, 41);
  } else if (zoom === "months") {
    start = monthStart(min);
    end = endOfMonth(addMonths(max, 1));
    if (end < endOfMonth(addMonths(start, 5))) end = endOfMonth(addMonths(start, 5));
  } else {
    start = quarterStart(min);
    end = addDays(quarterStart(addMonths(max, 6)), -1);
    if (end < endOfMonth(addMonths(start, 11))) end = endOfMonth(addMonths(start, 11));
  }
  return { start, end, days: daysBetween(start, end) + 1 };
}

/** Where a record sits: a bar from the start of `start` to the end of `end`, or a point. */
export interface TimelinePlace {
  kind: "bar" | "point";
  /** From the left edge of the range, in px. A point's `x` is the middle of its day. */
  x: number;
  width: number;
}

/** The place of a record with these dates, or null without any date. */
export function timelinePlace(
  start: string | null | undefined,
  end: string | null | undefined,
  range: TimelineRange,
  zoom: TimelineZoom,
): TimelinePlace | null {
  const px = PX[zoom];
  const xOf = (iso: string) => daysBetween(range.start, iso) * px;
  if (start && end) {
    const from = end < start ? end : start;
    return { kind: "bar", x: xOf(from), width: (Math.abs(daysBetween(start, end)) + 1) * px };
  }
  const only = start ?? end;
  return only ? { kind: "point", x: xOf(only) + px / 2, width: 0 } : null;
}

interface Span {
  key: string;
  label: string;
  x: number;
  width: number;
  dim?: boolean;
}

interface Axis {
  top: Span[];
  bottom: Span[];
  lines: { x: number; strong: boolean }[];
  weekends: { x: number; width: number }[];
}

const SHORT = MONTHS.map((m) => m.slice(0, 3).toUpperCase());

function timelineAxis(range: TimelineRange, zoom: TimelineZoom, weekNumbers: boolean): Axis {
  const px = PX[zoom];
  const xOf = (iso: string) => daysBetween(range.start, iso) * px;
  const axis: Axis = { top: [], bottom: [], lines: [], weekends: [] };
  // Months, whole or cut by the range.
  for (let m = monthStart(range.start); m <= range.end; m = addMonths(m, 1)) {
    const from = m < range.start ? range.start : m;
    const to = endOfMonth(m) > range.end ? range.end : endOfMonth(m);
    const x = xOf(from);
    const width = (daysBetween(from, to) + 1) * px;
    const month = parseIso(m).getMonth();
    const year = m.slice(0, 4);
    const first = axis.top.length === 0;
    if (zoom === "quarters") {
      if (month % 3 === 0 || first) {
        axis.top.push({
          key: m,
          label: `Q${Math.floor(month / 3) + 1} ${year}`,
          x,
          width: (daysBetween(from, endOfMonth(addMonths(quarterStart(m), 2))) + 1) * px,
        });
      }
      axis.bottom.push({ key: m, label: SHORT[month]!, x, width });
      if (m >= range.start) axis.lines.push({ x, strong: month % 3 === 0 });
    } else {
      axis.top.push({
        key: m,
        label: month === 0 || first ? `${SHORT[month]} ${year}` : SHORT[month]!,
        x,
        width,
      });
      if (m > range.start) axis.lines.push({ x, strong: true });
    }
  }
  if (zoom === "quarters") return axis;
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) {
    const wd = weekday(d);
    const x = xOf(d);
    const day = String(parseIso(d).getDate());
    if (zoom === "weeks") {
      axis.bottom.push({ key: d, label: day, x, width: px, dim: wd > 4 });
      if (wd === 5) axis.weekends.push({ x, width: 2 * px });
      if (wd === 0 && d.slice(8) !== "01" && d !== range.start)
        axis.lines.push({ x, strong: false });
    } else if (wd === 0) {
      axis.bottom.push({ key: d, label: weekNumbers ? `W${isoWeek(d)}` : day, x, width: 7 * px });
    }
  }
  return axis;
}

/* ------------------------------------------------------------------ the block */

/** A diamond on a record's row: a release, a review, a step of a project. */
export interface TimelineMilestone {
  id: string;
  label: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** Reached: the diamond is filled in ember. */
  done?: boolean;
}

/** A section of rows: the shape of `useListView`'s groups. */
export interface TimelineGroup<T> {
  key: string;
  name: string;
  /** A mark before the name: a status, an avatar. */
  glyph?: ReactNode;
  records: ReadonlyArray<T>;
}

/** The dates of a record after a move: either may be absent. */
export interface TimelineDates {
  start: string | null;
  end: string | null;
}

export interface TimelineHandle {
  /** Scrolls today's line into view, a third from the left of the dates. */
  scrollToToday: () => void;
}

interface TimelineBase<T> extends RecordAccessors<T>, RecordFieldProps<T> {
  /** The rows in sections, e.g. `useListView(...).groups`. A single group keyed `all` has no header. */
  groups?: ReadonlyArray<TimelineGroup<T>>;
  /** The rows without sections, when there are no `groups`. */
  records?: ReadonlyArray<T>;
  /** The first day, `YYYY-MM-DD`: `record.start` by default. */
  getStart?: (record: T) => string | null | undefined;
  /** The last day: `record.end`, else `record.due`, else `record.target`. Alone, it is a point. */
  getEnd?: (record: T) => string | null | undefined;
  /** With `fields`: the date fields of the first and the last day; `getStart` and `getEnd` win. */
  startField?: string;
  endField?: string;
  /** With `fields`, and no `groups`: the field the rows are sectioned by (a status, a lead). */
  groupField?: string;
  /** Diamonds on the row: `record.milestones` by default. */
  getMilestones?: (record: T) => ReadonlyArray<TimelineMilestone> | undefined;
  /** The content of the name cell; the identifier and title of an issue by default. */
  renderLabel?: (record: T) => ReactNode;
  /** The content of a bar; its label by default. */
  renderBar?: (record: T) => ReactNode;
  zoom?: TimelineZoom;
  defaultZoom?: TimelineZoom;
  onZoomChange?: (zoom: TimelineZoom) => void;
  /** `YYYY-MM-DD`: the ember line. Defaults to the device's date. */
  today?: string;
  /** The current row; the arrows move it. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** A click or Enter on a row or its bar. */
  onOpen?: (id: string) => void;
  /**
   * Makes the dates editable: drag a bar to move it, its edges to change a date; or Alt and the
   * arrows on a row (a day by weeks, a week otherwise), with Shift for the end alone.
   */
  onChange?: (id: string, dates: TimelineDates) => void;
  /** The keys of the folded sections. */
  collapsed?: ReadonlyArray<string>;
  defaultCollapsed?: ReadonlyArray<string>;
  onCollapsedChange?: (keys: string[]) => void;
  /** The Today button and the zoom above the timeline; on by default. */
  toolbar?: boolean;
  /** Week numbers instead of the dates of Mondays, by months. */
  weekNumbers?: boolean;
  /** The width of the name column, in px. */
  labelWidth?: number;
  /** Shown when there is no record. */
  empty?: ReactNode;
  /** Names the timeline for assistive technology. */
  label?: string;
  ref?: Ref<TimelineHandle>;
}

type RootAttrs = Omit<Part<ComponentProps<"div">>, "children" | "onChange" | "ref"> & {
  asChild?: boolean;
};

export interface TimelineProps<T> extends TimelineBase<T>, RootAttrs {
  /** Given, `Timeline` is the root of the parts. */
  children?: undefined;
}

export interface TimelineRootProps<T> extends TimelineBase<T>, RootAttrs {
  children: ReactNode;
}

const ZOOMS = [
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "quarters", label: "Quarters" },
];

const ROW = "[data-record]";

/** A row of the timeline: a section's header, or a record. */
export type TimelineRowData<T> =
  | { kind: "group"; key: string; name: string; glyph?: ReactNode; open: boolean; size: number }
  | { kind: "record"; key: string; record: T };

interface Drag {
  id: string;
  mode: "move" | "start" | "end";
  x0: number;
  s0: string | null;
  e0: string | null;
  start: string | null;
  end: string | null;
  moved: boolean;
}

const scrollTo = (el: HTMLElement | null, labelWidth: number, smooth: boolean) => {
  if (!el) return;
  const x = Number(el.dataset.todayX ?? 0);
  const left = Math.max(0, x - (el.clientWidth - labelWidth) / 3);
  if (smooth && typeof el.scrollTo === "function") el.scrollTo({ left, behavior: "smooth" });
  else el.scrollLeft = left;
};

interface TimelineState {
  zoom: TimelineZoom;
  setZoom: (zoom: TimelineZoom) => void;
  range: TimelineRange;
  px: number;
  axis: Axis;
  today: string;
  todayX: number;
  rows: ReadonlyArray<TimelineRowData<unknown>>;
  hasRecords: boolean;
  current: string | null;
  /** The row that is the tab stop. */
  stop: string | undefined;
  editable: boolean;
  step: number;
  labelWidth: number;
  hintId: string;
  empty: ReactNode;
  label: string;
  scroller: RefObject<HTMLDivElement | null>;
  scrollToToday: () => void;
  acc: ReturnType<typeof resolveAccessors<unknown>>;
  datesOf: (record: unknown) => TimelineDates;
  milestonesOf: (record: unknown) => ReadonlyArray<TimelineMilestone>;
  describe: (dates: TimelineDates) => string;
  short: (iso: string) => string;
  renderLabel: ((record: unknown) => ReactNode) | undefined;
  renderBar: ((record: unknown) => ReactNode) | undefined;
  open: (id: string) => void;
  toggleGroup: (key: string, open: boolean) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  grab: (event: PointerEvent<HTMLElement>, record: unknown, mode: Drag["mode"]) => void;
  dragHandlers: (record: unknown) => {
    onPointerDown: (e: PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
  clickBar: (id: string) => void;
}

const TimelineContext = createContext<TimelineState | null>(null);

/** The state of the `Timeline` a part sits in: the zoom, the range, the rows and the selection. */
export function useTimeline(part = "useTimeline"): TimelineState {
  const state = useContext(TimelineContext);
  if (!state) throw new Error(`${part} goes inside a Timeline.`);
  return state;
}

/**
 * Records as bars on a time axis, in sections, with a sticky column of names. The arrows move
 * between rows, Enter opens; with `onChange`, bars move by drag or by Alt and the arrows.
 */
export function Timeline<T>(props: TimelineProps<T> | TimelineRootProps<T>) {
  const {
    groups,
    records,
    getStart,
    getEnd,
    startField,
    endField,
    groupField,
    getMilestones,
    renderLabel,
    renderBar,
    zoom: zoomProp,
    defaultZoom = "months",
    onZoomChange,
    today: todayProp,
    selected,
    defaultSelected = null,
    onSelectedChange,
    onOpen,
    onChange,
    collapsed,
    defaultCollapsed = [],
    onCollapsedChange,
    toolbar = true,
    weekNumbers = false,
    labelWidth = 240,
    empty = "Nothing to place on the timeline",
    label = "Timeline",
    className,
    asChild,
    children,
    ref,
    style,
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
  const acc = resolveAccessors<T>({
    ...(getId ? { getId } : {}),
    ...(getLabel ? { getLabel } : {}),
    ...(getColor ? { getColor } : {}),
    ...(fields ? { fields } : {}),
    ...(context ? { context } : {}),
    ...(labelField ? { labelField } : {}),
    ...(markField ? { markField } : {}),
  });
  const dateOf = (field: string | undefined, r: T) =>
    fields && field ? fieldDay(fields, field, r) : undefined;
  const startOf = (r: T) =>
    (getStart ? getStart(r) : (dateOf(startField, r) ?? textField(r, "start"))) ?? null;
  const endOf = (r: T) =>
    (getEnd
      ? getEnd(r)
      : (dateOf(endField, r) ??
        textField(r, "end") ??
        textField(r, "due") ??
        textField(r, "target"))) ?? null;
  const milestonesOf = (r: T): ReadonlyArray<TimelineMilestone> => {
    if (getMilestones) return getMilestones(r) ?? [];
    const m = (r as { milestones?: unknown }).milestones;
    return Array.isArray(m) ? (m as TimelineMilestone[]) : [];
  };

  const [zoom, setZoom] = useControllableState<TimelineZoom>({
    value: zoomProp,
    defaultValue: defaultZoom,
    onChange: onZoomChange,
  });
  const [current, select] = useControllableState<string | null>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (id) => {
      if (id !== null) onSelectedChange?.(id);
    },
  });
  const [foldedKeys, setFolded] = useControllableState<ReadonlyArray<string>>({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: (keys) => onCollapsedChange?.([...keys]),
  });
  const folded = new Set(foldedKeys);
  const [drag, setDrag] = useState<Drag | null>(null);
  const clickAfterDrag = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const hintId = useId();

  const sections: ReadonlyArray<TimelineGroup<T>> =
    groups ??
    (fields && groupField
      ? recordGroups(fields, records ?? [], groupField, context)
      : [{ key: "all", name: label, records: records ?? [] }]);
  const headed = !(sections.length === 1 && sections[0]!.key === "all");
  const rows: TimelineRowData<T>[] = [];
  for (const g of sections) {
    const open = !folded.has(g.key);
    if (headed) {
      rows.push({
        kind: "group",
        key: g.key,
        name: g.name,
        glyph: g.glyph,
        open,
        size: g.records.length,
      });
    }
    if (open || !headed)
      for (const r of g.records) rows.push({ kind: "record", key: acc.id(r), record: r });
  }
  const all = sections.flatMap((g) => g.records);

  const datesOf = (r: T): TimelineDates => {
    const id = acc.id(r);
    if (drag && drag.id === id) return { start: drag.start, end: drag.end };
    return { start: startOf(r), end: endOf(r) };
  };
  const range = timelineRange(
    all.flatMap((r) => {
      const { start, end } = datesOf(r);
      return [start, end, ...milestonesOf(r).map((m) => m.date)].filter(
        (d): d is string => typeof d === "string",
      );
    }),
    today,
    zoom,
  );
  const px = PX[zoom];
  const width = range.days * px;
  const axis = timelineAxis(range, zoom, weekNumbers);
  const todayX = daysBetween(range.start, today) * px + px / 2;
  const step = zoom === "weeks" ? 1 : 7;

  useEffect(() => scrollTo(scroller.current, labelWidth, false), [zoom, labelWidth]);
  const scrollToToday = () => scrollTo(scroller.current, labelWidth, true);
  useImperativeHandle(ref, () => ({ scrollToToday }));

  const visible = rows.flatMap((r) => (r.kind === "record" ? [r.key] : []));
  const stop = current !== null && visible.includes(current) ? current : visible[0];
  const thisYear = parseIso(today).getFullYear();
  const short = (iso: string) => formatShort(iso, thisYear);

  const describe = ({ start, end }: TimelineDates) =>
    start && end
      ? `${short(start)} to ${short(end)}`
      : end
        ? `due ${short(end)}`
        : start
          ? `from ${short(start)}`
          : "no dates";

  /** Moves a record's dates by `delta` days; `endOnly` changes the end of a bar alone. */
  const shift = (r: T, delta: number, endOnly: boolean) => {
    const { start, end } = { start: startOf(r), end: endOf(r) };
    if (!onChange || (!start && !end)) return;
    if (endOnly && start && end) {
      const next = addDays(end, delta);
      if (next >= start) onChange(acc.id(r), { start, end: next });
      return;
    }
    onChange(acc.id(r), {
      start: start ? addDays(start, delta) : null,
      end: end ? addDays(end, delta) : null,
    });
  };

  const open = (id: string) => {
    select(id);
    onOpen?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>(ROW);
    if (!row) return;
    const id = row.dataset.record!;
    if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      const record = all.find((r) => acc.id(r) === id);
      if (!record || !onChange) return;
      event.preventDefault();
      shift(record, (event.key === "ArrowLeft" ? -1 : 1) * step, event.shiftKey);
      return;
    }
    const list = [...event.currentTarget.querySelectorAll<HTMLElement>(ROW)];
    const at = list.indexOf(row);
    const to =
      event.key === "ArrowDown"
        ? at + 1
        : event.key === "ArrowUp"
          ? at - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? list.length - 1
              : null;
    if (to === null) return;
    event.preventDefault();
    const next = list[Math.min(Math.max(to, 0), list.length - 1)];
    if (!next) return;
    next.focus();
    const nextId = next.dataset.record!;
    select(nextId);
    [...event.currentTarget.querySelectorAll<HTMLElement>("[data-bar]")]
      .find((bar) => bar.dataset.bar === nextId)
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };

  const grab = (event: PointerEvent<HTMLElement>, r: T, mode: Drag["mode"]) => {
    if (!onChange || event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const s = startOf(r);
    const e = endOf(r);
    setDrag({
      id: acc.id(r),
      mode,
      x0: event.clientX,
      s0: s,
      e0: e,
      start: s,
      end: e,
      moved: false,
    });
  };
  const follow = (event: PointerEvent<HTMLElement>) => {
    if (!drag) return;
    const dx = event.clientX - drag.x0;
    const d = Math.round(dx / px);
    const { s0, e0, mode } = drag;
    let start = s0;
    let end = e0;
    if (mode === "move") {
      start = s0 ? addDays(s0, d) : null;
      end = e0 ? addDays(e0, d) : null;
    } else if (mode === "start" && s0 && e0) {
      start = addDays(s0, d) > e0 ? e0 : addDays(s0, d);
    } else if (mode === "end" && s0 && e0) {
      end = addDays(e0, d) < s0 ? s0 : addDays(e0, d);
    }
    const moved = drag.moved || Math.abs(dx) > 3;
    if (start !== drag.start || end !== drag.end || moved !== drag.moved)
      setDrag({ ...drag, start, end, moved });
  };
  const drop = () => {
    if (!drag) return;
    if (drag.moved) {
      clickAfterDrag.current = true;
      if (drag.start !== drag.s0 || drag.end !== drag.e0)
        onChange?.(drag.id, { start: drag.start, end: drag.end });
    }
    setDrag(null);
  };

  const state: TimelineState = {
    zoom,
    setZoom,
    range,
    px,
    axis,
    today,
    todayX,
    rows: rows as ReadonlyArray<TimelineRowData<unknown>>,
    hasRecords: all.length > 0,
    current,
    stop,
    editable: onChange !== undefined,
    step,
    labelWidth,
    hintId,
    empty,
    label,
    scroller,
    scrollToToday,
    acc: acc as ReturnType<typeof resolveAccessors<unknown>>,
    datesOf: datesOf as (record: unknown) => TimelineDates,
    milestonesOf: milestonesOf as (record: unknown) => ReadonlyArray<TimelineMilestone>,
    describe,
    short,
    renderLabel: renderLabel as ((record: unknown) => ReactNode) | undefined,
    renderBar: renderBar as ((record: unknown) => ReactNode) | undefined,
    open,
    toggleGroup: (key, isOpen) =>
      setFolded(isOpen ? [...folded, key] : [...folded].filter((k) => k !== key)),
    onKeyDown,
    grab: grab as TimelineState["grab"],
    dragHandlers: ((r: T) => ({
      onPointerDown: (e: PointerEvent<HTMLElement>) => grab(e, r, "move"),
      onPointerMove: follow,
      onPointerUp: drop,
      onPointerCancel: () => setDrag(null),
    })) as TimelineState["dragHandlers"],
    clickBar: (id) => {
      if (clickAfterDrag.current) {
        clickAfterDrag.current = false;
        return;
      }
      open(id);
    },
  };

  return (
    <TimelineContext.Provider value={state}>
      {renderPart(
        "div",
        cx("fg-tl", `fg-tl-${zoom}`, drag && "fg-tl-dragging", className),
        asChild,
        {
          "data-slot": "timeline",
          style: {
            "--fg-tl-label": `${labelWidth}px`,
            "--fg-tl-w": `${width}px`,
            ...style,
          } as CSSProperties,
          ...rest,
          children:
            children ??
            (all.length === 0 ? (
              <TimelineEmpty />
            ) : (
              <>
                {toolbar ? <TimelineToolbar /> : null}
                <TimelineScroller />
              </>
            )),
        },
      )}
    </TimelineContext.Provider>
  );
}

type Parted<T> = Part<T> & { asChild?: boolean };

/** Shown when there is no record: the timeline's `empty`. */
export function TimelineEmpty({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useTimeline("TimelineEmpty");
  return renderPart("div", cx("fg-tl-empty", className), asChild, {
    "data-slot": "timeline-empty",
    ...rest,
    children: children ?? g.empty,
  });
}

/** Today and the zoom above the timeline. */
export function TimelineToolbar({ className, children, ...rest }: Parted<ComponentProps<"div">>) {
  return (
    <PeriodNav data-slot="timeline-toolbar" {...rest} {...(className ? { className } : {})}>
      {children ?? (
        <>
          <TimelineToday />
          <TimelineZoomControl />
        </>
      )}
    </PeriodNav>
  );
}

/** Scrolls today's line into view. */
export function TimelineToday({ onClick, ...rest }: Part<ComponentProps<"button">>) {
  const g = useTimeline("TimelineToday");
  return (
    <PeriodNavToday
      data-slot="timeline-today"
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) g.scrollToToday();
      }}
    />
  );
}

/** The switch of zoom: weeks, months, quarters. */
export function TimelineZoomControl({ className }: { className?: string }) {
  const g = useTimeline("TimelineZoomControl");
  return (
    <Segmented
      label="Zoom"
      {...(className ? { className } : {})}
      options={ZOOMS}
      value={g.zoom}
      onChange={(z) => g.setZoom(z as TimelineZoom)}
    />
  );
}

/** The scrolling region: the arrows move between rows, Alt and the arrows move dates. */
export function TimelineScroller({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useTimeline("TimelineScroller");
  return (
    <>
      {g.editable ? (
        <span id={g.hintId} className="fg-sr">
          Alt and the arrows move the dates, by a {g.step === 1 ? "day" : "week"}; add Shift to move
          the end alone.
        </span>
      ) : null}
      {renderPart("div", cx("fg-tl-scroll", className), asChild, {
        "data-slot": "timeline-scroller",
        ref: g.scroller,
        role: "region",
        "aria-label": g.label,
        "data-today-x": g.todayX,
        ...rest,
        onKeyDown: g.onKeyDown,
        children: children ?? <TimelineCanvas />,
      })}
    </>
  );
}

/** The sheet the axis, the layer and the rows sit on, as wide as the dates. */
export function TimelineCanvas({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  return renderPart("div", cx("fg-tl-canvas", className), asChild, {
    "data-slot": "timeline-canvas",
    ...rest,
    children: children ?? (
      <>
        <TimelineHeader />
        <TimelineLayer />
        <TimelineRows />
      </>
    ),
  });
}

/** The axis: months or quarters above, days, Mondays or months below, and today's pill. */
export function TimelineHeader({ className, asChild, ...rest }: Parted<ComponentProps<"div">>) {
  const g = useTimeline("TimelineHeader");
  const d = parseIso(g.today);
  return renderPart("div", cx("fg-tl-head", className), asChild, {
    "data-slot": "timeline-header",
    ...rest,
    children: (
      <>
        <div className="fg-tl-corner" />
        <div className="fg-tl-axis" aria-hidden="true">
          <div className="fg-tl-axis-row">
            {g.axis.top.map((s) => (
              <span key={s.key} className="fg-tl-unit" style={{ left: s.x, width: s.width }}>
                {s.label}
              </span>
            ))}
          </div>
          <div className="fg-tl-axis-row">
            {g.axis.bottom.map((s) => (
              <span
                key={s.key}
                className={cx("fg-tl-tick", s.dim && "fg-tl-tick-dim")}
                style={{ left: s.x, width: s.width }}
              >
                {s.label}
              </span>
            ))}
          </div>
          <span className="fg-tl-pill" style={{ left: g.todayX }}>
            {SHORT[d.getMonth()]} {d.getDate()}
          </span>
        </div>
      </>
    ),
  });
}

/** What lies under the rows: weekends, rules and the line of today. */
export function TimelineLayer({ className, asChild, ...rest }: Parted<ComponentProps<"div">>) {
  const g = useTimeline("TimelineLayer");
  return renderPart("div", cx("fg-tl-layer", className), asChild, {
    "data-slot": "timeline-layer",
    "aria-hidden": true,
    ...rest,
    children: (
      <>
        {g.axis.weekends.map((w) => (
          <span key={w.x} className="fg-tl-weekend" style={{ left: w.x, width: w.width }} />
        ))}
        {g.axis.lines.map((l) => (
          <span
            key={l.x}
            className={cx("fg-tl-line", l.strong && "fg-tl-line-strong")}
            style={{ left: l.x }}
          />
        ))}
        <span className="fg-tl-today" style={{ left: g.todayX }} />
      </>
    ),
  });
}

/** The rows: a `TimelineGroupRow` per section and a `TimelineRow` per record. */
export function TimelineRows<T = unknown>({
  children,
}: {
  /** Draws a row yourself. */
  children?: (row: TimelineRowData<T>) => ReactNode;
}) {
  const g = useTimeline("TimelineRows");
  return (
    <>
      {(g.rows as ReadonlyArray<TimelineRowData<T>>).map((row) =>
        children ? (
          children(row)
        ) : row.kind === "group" ? (
          <TimelineGroupRow key={`g:${row.key}`} group={row} />
        ) : (
          <TimelineRow key={row.key} record={row.record} />
        ),
      )}
    </>
  );
}

export interface TimelineGroupRowProps extends Omit<Parted<ComponentProps<"div">>, "children"> {
  group: Extract<TimelineRowData<unknown>, { kind: "group" }>;
}

/** The header of a section: a button that folds and unfolds its rows. */
export function TimelineGroupRow({ group, className, asChild, ...rest }: TimelineGroupRowProps) {
  const g = useTimeline("TimelineGroupRow");
  return renderPart("div", cx("fg-tl-row fg-tl-grouprow", className), asChild, {
    "data-slot": "timeline-group-row",
    ...rest,
    children: (
      <>
        <div className="fg-tl-label">
          <button
            type="button"
            className="fg-tl-toggle"
            aria-expanded={group.open}
            onClick={() => g.toggleGroup(group.key, group.open)}
          >
            <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-tl-chevron" />
            {group.glyph}
            <span className="fg-tl-name">{group.name}</span>
          </button>
        </div>
        <div className="fg-tl-track" />
      </>
    ),
  });
}

export interface TimelineRowProps<T> extends Omit<Parted<ComponentProps<"div">>, "children"> {
  record: T;
  /** What the row holds; a `TimelineLabel` and a `TimelineTrack` by default. */
  children?: ReactNode;
}

/** The row of a record: its name on the left, its bar on the track. */
export function TimelineRow<T>({
  record,
  className,
  asChild,
  style,
  children,
  ...rest
}: TimelineRowProps<T>) {
  const g = useTimeline("TimelineRow");
  const color = g.acc.color(record);
  return renderPart(
    "div",
    cx("fg-tl-row", g.acc.id(record) === g.current && "fg-tl-current", className),
    asChild,
    {
      "data-slot": "timeline-row",
      style: { ...(color ? { "--c": color } : {}), ...style } as CSSProperties,
      ...rest,
      children: children ?? (
        <>
          <TimelineLabel record={record} />
          <TimelineTrack record={record} />
        </>
      ),
    },
  );
}

export interface TimelineLabelProps<T> extends Omit<Parted<ComponentProps<"button">>, "children"> {
  record: T;
  /** The content; `renderLabel`, else the mark and the identifier and title. */
  children?: ReactNode;
}

/** The sticky name of a record: the roving tab stop of the rows. */
export function TimelineLabel<T>({
  record,
  className,
  asChild,
  children,
  ...rest
}: TimelineLabelProps<T>) {
  const g = useTimeline("TimelineLabel");
  const id = g.acc.id(record);
  const name = g.acc.label(record);
  const isCurrent = id === g.current;
  return (
    <div className="fg-tl-label">
      {renderPart("button", cx("fg-tl-open", className), asChild, {
        "data-slot": "timeline-label",
        type: "button",
        "data-record": id,
        tabIndex: id === g.stop ? 0 : -1,
        "aria-label": `${name}, ${g.describe(g.datesOf(record))}`,
        "aria-describedby": g.editable ? g.hintId : undefined,
        ...(isCurrent ? { "aria-current": true } : {}),
        onClick: () => g.open(id),
        ...rest,
        children:
          children ??
          (g.renderLabel ? (
            g.renderLabel(record)
          ) : (
            <>
              {g.acc.mark(record)}
              {defaultLabel(record, name, "fg-tl-id")}
            </>
          )),
      })}
    </div>
  );
}

/** The strip of a row the bar sits on. */
export function TimelineTrack<T>({
  record,
  className,
  asChild,
  children,
  ...rest
}: Omit<Parted<ComponentProps<"div">>, "children"> & { record: T; children?: ReactNode }) {
  const g = useTimeline("TimelineTrack");
  return renderPart("div", cx("fg-tl-track", className), asChild, {
    "data-slot": "timeline-track",
    ...rest,
    children: children ?? (
      <>
        <TimelineBar record={record} />
        {g.milestonesOf(record).map((m) => (
          <TimelineDiamond key={m.id} milestone={m} />
        ))}
      </>
    ),
  });
}

/**
 * The bar of a record, from its first to its last day; a point when it has one date only. Drag it
 * to move it, its edges to change a date. Nothing when the record has no date.
 */
export function TimelineBar<T>({
  record,
  className,
  children,
  ...rest
}: Omit<Part<ComponentProps<"div">>, "children"> & { record: T; children?: ReactNode }) {
  const g = useTimeline("TimelineBar");
  const id = g.acc.id(record);
  const name = g.acc.label(record);
  const dates = g.datesOf(record);
  const place = timelinePlace(dates.start, dates.end, g.range, g.zoom);
  const text = children ?? (g.renderBar ? g.renderBar(record) : name);
  if (place?.kind === "bar") {
    return (
      <div
        data-slot="timeline-bar"
        data-bar={id}
        title={`${name}, ${g.describe(dates)}`}
        style={{ left: place.x, width: place.width }}
        onClick={() => g.clickBar(id)}
        {...g.dragHandlers(record)}
        {...rest}
        className={cx("fg-tl-bar", g.editable && "fg-tl-movable", className)}
      >
        {g.editable && place.width >= 3 * g.px && place.width >= 24 ? (
          <>
            <span
              className="fg-tl-grip fg-tl-grip-start"
              onPointerDown={(e) => g.grab(e, record, "start")}
            />
            <span
              className="fg-tl-grip fg-tl-grip-end"
              onPointerDown={(e) => g.grab(e, record, "end")}
            />
          </>
        ) : null}
        <span className="fg-tl-bar-text">{text}</span>
      </div>
    );
  }
  if (place?.kind === "point") {
    return (
      <div
        data-slot="timeline-bar"
        data-bar={id}
        title={`${name}, ${g.describe(dates)}`}
        style={{ left: place.x }}
        onClick={() => g.clickBar(id)}
        {...g.dragHandlers(record)}
        {...rest}
        className={cx("fg-tl-point", g.editable && "fg-tl-movable", className)}
      >
        <span className="fg-tl-dot" />
        <span className="fg-tl-point-text">{text}</span>
      </div>
    );
  }
  return null;
}

/** A milestone of a record: a pixel diamond on its row, filled in ember once reached. */
export function TimelineDiamond({
  milestone: m,
  className,
  ...rest
}: Omit<Part<ComponentProps<"span">>, "children"> & { milestone: TimelineMilestone }) {
  const g = useTimeline("TimelineDiamond");
  return (
    <span
      data-slot="timeline-diamond"
      role="img"
      aria-label={`${m.label}, ${g.short(m.date)}`}
      title={`${m.label}, ${g.short(m.date)}`}
      style={{ left: daysBetween(g.range.start, m.date) * g.px + g.px / 2 }}
      {...rest}
      className={cx("fg-tl-milestone", m.done && "fg-tl-milestone-done", className)}
    >
      <Icon icon={m.done ? DiamondFillIcon : DiamondIcon} size={12} variant="mono" />
    </span>
  );
}
