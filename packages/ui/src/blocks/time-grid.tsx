// The time grid of an agenda, after the Agenda prototype: day, work week or week as columns of
// hours, events laid out side by side where they overlap, an all-day row, one ember line for now,
// hours of work left plain and the rest hatched. Drag on empty space to create, drag an event to
// move it or its foot to resize it (15 minutes at a time); the keyboard does the same.
// Records are read through accessors, so it holds meetings, shifts or bookings alike.

import { ArrowLeft01Icon, ArrowRight01Icon } from "@forgeron/icons";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { formatLong, formatShort, parseIso, toIso, WEEKDAYS, weekday } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { IconButton } from "../identity";
import { formatTime } from "../time";
import {
  clamp,
  fromMinutes,
  layoutOverlaps,
  snapMinutes,
  stepView,
  toMinutes,
  viewDays,
  type GridView,
  type TimeSpan,
} from "./time-model";
import { isoWeek, resolveAccessors, type RecordAccessors } from "./views-parts";

/** The new place of an event, or of one about to be created. */
export interface TimeGridChange {
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm`. */
  start: string;
  /** `HH:mm`; `24:00` is the end of the day. */
  end: string;
  /** The resource column it sits in, when the grid has resources. */
  resource?: string;
  /** The last day of an all-day event that spans several days. */
  endDate?: string;
}

/** A column of the resource variant: a person, a room, a chair. */
export interface TimeGridResource {
  id: string;
  name: string;
  /** A CSS colour for the mark before the name. */
  color?: string;
}

/** What an event knows about itself when it is drawn. */
export interface TimeGridEventInfo {
  date: string;
  start: string;
  end: string;
  /** Short enough for one line. */
  compact: boolean;
}

export interface TimeGridProps<T> extends RecordAccessors<T> {
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
  className?: string;
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

/** The device's local moment as `YYYY-MM-DDTHH:mm`. */
const deviceNow = () => {
  const d = new Date();
  return `${toIso(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

interface Col {
  key: string;
  date: string;
  resource?: string;
  head: string;
  sub: string;
  color?: string;
}

interface Ev<T> {
  record: T;
  id: string;
  label: string;
  color: string | undefined;
  date: string;
  endDate: string;
  start: number;
  end: number;
  allDay: boolean;
  resource: string | undefined;
}

type Preview =
  | { kind: "move" | "resize"; id: string; col: string; start: number; end: number }
  | { kind: "create"; col: string; start: number; end: number };

interface DragState {
  kind: "move" | "resize" | "create";
  id: string;
  x0: number;
  y0: number;
  col0: number;
  start0: number;
  end0: number;
  anchor: number;
  moved: boolean;
  stop: () => void;
}

const THRESHOLD = 4;

/** What a span list leaves free inside `[from, to]`, in minutes. */
function outside(spans: ReadonlyArray<TimeSpan>, from: number, to: number) {
  const open = spans
    .map((s) => [toMinutes(s.start), toMinutes(s.end)] as const)
    .filter((s): s is readonly [number, number] => s[0] !== null && s[1] !== null && s[1] > s[0])
    .sort((a, b) => a[0] - b[0]);
  const gaps: [number, number][] = [];
  let at = from;
  for (const [a, b] of open) {
    if (a > at) gaps.push([at, Math.min(a, to)]);
    at = Math.max(at, b);
    if (at >= to) break;
  }
  if (at < to) gaps.push([at, to]);
  return gaps.filter(([a, b]) => b > a);
}

/**
 * Events on a grid of hours, for a day, a work week or a week, or for the resources of a day.
 * Drag empty space to create (`onCreate`), an event to move it or its foot to resize it
 * (`onChange`); the arrows move an event, Shift and the arrows resize it, Enter opens it.
 */
export function TimeGrid<T>({
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
  now: nowProp,
  hours = [0, 24],
  scrollTo = 7,
  hourHeight = 48,
  step = 15,
  defaultDuration = 60,
  workingHours,
  hour12 = false,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onOpen,
  onCreate,
  onChange,
  toolbar = true,
  allDayRow,
  label = "Schedule",
  className,
  ...accessors
}: TimeGridProps<T>) {
  const [deviceMoment, setDeviceMoment] = useState(deviceNow);
  useEffect(() => {
    if (nowProp !== undefined) return;
    const timer = setInterval(() => setDeviceMoment(deviceNow()), 60_000);
    return () => clearInterval(timer);
  }, [nowProp]);
  const moment = nowProp ?? deviceMoment;
  const today = moment.slice(0, 10);
  const nowMinutes = toMinutes(moment.slice(11, 16)) ?? 0;
  const acc = resolveAccessors(accessors);

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
  const [current, select] = useControllableState<string | null>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (id) => {
      if (id !== null) onSelectedChange?.(id);
    },
  });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [cursor, setCursor] = useState<{ col: string; start: number; end: number } | null>(null);
  const [activeCol, setActiveCol] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const focusEvent = useRef<string | null>(null);
  const focusColumn = useRef<string | null>(null);
  const suppressClick = useRef(false);
  const hintId = useId();

  const [h0, h1] = [clamp(Math.floor(hours[0]), 0, 23), clamp(Math.ceil(hours[1]), 1, 24)];
  const from = h0 * 60;
  const to = Math.max(h1, h0 + 1) * 60;
  const stepMin = Math.max(1, Math.floor(step));

  // Appear scrolled to the working day, not to midnight.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = Math.max(0, scrollTo - h0) * hourHeight;
    // Once, when the grid appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The columns.
  const days = resources && view === "day" ? [date] : viewDays(date, view);
  const cols: Col[] = [];
  for (const d of days) {
    const day = `${WEEKDAYS[weekday(d)]!.slice(0, 3)} ${parseIso(d).getDate()}`;
    if (resources) {
      for (const r of resources) {
        cols.push({
          key: `${d}|${r.id}`,
          date: d,
          resource: r.id,
          head: r.name,
          sub: days.length > 1 ? day : "",
          ...(r.color ? { color: r.color } : {}),
        });
      }
    } else cols.push({ key: d, date: d, head: day, sub: "" });
  }
  const colKeys = cols.map((c) => c.key);

  // The events, with the one being dragged shown where it would land.
  const events: Ev<T>[] = [];
  for (const record of records) {
    const d = (getDate ? getDate(record) : text(record, "date")) ?? null;
    if (!d) continue;
    const allDay = getAllDay ? getAllDay(record) : read(record, "allDay") === true;
    const startText = (getStart ? getStart(record) : text(record, "start")) ?? null;
    const endText = (getEnd ? getEnd(record) : text(record, "end")) ?? null;
    const s = toMinutes(startText);
    const e = toMinutes(endText);
    if (!allDay && s === null) continue;
    const last = (getEndDate ? getEndDate(record) : text(record, "endDate")) ?? d;
    events.push({
      record,
      id: acc.id(record),
      label: acc.label(record),
      color: acc.color(record),
      date: d,
      endDate: last < d ? d : last,
      start: s ?? 0,
      end: e !== null && s !== null && e > s ? e : (s ?? 0) + stepMin,
      allDay,
      resource: (getResource ? getResource(record) : text(record, "resource")) ?? undefined,
    });
  }

  const colOf = (e: Ev<T>, c: Col) =>
    c.date === e.date && (c.resource === undefined || c.resource === e.resource);
  const placed = (e: Ev<T>) =>
    preview && preview.kind !== "create" && preview.id === e.id
      ? { ...e, start: preview.start, end: preview.end }
      : e;
  const dragged = preview && preview.kind !== "create" ? preview : null;

  const timed = events.filter((e) => !e.allDay);
  const allDays = events.filter((e) => e.allDay);
  const showAllDay =
    allDayRow ?? allDays.some((e) => cols.some((c) => c.date >= e.date && c.date <= e.endDate));

  // After a move by the keyboard the focus follows the event or the column to their new place.
  useEffect(() => {
    const root = body.current?.parentElement?.parentElement;
    if (!root) return;
    if (focusEvent.current !== null) {
      const id = focusEvent.current;
      focusEvent.current = null;
      [...root.querySelectorAll<HTMLElement>("[data-event]")]
        .find((el) => el.dataset.event === id)
        ?.focus();
    } else if (focusColumn.current !== null) {
      const key = focusColumn.current;
      focusColumn.current = null;
      [...root.querySelectorAll<HTMLElement>("[data-col]")]
        .find((el) => el.dataset.col === key)
        ?.focus();
    }
  });

  // Where a pointer is, in the columns: which one, and which minute.
  const locate = (x: number, y: number) => {
    const rect = body.current?.getBoundingClientRect();
    if (!rect || cols.length === 0) return { col: 0, minute: from };
    const width = rect.width / cols.length;
    return {
      col: clamp(Math.floor((x - rect.left) / width), 0, cols.length - 1),
      minute: from + ((y - rect.top) / hourHeight) * 60,
    };
  };

  const change = (c: Col, start: number, end: number): TimeGridChange => ({
    date: c.date,
    start: fromMinutes(start),
    end: fromMinutes(end),
    ...(c.resource !== undefined ? { resource: c.resource } : {}),
  });

  const begin = (
    event: ReactPointerEvent<HTMLElement>,
    kind: DragState["kind"],
    id: string,
    colIndex: number,
    start: number,
    end: number,
    anchor: number,
  ) => {
    if (event.button !== 0 || drag.current) return;
    const state: DragState = {
      kind,
      id,
      x0: event.clientX,
      y0: event.clientY,
      col0: colIndex,
      start0: start,
      end0: end,
      anchor,
      moved: false,
      stop: () => {},
    };
    const compute = (x: number, y: number): Preview | null => {
      const at = locate(x, y);
      if (kind === "create") {
        const col = cols[state.col0]!;
        const a = snapMinutes(state.anchor, stepMin, "floor");
        const b = snapMinutes(at.minute, stepMin, "round");
        const lo = b >= a ? a : b;
        const hi = b >= a ? Math.max(b, a + stepMin) : a + stepMin;
        return {
          kind,
          col: col.key,
          start: clamp(lo, from, to - stepMin),
          end: clamp(hi, from + stepMin, to),
        };
      }
      const dMin = snapMinutes(((y - state.y0) / hourHeight) * 60, stepMin);
      if (kind === "resize") {
        const col = cols[state.col0]!;
        return {
          kind,
          id,
          col: col.key,
          start: state.start0,
          end: clamp(state.end0 + dMin, state.start0 + stepMin, to),
        };
      }
      const length = state.end0 - state.start0;
      const nextStart = clamp(state.start0 + dMin, from, to - length);
      const col = cols[clamp(at.col, 0, cols.length - 1)]!;
      return { kind, id, col: col.key, start: nextStart, end: nextStart + length };
    };
    let last: Preview | null = null;
    const onMove = (e: PointerEvent) => {
      if (!state.moved && Math.hypot(e.clientX - state.x0, e.clientY - state.y0) < THRESHOLD)
        return;
      state.moved = true;
      last = compute(e.clientX, e.clientY);
      setPreview(last);
    };
    const finish = (commit: boolean) => {
      state.stop();
      drag.current = null;
      setPreview(null);
      if (!state.moved) return;
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      if (!commit || !last) return;
      const col = cols.find((c) => c.key === last!.col);
      if (!col) return;
      if (last.kind === "create") onCreate?.(change(col, last.start, last.end));
      else {
        const ev = events.find((x) => x.id === state.id);
        if (ev) {
          focusEvent.current = ev.id;
          onChange?.(ev.id, change(col, last.start, last.end));
        }
      }
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    state.stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    drag.current = state;
  };

  useEffect(() => () => drag.current?.stop(), []);

  const startMinute = (hint: number) =>
    clamp(snapMinutes(hint, stepMin, "floor"), from, Math.max(from, to - defaultDuration));

  const onColumnKey = (event: KeyboardEvent<HTMLDivElement>, c: Col, index: number) => {
    if (event.target !== event.currentTarget) return;
    const k = event.key;
    const go = (target: number) => {
      event.preventDefault();
      setCursor(null);
      const next = cols[target];
      if (next) {
        focusColumn.current = next.key;
        setActiveCol(next.key);
      } else if (!resources) {
        // Past the first or the last day: the previous or the next period, at its near end.
        const by = target < 0 ? -1 : 1;
        const moved = stepView(date, view, by);
        const around = viewDays(moved, view);
        const key = by < 0 ? around[around.length - 1] : around[0];
        if (key) {
          focusColumn.current = key;
          setActiveCol(key);
        }
        setDate(moved);
      }
    };
    if (k === "ArrowLeft") return go(index - 1);
    if (k === "ArrowRight") return go(index + 1);
    if (k === "Home") return go(0);
    if (k === "End") return go(cols.length - 1);
    if (k === "PageUp" || k === "PageDown") {
      event.preventDefault();
      focusColumn.current = c.key;
      setDate(stepView(date, view, k === "PageUp" ? -1 : 1));
      return;
    }
    if (k === "Escape") {
      if (cursor) {
        event.preventDefault();
        setCursor(null);
      }
      return;
    }
    if (!onCreate) return;
    if (k === "ArrowUp" || k === "ArrowDown") {
      event.preventDefault();
      const dir = k === "ArrowDown" ? 1 : -1;
      const base =
        cursor && cursor.col === c.key
          ? cursor
          : {
              col: c.key,
              start: startMinute(c.date === today ? nowMinutes : Math.max(from, 9 * 60)),
              end: 0,
            };
      const length = cursor && cursor.col === c.key ? cursor.end - cursor.start : defaultDuration;
      if (event.shiftKey && cursor && cursor.col === c.key) {
        setCursor({
          col: c.key,
          start: base.start,
          end: clamp(base.start + length + dir * stepMin, base.start + stepMin, to),
        });
      } else {
        const start =
          cursor && cursor.col === c.key
            ? clamp(base.start + dir * stepMin, from, to - length)
            : base.start;
        setCursor({ col: c.key, start, end: start + length });
      }
      return;
    }
    if (k === "Enter" || k === " ") {
      event.preventDefault();
      const slot =
        cursor && cursor.col === c.key
          ? cursor
          : {
              col: c.key,
              start: startMinute(c.date === today ? nowMinutes : Math.max(from, 9 * 60)),
              end: 0,
            };
      const end = cursor && cursor.col === c.key ? slot.end : slot.start + defaultDuration;
      setCursor(null);
      onCreate(change(c, slot.start, Math.min(end, to)));
    }
  };

  const onEventKey = (event: KeyboardEvent<HTMLElement>, e: Ev<T>, index: number) => {
    const k = event.key;
    if (k === "Escape") {
      event.preventDefault();
      setActiveCol(cols[index]?.key ?? null);
      (event.currentTarget.closest("[data-col]") as HTMLElement | null)?.focus();
      return;
    }
    if (!onChange) return;
    const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!arrows.includes(k)) return;
    event.preventDefault();
    const col = cols[index];
    if (!col) return;
    focusEvent.current = e.id;
    if (e.allDay) {
      if (k !== "ArrowLeft" && k !== "ArrowRight") return;
      const by = k === "ArrowLeft" ? -1 : 1;
      const shift = (iso: string) => {
        const d = parseIso(iso);
        d.setDate(d.getDate() + by);
        return toIso(d);
      };
      onChange(e.id, {
        date: shift(e.date),
        start: "00:00",
        end: "24:00",
        endDate: shift(e.endDate),
        ...(e.resource !== undefined ? { resource: e.resource } : {}),
      });
      setDate(shift(col.date));
      return;
    }
    const length = e.end - e.start;
    if (k === "ArrowUp" || k === "ArrowDown") {
      const dir = k === "ArrowDown" ? 1 : -1;
      if (event.shiftKey) {
        onChange(e.id, change(col, e.start, clamp(e.end + dir * stepMin, e.start + stepMin, to)));
      } else {
        const start = clamp(e.start + dir * stepMin, from, to - length);
        onChange(e.id, change(col, start, start + length));
      }
      return;
    }
    const next = cols[index + (k === "ArrowLeft" ? -1 : 1)];
    if (next) onChange(e.id, change(next, e.start, e.end));
  };

  const nextTitle = () => {
    if (days.length === 1) return formatLong(days[0]!);
    const a = days[0]!;
    const b = days[days.length - 1]!;
    return `${formatShort(a)} – ${formatShort(b)}, ${parseIso(b).getFullYear()}`;
  };
  const title = nextTitle();
  const unit = NAMES[view];
  const total = (to - from) / 60;
  const gridHeight = total * hourHeight;
  const hoursList = Array.from({ length: total }, (_, i) => h0 + i);

  const working = (c: Col): ReadonlyArray<TimeSpan> | null => {
    if (!workingHours) return null;
    if (typeof workingHours === "function") return workingHours(c.date, c.resource);
    return workingHours[weekday(c.date)] ?? [];
  };
  const hint = [
    onCreate ? "Arrows move the cursor, Shift and arrows set its length, Enter creates." : "",
    onChange ? "On an event, arrows move it and Shift with the arrows resizes it." : "",
  ]
    .join(" ")
    .trim();
  const minutesText = (m: number) => formatTime(fromMinutes(m), hour12);
  const hourLabel = (h: number) => formatTime(`${String(h % 24).padStart(2, "0")}:00`, hour12);

  return (
    <div
      className={cx("fg-tg", className)}
      style={{ "--fg-tg-hour": `${hourHeight}px`, "--fg-tg-n": cols.length } as CSSProperties}
    >
      {toolbar ? (
        <div className="fg-tg-tools">
          <div className="fg-tg-nav">
            <Button variant="secondary" size="sm" onClick={() => setDate(today)}>
              Today
            </Button>
            <IconButton
              icon={ArrowLeft01Icon}
              size="sm"
              label={`Previous ${unit}`}
              onClick={() => setDate(stepView(date, view, -1))}
            />
            <IconButton
              icon={ArrowRight01Icon}
              size="sm"
              label={`Next ${unit}`}
              onClick={() => setDate(stepView(date, view, 1))}
            />
            <span className="fg-tg-title" aria-live="polite">
              {title}
            </span>
            {view !== "day" ? <span className="fg-tg-week-no">W{isoWeek(days[0]!)}</span> : null}
          </div>
          {views.length > 1 ? (
            <Segmented
              label="View"
              options={views.map((v) => ({ value: v, label: VIEWS[v] }))}
              value={view}
              onChange={(v) => setView(v as GridView)}
            />
          ) : null}
        </div>
      ) : null}
      {hint ? (
        <span id={hintId} className="fg-sr">
          {hint}
        </span>
      ) : null}
      <div ref={scroller} className="fg-tg-scroll">
        <div className="fg-tg-top">
          <div className="fg-tg-headrow">
            <div className="fg-tg-gutter" />
            <div className="fg-tg-heads" role="row">
              {cols.map((c) => (
                <div
                  key={c.key}
                  role="columnheader"
                  className={cx("fg-tg-head", c.date === today && "fg-tg-head-today")}
                >
                  {c.color ? (
                    <span
                      className="fg-tg-swatch"
                      aria-hidden="true"
                      style={{ background: c.color }}
                    />
                  ) : null}
                  <span className="fg-tg-head-name">{c.head}</span>
                  {c.sub ? <span className="fg-tg-head-sub">{c.sub}</span> : null}
                </div>
              ))}
            </div>
          </div>
          {showAllDay ? (
            <div className="fg-tg-headrow fg-tg-alldayrow">
              <div className="fg-tg-gutter fg-tg-gutter-label">All day</div>
              <div className="fg-tg-heads">
                {cols.map((c, index) => (
                  <div key={c.key} className="fg-tg-allday-cell">
                    {allDays
                      .filter(
                        (e) =>
                          c.date >= e.date &&
                          c.date <= e.endDate &&
                          (c.resource === undefined || c.resource === e.resource),
                      )
                      .map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          className={cx("fg-tg-chip", e.id === current && "fg-tg-current")}
                          data-event={e.id}
                          title={e.label}
                          aria-label={`${e.label}, all day, ${formatLong(c.date)}`}
                          aria-describedby={onChange ? hintId : undefined}
                          {...(e.id === current ? { "aria-current": true as const } : {})}
                          style={e.color ? ({ "--c": e.color } as CSSProperties) : undefined}
                          onClick={() => {
                            select(e.id);
                            onOpen?.(e.id);
                          }}
                          onKeyDown={(ev) => onEventKey(ev, e, index)}
                        >
                          {renderAllDay ? renderAllDay(e.record) : e.label}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="fg-tg-body" style={{ height: gridHeight }}>
          <div className="fg-tg-hours" aria-hidden="true">
            {hoursList.map((h, i) => (
              <span key={h} className="fg-tg-hour" style={{ top: i * hourHeight }}>
                {i === 0 ? "" : hourLabel(h)}
              </span>
            ))}
          </div>
          <div ref={body} className="fg-tg-cols" role="group" aria-label={`${label}, ${title}`}>
            {cols.map((c, index) => {
              const items = timed.flatMap((e) => {
                if (dragged && dragged.id === e.id) return dragged.col === c.key ? [placed(e)] : [];
                return colOf(e, c) ? [e] : [];
              });
              const layout = layoutOverlaps(items, (e) => ({ start: e.start, end: e.end }));
              const spans = working(c);
              const off = spans ? outside(spans, from, to) : [];
              const showNow = c.date === today && nowMinutes >= from && nowMinutes <= to;
              const ghost =
                preview && preview.kind === "create" && preview.col === c.key
                  ? preview
                  : cursor && cursor.col === c.key
                    ? { start: cursor.start, end: cursor.end }
                    : null;
              const tab = (activeCol ?? colKeys[0]) === c.key;
              return (
                <div
                  key={c.key}
                  role="group"
                  data-col={c.key}
                  data-date={c.date}
                  tabIndex={tab ? 0 : -1}
                  aria-label={`${formatLong(c.date)}${c.resource ? `, ${c.head}` : ""}, ${items.length} ${items.length === 1 ? "event" : "events"}`}
                  aria-describedby={hint ? hintId : undefined}
                  className={cx(
                    "fg-tg-col",
                    weekday(c.date) > 4 && "fg-tg-weekend",
                    c.date === today && "fg-tg-today",
                  )}
                  onFocus={(e) => {
                    if (e.target === e.currentTarget) setActiveCol(c.key);
                  }}
                  onBlur={(e) => {
                    if (e.target === e.currentTarget) setCursor(null);
                  }}
                  onKeyDown={(e) => onColumnKey(e, c, index)}
                  onPointerDown={(e) => {
                    if (!onCreate || (e.target as HTMLElement).closest("[data-event]")) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const minute = from + ((e.clientY - rect.top) / hourHeight) * 60;
                    setCursor(null);
                    begin(e, "create", "", index, 0, 0, minute);
                  }}
                  onDoubleClick={(e) => {
                    if (!onCreate || (e.target as HTMLElement).closest("[data-event]")) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const minute = from + ((e.clientY - rect.top) / hourHeight) * 60;
                    const start = startMinute(minute);
                    onCreate(change(c, start, Math.min(start + defaultDuration, to)));
                  }}
                >
                  {off.map(([a, b]) => (
                    <div
                      key={a}
                      className="fg-tg-off"
                      aria-hidden="true"
                      style={{
                        top: ((a - from) / 60) * hourHeight,
                        height: ((b - a) / 60) * hourHeight,
                      }}
                    />
                  ))}
                  {ghost ? (
                    <div
                      className="fg-tg-ghost"
                      aria-hidden="true"
                      style={{
                        top: ((ghost.start - from) / 60) * hourHeight,
                        height: Math.max(((ghost.end - ghost.start) / 60) * hourHeight, 8),
                      }}
                    >
                      <span>
                        {minutesText(ghost.start)} – {minutesText(ghost.end)}
                      </span>
                    </div>
                  ) : null}
                  {layout.map((p) => {
                    const e = p.item;
                    const height = Math.max(((p.end - p.start) / 60) * hourHeight, 12);
                    const compact = p.end - p.start <= 30 || height < 34;
                    const active = dragged && dragged.id === e.id;
                    return (
                      <div
                        key={e.id}
                        className={cx("fg-tg-slot", active && "fg-tg-slot-drag")}
                        style={{
                          top: ((p.start - from) / 60) * hourHeight,
                          height,
                          left: `calc(${(p.column / p.columns) * 100}% + 1px)`,
                          width: `calc(${100 / p.columns}% - ${p.columns === 1 ? 8 : 2}px)`,
                        }}
                      >
                        <button
                          type="button"
                          data-event={e.id}
                          className={cx(
                            "fg-tg-event",
                            e.id === current && "fg-tg-current",
                            compact && "fg-tg-compact",
                            onChange && "fg-tg-movable",
                          )}
                          style={e.color ? ({ "--c": e.color } as CSSProperties) : undefined}
                          aria-label={`${e.label}, ${formatLong(c.date)}, ${minutesText(p.start)} to ${minutesText(p.end)}`}
                          aria-describedby={onChange ? hintId : undefined}
                          {...(e.id === current ? { "aria-current": true as const } : {})}
                          onClick={() => {
                            if (suppressClick.current) return;
                            select(e.id);
                            onOpen?.(e.id);
                          }}
                          onKeyDown={(ev) => onEventKey(ev, e, index)}
                          onPointerDown={(ev) => {
                            if (!onChange) return;
                            begin(ev, "move", e.id, index, e.start, e.end, 0);
                          }}
                        >
                          {renderEvent ? (
                            renderEvent(e.record, {
                              date: c.date,
                              start: fromMinutes(p.start),
                              end: fromMinutes(p.end),
                              compact,
                            })
                          ) : (
                            <>
                              <span className="fg-tg-event-title">{e.label}</span>
                              <span className="fg-tg-event-time">
                                {minutesText(p.start)}
                                {compact ? "" : ` – ${minutesText(p.end)}`}
                              </span>
                            </>
                          )}
                        </button>
                        {onChange ? (
                          <span
                            className="fg-tg-grip"
                            aria-hidden="true"
                            onPointerDown={(ev) => {
                              ev.stopPropagation();
                              begin(ev, "resize", e.id, index, e.start, e.end, 0);
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                  {showNow ? (
                    <div
                      className="fg-tg-now"
                      aria-hidden="true"
                      style={{ top: ((nowMinutes - from) / 60) * hourHeight }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
