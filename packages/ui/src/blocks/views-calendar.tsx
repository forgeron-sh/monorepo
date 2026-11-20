// The calendar of a list view, after the month grid of the Agenda prototype: Monday first, days of
// other months hatched, weekends a shade raised, today's number on ember, at most a few records a
// day and "+n more". A week mode lists every record of seven days. Records move to another day
// by drag and drop, or by Alt and the arrows.

import { ArrowLeft01Icon, ArrowRight01Icon } from "@forgeron/icons";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import {
  addDays,
  addMonths,
  formatLong,
  formatShort,
  MONTHS,
  monthGrid,
  parseIso,
  toIso,
  WEEKDAYS,
  weekday,
} from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { IconButton } from "../identity";
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

export interface CalendarViewProps<T> extends RecordAccessors<T>, RecordFieldProps<T> {
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
  className?: string;
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

/**
 * Records on the days of a month (or a week), Monday first. Arrows move between days, Enter goes
 * into a day's records, Escape back out; Alt and the arrows move a record to another day.
 */
export function CalendarView<T>({
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
  defaultSelected = null,
  onSelectedChange,
  onOpen,
  onChange,
  maxPerDay = 3,
  toolbar = true,
  label = "Calendar",
  className,
  dateField,
  ...accessors
}: CalendarViewProps<T>) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const acc = resolveAccessors(accessors);
  const { fields } = accessors;
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

  // After a move by the keyboard, the focus follows: to the day, or to the record in its new day.
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

  const days = calendarDays(date, mode);
  const byDay = new Map<string, T[]>();
  for (const r of records) {
    const d = dayOf(r);
    if (!d) continue;
    const list = byDay.get(d);
    if (list) list.push(r);
    else byDay.set(d, [r]);
  }
  const shownMonth = date.slice(0, 7);
  const weeks = Array.from({ length: days.length / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const year = parseIso(date).getFullYear();
  const title =
    mode === "month"
      ? `${MONTHS[parseIso(date).getMonth()]} ${year}`
      : `${formatShort(days[0]!)} – ${formatShort(days[6]!)}, ${parseIso(days[6]!).getFullYear()}`;

  const goDay = (next: string) => {
    focusDay.current = true;
    setDate(next);
  };
  const step = (n: number) => setDate(mode === "month" ? addMonths(date, n) : addDays(date, n * 7));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const el = event.target as HTMLElement;
    const cell = el.closest<HTMLElement>("[data-day]");
    if (!cell) return;
    const day = cell.dataset.day!;
    const arrows: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const inner = el.dataset.item !== undefined || el.dataset.more !== undefined;

    if (inner) {
      const id = el.dataset.item;
      if (event.altKey && id !== undefined && onChange && arrows[event.key] !== undefined) {
        event.preventDefault();
        const next = addDays(day, arrows[event.key]!);
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
        goDay(addDays(day, arrows[event.key]!));
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
      PageUp: () => (mode === "month" ? addMonths(day, -1) : addDays(day, -7)),
      PageDown: () => (mode === "month" ? addMonths(day, 1) : addDays(day, 7)),
      Home: () => addDays(day, -weekday(day)),
      End: () => addDays(day, 6 - weekday(day)),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    goDay(move());
  };

  const drop = (event: DragEvent<HTMLElement>, day: string) => {
    if (!dragging || !onChange) return;
    event.preventDefault();
    const record = records.find((r) => acc.id(r) === dragging);
    if (record && dayOf(record) !== day) onChange(dragging, day);
    setDragging(null);
    setTarget(null);
  };

  return (
    <div className={cx("fg-calv", mode === "week" && "fg-calv-weekmode", className)}>
      {toolbar ? (
        <div className="fg-calv-tools">
          <div className="fg-calv-nav">
            <Button variant="secondary" size="sm" onClick={() => setDate(today)}>
              Today
            </Button>
            <IconButton
              icon={ArrowLeft01Icon}
              size="sm"
              label={mode === "month" ? "Previous month" : "Previous week"}
              onClick={() => step(-1)}
            />
            <IconButton
              icon={ArrowRight01Icon}
              size="sm"
              label={mode === "month" ? "Next month" : "Next week"}
              onClick={() => step(1)}
            />
            <span className="fg-calv-title" aria-live="polite">
              {title}
            </span>
            {mode === "week" ? <span className="fg-calv-week-no">W{isoWeek(days[0]!)}</span> : null}
          </div>
          {modes.length > 1 ? (
            <Segmented
              label="Calendar mode"
              options={modes.map((m) => ({ value: m, label: MODES[m] }))}
              value={mode}
              onChange={(m) => setMode(m as CalendarMode)}
            />
          ) : null}
        </div>
      ) : null}
      {onChange ? (
        <span id={hintId} className="fg-sr">
          Alt and the arrows move a record to another day.
        </span>
      ) : null}
      <div
        ref={grid}
        role="grid"
        aria-label={`${label}, ${title}`}
        className="fg-calv-grid"
        onKeyDown={onKeyDown}
      >
        <div role="row" className="fg-calv-row">
          {WEEKDAYS.map((name) => (
            <div key={name} role="columnheader" className="fg-calv-dow" aria-label={name}>
              {name.slice(0, 3)}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} role="row" className="fg-calv-row">
            {week.map((day) => {
              const list = byDay.get(day) ?? [];
              const capped = mode === "month" && list.length > maxPerDay + 1;
              const shown = capped ? list.slice(0, maxPerDay) : list;
              const n = parseIso(day).getDate();
              return (
                <div
                  key={day}
                  role="gridcell"
                  data-day={day}
                  tabIndex={day === date ? 0 : -1}
                  aria-label={`${formatLong(day)}${list.length ? `, ${list.length} ${list.length === 1 ? "record" : "records"}` : ""}`}
                  aria-selected={day === date}
                  {...(day === today ? { "aria-current": "date" as const } : {})}
                  className={cx(
                    "fg-calv-day",
                    weekday(day) > 4 && "fg-calv-weekend",
                    mode === "month" && day.slice(0, 7) !== shownMonth && "fg-calv-out",
                    day === today && "fg-calv-today",
                    target === day && "fg-calv-target",
                  )}
                  onDragOver={(e) => {
                    if (!dragging) return;
                    e.preventDefault();
                    if (target !== day) setTarget(day);
                  }}
                  onDrop={(e) => drop(e, day)}
                >
                  <span className="fg-calv-num" aria-hidden="true">
                    {n === 1 ? formatShort(day) : n}
                  </span>
                  {shown.length ? (
                    <ul className="fg-calv-items">
                      {shown.map((r) => {
                        const id = acc.id(r);
                        const color = acc.color(r);
                        const name = acc.label(r);
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              className={cx("fg-calv-item", id === current && "fg-calv-current")}
                              data-item={id}
                              tabIndex={-1}
                              title={name}
                              draggable={onChange ? true : undefined}
                              aria-describedby={onChange ? hintId : undefined}
                              {...(id === current ? { "aria-current": true } : {})}
                              style={color ? ({ "--c": color } as CSSProperties) : undefined}
                              onClick={() => {
                                select(id);
                                onOpen?.(id);
                              }}
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", id);
                                e.dataTransfer.effectAllowed = "move";
                                setDragging(id);
                              }}
                              onDragEnd={() => {
                                setDragging(null);
                                setTarget(null);
                              }}
                            >
                              <span className="fg-calv-sq" aria-hidden="true" />
                              <span className="fg-calv-text">
                                {renderItem ? (
                                  renderItem(r)
                                ) : (
                                  <>
                                    {acc.mark(r)}
                                    {defaultLabel(r, name, "fg-calv-id")}
                                  </>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {capped ? (
                    <button
                      type="button"
                      className="fg-calv-more"
                      data-more=""
                      tabIndex={-1}
                      aria-label={`${list.length - shown.length} more on ${formatLong(day)}`}
                      onClick={() => {
                        setDate(day);
                        if (modes.includes("week")) setMode("week");
                      }}
                    >
                      +{list.length - shown.length} more
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
