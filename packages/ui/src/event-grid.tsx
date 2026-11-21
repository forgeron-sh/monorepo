// Events on a grid of hours: one or several days as columns, or the columns of resources (people,
// rooms, chairs) of a day. Events are laid out side by side where they overlap, an all-day row sits
// above, one ember line marks now, hours of work stay plain and the rest is hatched. Drag on empty
// space to create, drag an event to move it or its foot to resize it (a step at a time); the
// keyboard does the same. Presentational: the days, the events and the date in focus are the
// caller's. shadcn's composition: a root and parts, each with `className` and `...rest`, and
// `asChild` where it is one element.
//
//   <EventGrid days={days} events={events} onChange={move} onCreate={create}>
//     <EventGridHeader />
//     <EventGridBody />
//   </EventGrid>
//
// `EventGridHeader` is the names of the columns and the all-day row, `EventGridBody` the hours and
// the columns. Draw a column yourself with `<EventGridColumns>{(column) => …}</EventGridColumns>`.
// Without children the root draws header and body.

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cx } from "./cx";
import { addDays, formatLong, parseIso, toIso, WEEKDAYS, weekday } from "./dates";
import { clamp, fromMinutes, layoutOverlaps, snapMinutes, toMinutes } from "./event-grid-model";
import { useControllableState } from "./hooks/use-controllable";
import { renderPart, type Part } from "./part";
import { formatTime } from "./time";

/** One event of the grid: a meeting, a shift, a booking. */
export interface EventGridEvent {
  id: string;
  /** Its name: read out, and the content by default. */
  label: string;
  /** A CSS colour for its edge, e.g. `var(--accent)`. */
  color?: string;
  /** The day, `YYYY-MM-DD`. */
  date: string;
  /** The last day of an all-day event that spans several days. */
  endDate?: string;
  /** Minutes since midnight. */
  start: number;
  /** Minutes since midnight; 1440 is the end of the day. */
  end: number;
  allDay?: boolean;
  /** The resource column it sits in, when the grid has resources. */
  resource?: string;
  /** Yours: handed back to `renderEvent`. */
  data?: unknown;
}

/** A column of the resource variant: a person, a room, a chair. */
export interface EventGridResource {
  id: string;
  name: string;
  /** A CSS colour for the mark before the name. */
  color?: string;
}

/** The new place of an event, or of one about to be created. */
export interface EventGridChange {
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

/** What an event knows about itself when it is drawn. */
export interface EventGridEventInfo {
  date: string;
  start: string;
  end: string;
  /** Short enough for one line. */
  compact: boolean;
}

/** A span of work: `HH:mm` to `HH:mm`. */
export interface EventGridSpan {
  start: string;
  end: string;
}

/** A column of the grid: a day, or a resource on a day. */
export interface EventGridColumnData {
  key: string;
  date: string;
  resource?: string;
  head: string;
  sub: string;
  color?: string;
}

interface EventGridBase {
  /** The days drawn, `YYYY-MM-DD`: one column each, or one column per resource of each. */
  days: ReadonlyArray<string>;
  events: ReadonlyArray<EventGridEvent>;
  /** Columns per resource, in each day. */
  resources?: ReadonlyArray<EventGridResource>;
  /** The inside of a timed event: its label and times by default. */
  renderEvent?: (event: EventGridEvent, info: EventGridEventInfo) => ReactNode;
  /** The inside of an all-day chip: its label by default. */
  renderAllDay?: (event: EventGridEvent) => ReactNode;
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
   * The hours of work: seven lists of spans (Monday first), or a function of the date and the
   * resource. What is outside them is hatched.
   */
  workingHours?:
    | ReadonlyArray<ReadonlyArray<EventGridSpan>>
    | ((date: string, resource?: string) => ReadonlyArray<EventGridSpan>);
  /** Written in 12 hours with AM and PM. */
  hour12?: boolean;
  /** The current event. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** A click or Enter on an event. */
  onOpen?: (id: string) => void;
  /** Makes empty space able to create: drag, double click, or Enter on a column. */
  onCreate?: (slot: EventGridChange) => void;
  /** Makes events movable and resizable: by pointer, or by the arrows (Shift resizes). */
  onChange?: (id: string, change: EventGridChange) => void;
  /**
   * Page Up and Page Down, and the arrows past the first or the last column, ask for the period
   * before (-1) or after (1); the focus lands on its near end.
   */
  onPage?: (by: -1 | 1) => void;
  /** An all-day event moved by the arrows: the day the view should show. */
  onReveal?: (date: string) => void;
  /** Always show the all-day row, even with nothing in it. Default: only when it has events. */
  allDayRow?: boolean;
  /** Names the grid for assistive technology. */
  label?: string;
}

export interface EventGridProps
  extends EventGridBase, Omit<Part<ComponentProps<"div">>, "children" | "onChange"> {
  asChild?: boolean;
  /** Given, `EventGrid` is the root of the parts. */
  children?: undefined;
}

export interface EventGridRootProps
  extends EventGridBase, Omit<Part<ComponentProps<"div">>, "children" | "onChange"> {
  asChild?: boolean;
  children: ReactNode;
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

interface EventGridState {
  columns: ReadonlyArray<EventGridColumnData>;
  events: ReadonlyArray<EventGridEvent>;
  timed: ReadonlyArray<EventGridEvent>;
  allDays: ReadonlyArray<EventGridEvent>;
  showAllDay: boolean;
  today: string;
  nowMinutes: number;
  from: number;
  to: number;
  hourHeight: number;
  firstHour: number;
  hoursList: ReadonlyArray<number>;
  current: string | null;
  preview: Preview | null;
  dragged: Exclude<Preview, { kind: "create" }> | null;
  cursor: { col: string; start: number; end: number } | null;
  activeCol: string;
  hintId: string;
  hint: string;
  label: string;
  hour12: boolean;
  creatable: boolean;
  movable: boolean;
  body: RefObject<HTMLDivElement | null>;
  working: (column: EventGridColumnData) => ReadonlyArray<EventGridSpan> | null;
  minutesText: (minutes: number) => string;
  hourLabel: (hour: number) => string;
  renderEvent: EventGridBase["renderEvent"];
  renderAllDay: EventGridBase["renderAllDay"];
  open: (id: string) => void;
  clickAllowed: () => boolean;
  begin: (
    event: ReactPointerEvent<HTMLElement>,
    kind: DragState["kind"],
    id: string,
    colIndex: number,
    start: number,
    end: number,
    anchor: number,
  ) => void;
  onColumnKey: (
    event: KeyboardEvent<HTMLDivElement>,
    column: EventGridColumnData,
    index: number,
  ) => void;
  onEventKey: (event: KeyboardEvent<HTMLElement>, e: EventGridEvent, index: number) => void;
  onColumnFocus: (key: string) => void;
  onColumnBlur: () => void;
  createAt: (column: EventGridColumnData, minute: number) => void;
  clearCursor: () => void;
}

const EventGridContext = createContext<EventGridState | null>(null);

/** The state of the `EventGrid` a part sits in. */
export function useEventGrid(part = "useEventGrid"): EventGridState {
  const state = useContext(EventGridContext);
  if (!state) throw new Error(`${part} goes inside an EventGrid.`);
  return state;
}

const THRESHOLD = 4;

/** The device's local moment as `YYYY-MM-DDTHH:mm`. */
const deviceNow = () => {
  const d = new Date();
  return `${toIso(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** What a span list leaves free inside `[from, to]`, in minutes. */
function outside(spans: ReadonlyArray<EventGridSpan>, from: number, to: number) {
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

type Focus =
  | { kind: "event"; key: string }
  | { kind: "column"; key: string }
  | { kind: "edge"; end: "first" | "last" };

/**
 * Events on a grid of hours. Drag empty space to create (`onCreate`), an event to move it or its
 * foot to resize it (`onChange`); the arrows move an event, Shift and the arrows resize it, Enter
 * opens it; on a column the arrows move a cursor that Enter turns into an event.
 */
export function EventGrid(props: EventGridProps | EventGridRootProps) {
  const {
    days,
    events: source,
    resources,
    renderEvent,
    renderAllDay,
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
    onPage,
    onReveal,
    allDayRow,
    label = "Schedule",
    className,
    asChild,
    children,
    style,
    ...rest
  } = props;
  const [deviceMoment, setDeviceMoment] = useState(deviceNow);
  useEffect(() => {
    if (nowProp !== undefined) return;
    const timer = setInterval(() => setDeviceMoment(deviceNow()), 60_000);
    return () => clearInterval(timer);
  }, [nowProp]);
  const moment = nowProp ?? deviceMoment;
  const today = moment.slice(0, 10);
  const nowMinutes = toMinutes(moment.slice(11, 16)) ?? 0;

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
  const focusNext = useRef<Focus | null>(null);
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
  const columns: EventGridColumnData[] = [];
  for (const d of days) {
    const day = `${WEEKDAYS[weekday(d)]!.slice(0, 3)} ${parseIso(d).getDate()}`;
    if (resources) {
      for (const r of resources) {
        columns.push({
          key: `${d}|${r.id}`,
          date: d,
          resource: r.id,
          head: r.name,
          sub: days.length > 1 ? day : "",
          ...(r.color ? { color: r.color } : {}),
        });
      }
    } else columns.push({ key: d, date: d, head: day, sub: "" });
  }
  const colKeys = columns.map((c) => c.key);

  const events = source.map((e) => ({
    ...e,
    endDate: e.endDate && e.endDate > e.date ? e.endDate : e.date,
  }));
  const dragged = preview && preview.kind !== "create" ? preview : null;
  const timed = events.filter((e) => !e.allDay);
  const allDays = events.filter((e) => e.allDay);
  const showAllDay =
    allDayRow ?? allDays.some((e) => columns.some((c) => c.date >= e.date && c.date <= e.endDate!));

  // After a move by the keyboard the focus follows the event or the column to their new place.
  useEffect(() => {
    const root = scroller.current;
    const next = focusNext.current;
    if (!root || !next) return;
    focusNext.current = null;
    if (next.kind === "event") {
      [...root.querySelectorAll<HTMLElement>("[data-event]")]
        .find((el) => el.dataset.event === next.key)
        ?.focus();
    } else if (next.kind === "column") {
      [...root.querySelectorAll<HTMLElement>("[data-col]")]
        .find((el) => el.dataset.col === next.key)
        ?.focus();
    } else {
      const all = [...root.querySelectorAll<HTMLElement>("[data-col]")];
      const el = next.end === "first" ? all[0] : all[all.length - 1];
      el?.focus();
    }
  });

  // Where a pointer is, in the columns: which one, and which minute.
  const locate = (x: number, y: number) => {
    const rect = body.current?.getBoundingClientRect();
    if (!rect || columns.length === 0) return { col: 0, minute: from };
    const width = rect.width / columns.length;
    return {
      col: clamp(Math.floor((x - rect.left) / width), 0, columns.length - 1),
      minute: from + ((y - rect.top) / hourHeight) * 60,
    };
  };

  const change = (c: EventGridColumnData, start: number, end: number): EventGridChange => ({
    date: c.date,
    start: fromMinutes(start),
    end: fromMinutes(end),
    ...(c.resource !== undefined ? { resource: c.resource } : {}),
  });

  const begin: EventGridState["begin"] = (event, kind, id, colIndex, start, end, anchor) => {
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
        const col = columns[state.col0]!;
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
        const col = columns[state.col0]!;
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
      const col = columns[clamp(at.col, 0, columns.length - 1)]!;
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
      const col = columns.find((c) => c.key === last!.col);
      if (!col) return;
      if (last.kind === "create") onCreate?.(change(col, last.start, last.end));
      else {
        const ev = events.find((x) => x.id === state.id);
        if (ev) {
          focusNext.current = { kind: "event", key: ev.id };
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

  const onColumnKey: EventGridState["onColumnKey"] = (event, c, index) => {
    if (event.target !== event.currentTarget) return;
    const k = event.key;
    const go = (target: number) => {
      event.preventDefault();
      setCursor(null);
      const next = columns[target];
      if (next) {
        focusNext.current = { kind: "column", key: next.key };
        setActiveCol(next.key);
      } else if (!resources && onPage) {
        // Past the first or the last day: the previous or the next period, at its near end.
        focusNext.current = { kind: "edge", end: target < 0 ? "last" : "first" };
        onPage(target < 0 ? -1 : 1);
      }
    };
    if (k === "ArrowLeft") return go(index - 1);
    if (k === "ArrowRight") return go(index + 1);
    if (k === "Home") return go(0);
    if (k === "End") return go(columns.length - 1);
    if (k === "PageUp" || k === "PageDown") {
      event.preventDefault();
      onPage?.(k === "PageUp" ? -1 : 1);
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

  const onEventKey: EventGridState["onEventKey"] = (event, e, index) => {
    const k = event.key;
    if (k === "Escape") {
      event.preventDefault();
      setActiveCol(columns[index]?.key ?? null);
      (event.currentTarget.closest("[data-col]") as HTMLElement | null)?.focus();
      return;
    }
    if (!onChange) return;
    const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!arrows.includes(k)) return;
    event.preventDefault();
    const col = columns[index];
    if (!col) return;
    focusNext.current = { kind: "event", key: e.id };
    if (e.allDay) {
      if (k !== "ArrowLeft" && k !== "ArrowRight") return;
      const by = k === "ArrowLeft" ? -1 : 1;
      onChange(e.id, {
        date: addDays(e.date, by),
        start: "00:00",
        end: "24:00",
        endDate: addDays(e.endDate!, by),
        ...(e.resource !== undefined ? { resource: e.resource } : {}),
      });
      onReveal?.(addDays(col.date, by));
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
    const next = columns[index + (k === "ArrowLeft" ? -1 : 1)];
    if (next) onChange(e.id, change(next, e.start, e.end));
  };

  const total = (to - from) / 60;
  const working: EventGridState["working"] = (c) => {
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

  const state: EventGridState = {
    columns,
    events,
    timed,
    allDays,
    showAllDay,
    today,
    nowMinutes,
    from,
    to,
    hourHeight,
    firstHour: h0,
    hoursList: Array.from({ length: total }, (_, i) => h0 + i),
    current,
    preview,
    dragged,
    cursor,
    activeCol: activeCol ?? colKeys[0] ?? "",
    hintId,
    hint,
    label,
    hour12,
    creatable: onCreate !== undefined,
    movable: onChange !== undefined,
    body,
    working,
    minutesText: (m) => formatTime(fromMinutes(m), hour12),
    hourLabel: (h) => formatTime(`${String(h % 24).padStart(2, "0")}:00`, hour12),
    renderEvent,
    renderAllDay,
    open: (id) => {
      select(id);
      onOpen?.(id);
    },
    clickAllowed: () => !suppressClick.current,
    begin,
    onColumnKey,
    onEventKey,
    onColumnFocus: (key) => setActiveCol(key),
    onColumnBlur: () => setCursor(null),
    createAt: (c, minute) => {
      const start = startMinute(minute);
      onCreate?.(change(c, start, Math.min(start + defaultDuration, to)));
    },
    clearCursor: () => setCursor(null),
  };

  return (
    <EventGridContext.Provider value={state}>
      {renderPart("div", cx("fg-eg", className), asChild, {
        "data-slot": "event-grid",
        ref: scroller,
        style: {
          "--fg-eg-hour": `${hourHeight}px`,
          "--fg-eg-n": columns.length,
          ...style,
        } as CSSProperties,
        ...rest,
        children: (
          <>
            {hint ? (
              <span id={hintId} className="fg-sr">
                {hint}
              </span>
            ) : null}
            {children ?? (
              <>
                <EventGridHeader />
                <EventGridBody />
              </>
            )}
          </>
        ),
      })}
    </EventGridContext.Provider>
  );
}

type Parted<T> = Part<T> & { asChild?: boolean };

/** The sticky top of the grid: the names of the columns, then the all-day row. */
export function EventGridHeader({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  return renderPart("div", cx("fg-eg-top", className), asChild, {
    "data-slot": "event-grid-header",
    ...rest,
    children: children ?? (
      <>
        <EventGridHeads />
        <EventGridAllDay />
      </>
    ),
  });
}

/** The names of the columns, over a gutter that lines up with the hours. */
export function EventGridHeads({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useEventGrid("EventGridHeads");
  return renderPart("div", cx("fg-eg-headrow", className), asChild, {
    "data-slot": "event-grid-heads",
    ...rest,
    children: (
      <>
        <div className="fg-eg-gutter" />
        <div className="fg-eg-heads" role="row">
          {children ?? g.columns.map((c) => <EventGridHead key={c.key} column={c} />)}
        </div>
      </>
    ),
  });
}

/** The name of one column: a day, or a resource. */
export function EventGridHead({
  column,
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">> & { column: EventGridColumnData }) {
  const g = useEventGrid("EventGridHead");
  return renderPart(
    "div",
    cx("fg-eg-head", column.date === g.today && "fg-eg-head-today", className),
    asChild,
    {
      "data-slot": "event-grid-head",
      role: "columnheader",
      ...rest,
      children: children ?? (
        <>
          {column.color ? (
            <span
              className="fg-eg-swatch"
              aria-hidden="true"
              style={{ background: column.color }}
            />
          ) : null}
          <span className="fg-eg-head-name">{column.head}</span>
          {column.sub ? <span className="fg-eg-head-sub">{column.sub}</span> : null}
        </>
      ),
    },
  );
}

/** The all-day row: a cell per column holding the chips of the events that cover it. */
export function EventGridAllDay({
  force,
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">> & { force?: boolean }) {
  const g = useEventGrid("EventGridAllDay");
  if (!g.showAllDay && !force) return null;
  return renderPart("div", cx("fg-eg-headrow fg-eg-alldayrow", className), asChild, {
    "data-slot": "event-grid-all-day",
    ...rest,
    children: (
      <>
        <div className="fg-eg-gutter fg-eg-gutter-label">All day</div>
        <div className="fg-eg-heads">
          {children ??
            g.columns.map((c, index) => (
              <div key={c.key} className="fg-eg-allday-cell">
                {g.allDays
                  .filter(
                    (e) =>
                      c.date >= e.date &&
                      c.date <= e.endDate! &&
                      (c.resource === undefined || c.resource === e.resource),
                  )
                  .map((e) => (
                    <EventGridChip key={e.id} event={e} column={c} index={index} />
                  ))}
              </div>
            ))}
        </div>
      </>
    ),
  });
}

export interface EventGridChipProps extends Omit<Parted<ComponentProps<"button">>, "children"> {
  event: EventGridEvent;
  column: EventGridColumnData;
  /** The index of the column, for the arrows. */
  index: number;
  children?: ReactNode;
}

/** An all-day event in its cell. */
export function EventGridChip({
  event: e,
  column: c,
  index,
  className,
  asChild,
  children,
  ...rest
}: EventGridChipProps) {
  const g = useEventGrid("EventGridChip");
  const on = e.id === g.current;
  return renderPart("button", cx("fg-eg-chip", on && "fg-eg-current", className), asChild, {
    "data-slot": "event-grid-chip",
    type: "button",
    "data-event": e.id,
    title: e.label,
    "aria-label": `${e.label}, all day, ${formatLong(c.date)}`,
    "aria-describedby": g.movable ? g.hintId : undefined,
    ...(on ? { "aria-current": true } : {}),
    style: e.color ? ({ "--c": e.color } as CSSProperties) : undefined,
    onClick: () => g.open(e.id),
    onKeyDown: (ev: KeyboardEvent<HTMLElement>) => g.onEventKey(ev, e, index),
    ...rest,
    children: children ?? (g.renderAllDay ? g.renderAllDay(e) : e.label),
  });
}

/** The hours and the columns. */
export function EventGridBody({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useEventGrid("EventGridBody");
  return renderPart("div", cx("fg-eg-body", className), asChild, {
    "data-slot": "event-grid-body",
    style: { height: g.hoursList.length * g.hourHeight },
    ...rest,
    children: children ?? (
      <>
        <EventGridHours />
        <EventGridColumns />
      </>
    ),
  });
}

/** The gutter of hours, down the left of the columns. */
export function EventGridHours({ className, asChild, ...rest }: Parted<ComponentProps<"div">>) {
  const g = useEventGrid("EventGridHours");
  return renderPart("div", cx("fg-eg-hours", className), asChild, {
    "data-slot": "event-grid-hours",
    "aria-hidden": true,
    ...rest,
    children: g.hoursList.map((h, i) => (
      <span key={h} className="fg-eg-hour" style={{ top: i * g.hourHeight }}>
        {i === 0 ? "" : g.hourLabel(h)}
      </span>
    )),
  });
}

/** The columns, side by side. Give a function to draw a column yourself. */
export function EventGridColumns({
  className,
  asChild,
  children,
  ...rest
}: Omit<Parted<ComponentProps<"div">>, "children"> & {
  children?: (column: EventGridColumnData, index: number) => ReactNode;
}) {
  const g = useEventGrid("EventGridColumns");
  return renderPart("div", cx("fg-eg-cols", className), asChild, {
    "data-slot": "event-grid-columns",
    ref: g.body,
    role: "group",
    "aria-label": g.label,
    ...rest,
    children: g.columns.map((c, index) =>
      children ? children(c, index) : <EventGridColumn key={c.key} column={c} index={index} />,
    ),
  });
}

export interface EventGridColumnProps extends Omit<Parted<ComponentProps<"div">>, "children"> {
  column: EventGridColumnData;
  index: number;
  /** What is in the column; the hatching, the cursor, the events and the now line by default. */
  children?: ReactNode;
}

/** One column: a day, or a resource on a day. A tab stop; arrows move a cursor, Enter creates. */
export function EventGridColumn({
  column: c,
  index,
  className,
  asChild,
  children,
  ...rest
}: EventGridColumnProps) {
  const g = useEventGrid("EventGridColumn");
  const items = g.timed.flatMap((e) => {
    if (g.dragged && g.dragged.id === e.id) {
      return g.dragged.col === c.key ? [{ ...e, start: g.dragged.start, end: g.dragged.end }] : [];
    }
    return c.date === e.date && (c.resource === undefined || c.resource === e.resource) ? [e] : [];
  });
  const timeOf = (clientY: number, el: HTMLElement) =>
    g.from + ((clientY - el.getBoundingClientRect().top) / g.hourHeight) * 60;
  return renderPart(
    "div",
    cx(
      "fg-eg-col",
      weekday(c.date) > 4 && "fg-eg-weekend",
      c.date === g.today && "fg-eg-today",
      className,
    ),
    asChild,
    {
      "data-slot": "event-grid-column",
      role: "group",
      "data-col": c.key,
      "data-date": c.date,
      tabIndex: g.activeCol === c.key ? 0 : -1,
      "aria-label": `${formatLong(c.date)}${c.resource ? `, ${c.head}` : ""}, ${items.length} ${items.length === 1 ? "event" : "events"}`,
      "aria-describedby": g.hint ? g.hintId : undefined,
      onFocus: (e: FocusEvent<HTMLElement>) => {
        if (e.target === e.currentTarget) g.onColumnFocus(c.key);
      },
      onBlur: (e: FocusEvent<HTMLElement>) => {
        if (e.target === e.currentTarget) g.onColumnBlur();
      },
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => g.onColumnKey(e, c, index),
      onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!g.creatable || (e.target as HTMLElement).closest("[data-event]")) return;
        g.clearCursor();
        g.begin(e, "create", "", index, 0, 0, timeOf(e.clientY, e.currentTarget));
      },
      onDoubleClick: (e: MouseEvent<HTMLDivElement>) => {
        if (!g.creatable || (e.target as HTMLElement).closest("[data-event]")) return;
        g.createAt(c, timeOf(e.clientY, e.currentTarget));
      },
      ...rest,
      children: children ?? (
        <>
          <EventGridOff column={c} />
          <EventGridGhost column={c} />
          {layoutOverlaps(items, (e) => ({ start: e.start, end: e.end })).map((p) => (
            <EventGridEventSlot
              key={p.item.id}
              event={p.item}
              column={c}
              index={index}
              start={p.start}
              end={p.end}
              lane={p.column}
              lanes={p.columns}
            />
          ))}
          <EventGridNow column={c} />
        </>
      ),
    },
  );
}

/** The hatching over the hours outside the working hours of a column. */
export function EventGridOff({ column }: { column: EventGridColumnData }) {
  const g = useEventGrid("EventGridOff");
  const spans = g.working(column);
  const off = spans ? outside(spans, g.from, g.to) : [];
  return (
    <>
      {off.map(([a, b]) => (
        <div
          key={a}
          className="fg-eg-off"
          data-slot="event-grid-off"
          aria-hidden="true"
          style={{
            top: ((a - g.from) / 60) * g.hourHeight,
            height: ((b - a) / 60) * g.hourHeight,
          }}
        />
      ))}
    </>
  );
}

/** The outline of the event being drawn by a drag or by the keyboard's cursor. */
export function EventGridGhost({ column }: { column: EventGridColumnData }) {
  const g = useEventGrid("EventGridGhost");
  const ghost =
    g.preview && g.preview.kind === "create" && g.preview.col === column.key
      ? g.preview
      : g.cursor && g.cursor.col === column.key
        ? { start: g.cursor.start, end: g.cursor.end }
        : null;
  if (!ghost) return null;
  return (
    <div
      className="fg-eg-ghost"
      data-slot="event-grid-ghost"
      aria-hidden="true"
      style={{
        top: ((ghost.start - g.from) / 60) * g.hourHeight,
        height: Math.max(((ghost.end - ghost.start) / 60) * g.hourHeight, 8),
      }}
    >
      <span>
        {g.minutesText(ghost.start)} – {g.minutesText(ghost.end)}
      </span>
    </div>
  );
}

/** The ember line, in today's columns only. */
export function EventGridNow({ column }: { column: EventGridColumnData }) {
  const g = useEventGrid("EventGridNow");
  if (!(column.date === g.today && g.nowMinutes >= g.from && g.nowMinutes <= g.to)) return null;
  return (
    <div
      className="fg-eg-now"
      data-slot="event-grid-now"
      aria-hidden="true"
      style={{ top: ((g.nowMinutes - g.from) / 60) * g.hourHeight }}
    />
  );
}

export interface EventGridEventSlotProps extends Omit<Parted<ComponentProps<"div">>, "children"> {
  event: EventGridEvent;
  column: EventGridColumnData;
  index: number;
  /** Where it sits, in minutes: its own, or where a drag would put it. */
  start: number;
  end: number;
  /** Which of `lanes` side-by-side lanes it takes. Default the only one. */
  lane?: number;
  lanes?: number;
  /** The inside of the event button; `renderEvent`, else its label and times. */
  children?: ReactNode;
}

/** An event placed in its column: the button, and the foot that resizes it. */
export function EventGridEventSlot({
  event: e,
  column: c,
  index,
  start,
  end,
  lane = 0,
  lanes = 1,
  className,
  asChild,
  children,
  ...rest
}: EventGridEventSlotProps) {
  const g = useEventGrid("EventGridEventSlot");
  const height = Math.max(((end - start) / 60) * g.hourHeight, 12);
  const compact = end - start <= 30 || height < 34;
  const active = g.dragged && g.dragged.id === e.id;
  const on = e.id === g.current;
  return renderPart("div", cx("fg-eg-slot", active && "fg-eg-slot-drag", className), asChild, {
    "data-slot": "event-grid-event",
    style: {
      top: ((start - g.from) / 60) * g.hourHeight,
      height,
      left: `calc(${(lane / lanes) * 100}% + 1px)`,
      width: `calc(${100 / lanes}% - ${lanes === 1 ? 8 : 2}px)`,
    },
    ...rest,
    children: (
      <>
        <button
          type="button"
          data-event={e.id}
          className={cx(
            "fg-eg-event",
            on && "fg-eg-current",
            compact && "fg-eg-compact",
            g.movable && "fg-eg-movable",
          )}
          style={e.color ? ({ "--c": e.color } as CSSProperties) : undefined}
          aria-label={`${e.label}, ${formatLong(c.date)}, ${g.minutesText(start)} to ${g.minutesText(end)}`}
          aria-describedby={g.movable ? g.hintId : undefined}
          {...(on ? { "aria-current": true as const } : {})}
          onClick={() => {
            if (g.clickAllowed()) g.open(e.id);
          }}
          onKeyDown={(ev) => g.onEventKey(ev, e, index)}
          onPointerDown={(ev) => {
            if (g.movable) g.begin(ev, "move", e.id, index, e.start, e.end, 0);
          }}
        >
          {children ??
            (g.renderEvent ? (
              g.renderEvent(e, {
                date: c.date,
                start: fromMinutes(start),
                end: fromMinutes(end),
                compact,
              })
            ) : (
              <>
                <span className="fg-eg-event-title">{e.label}</span>
                <span className="fg-eg-event-time">
                  {g.minutesText(start)}
                  {compact ? "" : ` – ${g.minutesText(end)}`}
                </span>
              </>
            ))}
        </button>
        {g.movable ? (
          <span
            className="fg-eg-grip"
            aria-hidden="true"
            onPointerDown={(ev) => {
              ev.stopPropagation();
              g.begin(ev, "resize", e.id, index, e.start, e.end, 0);
            }}
          />
        ) : null}
      </>
    ),
  });
}
