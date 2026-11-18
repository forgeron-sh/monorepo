// The timeline of a list view, after the project timeline of the owner's Linear clone, drawn in the
// lab language: a sticky column of names, a two-row axis in mono capitals, records as flat bars
// with a coloured edge, points for what only has a due date, pixel diamonds for milestones,
// hatched weekends and one ember line for today. Zoom by weeks, months or quarters.

import { ArrowDown01Icon, DiamondFillIcon, DiamondIcon } from "@forgeron/icons";
import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { addDays, addMonths, formatShort, MONTHS, parseIso, toIso, weekday } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import {
  daysBetween,
  defaultLabel,
  isoWeek,
  monthStart,
  resolveAccessors,
  textField,
  type RecordAccessors,
} from "./views-parts";

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

export interface TimelineProps<T> extends RecordAccessors<T> {
  /** The rows in sections, e.g. `useListView(...).groups`. A single group keyed `all` has no header. */
  groups?: ReadonlyArray<TimelineGroup<T>>;
  /** The rows without sections, when there are no `groups`. */
  records?: ReadonlyArray<T>;
  /** The first day, `YYYY-MM-DD`: `record.start` by default. */
  getStart?: (record: T) => string | null | undefined;
  /** The last day: `record.end`, else `record.due`, else `record.target`. Alone, it is a point. */
  getEnd?: (record: T) => string | null | undefined;
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
  className?: string;
  ref?: Ref<TimelineHandle>;
}

const ZOOMS = [
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "quarters", label: "Quarters" },
];

const ROW = "[data-record]";

type Row<T> =
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

/**
 * Records as bars on a time axis, in sections, with a sticky column of names. The arrows move
 * between rows, Enter opens; with `onChange`, bars move by drag or by Alt and the arrows.
 */
export function Timeline<T>({
  groups,
  records,
  getStart,
  getEnd,
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
  ref,
  ...accessors
}: TimelineProps<T>) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const acc = resolveAccessors(accessors);
  const startOf = (r: T) => (getStart ? getStart(r) : textField(r, "start")) ?? null;
  const endOf = (r: T) =>
    (getEnd ? getEnd(r) : (textField(r, "end") ?? textField(r, "due") ?? textField(r, "target"))) ??
    null;
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

  const sections: ReadonlyArray<TimelineGroup<T>> = groups ?? [
    { key: "all", name: label, records: records ?? [] },
  ];
  const headed = !(sections.length === 1 && sections[0]!.key === "all");
  const rows: Row<T>[] = [];
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
  useImperativeHandle(ref, () => ({
    scrollToToday: () => scrollTo(scroller.current, labelWidth, true),
  }));

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
  const dragHandlers = (r: T) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => grab(e, r, "move"),
    onPointerMove: follow,
    onPointerUp: drop,
    onPointerCancel: () => setDrag(null),
  });
  const clickBar = (id: string) => {
    if (clickAfterDrag.current) {
      clickAfterDrag.current = false;
      return;
    }
    open(id);
  };

  if (all.length === 0) return <div className={cx("fg-tl-empty", className)}>{empty}</div>;

  return (
    <div
      className={cx("fg-tl", `fg-tl-${zoom}`, drag && "fg-tl-dragging", className)}
      style={{ "--fg-tl-label": `${labelWidth}px`, "--fg-tl-w": `${width}px` } as CSSProperties}
    >
      {toolbar ? (
        <div className="fg-tl-tools">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => scrollTo(scroller.current, labelWidth, true)}
          >
            Today
          </Button>
          <Segmented
            label="Zoom"
            options={ZOOMS}
            value={zoom}
            onChange={(z) => setZoom(z as TimelineZoom)}
          />
        </div>
      ) : null}
      {onChange ? (
        <span id={hintId} className="fg-sr">
          Alt and the arrows move the dates, by a {step === 1 ? "day" : "week"}; add Shift to move
          the end alone.
        </span>
      ) : null}
      <div
        ref={scroller}
        className="fg-tl-scroll"
        role="region"
        aria-label={label}
        data-today-x={todayX}
        onKeyDown={onKeyDown}
      >
        <div className="fg-tl-canvas">
          <div className="fg-tl-head">
            <div className="fg-tl-corner" />
            <div className="fg-tl-axis" aria-hidden="true">
              <div className="fg-tl-axis-row">
                {axis.top.map((s) => (
                  <span key={s.key} className="fg-tl-unit" style={{ left: s.x, width: s.width }}>
                    {s.label}
                  </span>
                ))}
              </div>
              <div className="fg-tl-axis-row">
                {axis.bottom.map((s) => (
                  <span
                    key={s.key}
                    className={cx("fg-tl-tick", s.dim && "fg-tl-tick-dim")}
                    style={{ left: s.x, width: s.width }}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
              <span className="fg-tl-pill" style={{ left: todayX }}>
                {SHORT[parseIso(today).getMonth()]} {parseIso(today).getDate()}
              </span>
            </div>
          </div>
          <div className="fg-tl-layer" aria-hidden="true">
            {axis.weekends.map((w) => (
              <span key={w.x} className="fg-tl-weekend" style={{ left: w.x, width: w.width }} />
            ))}
            {axis.lines.map((l) => (
              <span
                key={l.x}
                className={cx("fg-tl-line", l.strong && "fg-tl-line-strong")}
                style={{ left: l.x }}
              />
            ))}
            <span className="fg-tl-today" style={{ left: todayX }} />
          </div>
          {rows.map((row) => {
            if (row.kind === "group") {
              return (
                <div key={`g:${row.key}`} className="fg-tl-row fg-tl-grouprow">
                  <div className="fg-tl-label">
                    <button
                      type="button"
                      className="fg-tl-toggle"
                      aria-expanded={row.open}
                      onClick={() =>
                        setFolded(
                          row.open
                            ? [...folded, row.key]
                            : [...folded].filter((k) => k !== row.key),
                        )
                      }
                    >
                      <Icon
                        icon={ArrowDown01Icon}
                        size={12}
                        variant="mono"
                        className="fg-tl-chevron"
                      />
                      {row.glyph}
                      <span className="fg-tl-name">{row.name}</span>
                    </button>
                  </div>
                  <div className="fg-tl-track" />
                </div>
              );
            }
            const r = row.record;
            const id = row.key;
            const name = acc.label(r);
            const dates = datesOf(r);
            const place = timelinePlace(dates.start, dates.end, range, zoom);
            const color = acc.color(r);
            const isCurrent = id === current;
            return (
              <div
                key={id}
                className={cx("fg-tl-row", isCurrent && "fg-tl-current")}
                style={color ? ({ "--c": color } as CSSProperties) : undefined}
              >
                <div className="fg-tl-label">
                  <button
                    type="button"
                    className="fg-tl-open"
                    data-record={id}
                    tabIndex={id === stop ? 0 : -1}
                    aria-label={`${name}, ${describe(dates)}`}
                    aria-describedby={onChange ? hintId : undefined}
                    {...(isCurrent ? { "aria-current": true } : {})}
                    onClick={() => open(id)}
                  >
                    {renderLabel ? renderLabel(r) : defaultLabel(r, name, "fg-tl-id")}
                  </button>
                </div>
                <div className="fg-tl-track">
                  {place?.kind === "bar" ? (
                    <div
                      className={cx("fg-tl-bar", onChange && "fg-tl-movable")}
                      data-bar={id}
                      title={`${name}, ${describe(dates)}`}
                      style={{ left: place.x, width: place.width }}
                      onClick={() => clickBar(id)}
                      {...dragHandlers(r)}
                    >
                      {onChange && place.width >= 3 * px && place.width >= 24 ? (
                        <>
                          <span
                            className="fg-tl-grip fg-tl-grip-start"
                            onPointerDown={(e) => grab(e, r, "start")}
                          />
                          <span
                            className="fg-tl-grip fg-tl-grip-end"
                            onPointerDown={(e) => grab(e, r, "end")}
                          />
                        </>
                      ) : null}
                      <span className="fg-tl-bar-text">{renderBar ? renderBar(r) : name}</span>
                    </div>
                  ) : place?.kind === "point" ? (
                    <div
                      className={cx("fg-tl-point", onChange && "fg-tl-movable")}
                      data-bar={id}
                      title={`${name}, ${describe(dates)}`}
                      style={{ left: place.x }}
                      onClick={() => clickBar(id)}
                      {...dragHandlers(r)}
                    >
                      <span className="fg-tl-dot" />
                      <span className="fg-tl-point-text">{renderBar ? renderBar(r) : name}</span>
                    </div>
                  ) : null}
                  {milestonesOf(r).map((m) => (
                    <span
                      key={m.id}
                      role="img"
                      aria-label={`${m.label}, ${short(m.date)}`}
                      title={`${m.label}, ${short(m.date)}`}
                      className={cx("fg-tl-milestone", m.done && "fg-tl-milestone-done")}
                      style={{ left: daysBetween(range.start, m.date) * px + px / 2 }}
                    >
                      <Icon
                        icon={m.done ? DiamondFillIcon : DiamondIcon}
                        size={12}
                        variant="mono"
                      />
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
