import { ArrowLeft01Icon, ArrowRight01Icon } from "@forgeron/icons";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "./cx";
import {
  addDays,
  addMonths,
  formatLong,
  MONTHS,
  monthGrid,
  parseIso,
  toIso,
  WEEKDAYS,
  weekday,
} from "./dates";
import { IconButton } from "./identity";

export interface CalendarProps {
  /** The chosen day, `YYYY-MM-DD`. */
  value?: string;
  onChange?: (value: string) => void;
  /** Today, `YYYY-MM-DD`: outlined. Defaults to the device's date. */
  today?: string;
  /** The month shown first when there is no value. */
  defaultMonth?: string;
  /** Days before `min` or after `max` cannot be chosen. */
  min?: string;
  max?: string;
  /** Names the grid, e.g. "Due date". */
  label?: string;
  className?: string;
}

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * A month of days, Monday first. Arrows move by day and week, Page Up and Page Down by month,
 * Home and End to the ends of the week; Enter or Space chooses. Only one day is a tab stop.
 */
export function Calendar({
  value,
  onChange,
  today: todayProp,
  defaultMonth,
  min,
  max,
  label = "Calendar",
  className,
}: CalendarProps) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const [focus, setFocus] = useState(value ?? defaultMonth ?? today);
  // A new value from outside brings its month into view (adjusting state during render).
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value) setFocus(value);
  }
  const moved = useRef(false);
  const grid = useRef<HTMLTableElement>(null);
  const shown = parseIso(focus);
  const year = shown.getFullYear();
  const month = shown.getMonth();
  const days = monthGrid(year, month);
  const out = (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus]);

  const move = (next: string) => {
    moved.current = true;
    setFocus(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const steps: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, event.shiftKey ? 12 : 1),
      Home: () => addDays(focus, -weekday(focus)),
      End: () => addDays(focus, 6 - weekday(focus)),
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    move(step());
  };

  const title = `${MONTHS[month]} ${year}`;
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  return (
    <div className={cx("fg-cal", className)}>
      <div className="fg-cal-head">
        <IconButton
          icon={ArrowLeft01Icon}
          label="Previous month"
          size="sm"
          onClick={() => setFocus(addMonths(focus, -1))}
        />
        <span className="fg-cal-title" aria-live="polite">
          {title}
        </span>
        <IconButton
          icon={ArrowRight01Icon}
          label="Next month"
          size="sm"
          onClick={() => setFocus(addMonths(focus, 1))}
        />
      </div>
      <table
        ref={grid}
        role="grid"
        aria-label={`${label}, ${title}`}
        className="fg-cal-grid"
        onKeyDown={onKeyDown}
      >
        <thead>
          <tr>
            {LETTERS.map((letter, i) => (
              <th key={i} scope="col" abbr={WEEKDAYS[i]}>
                {letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((iso) => {
                const selected = iso === value;
                const disabled = out(iso);
                return (
                  <td key={iso} role="gridcell" aria-selected={selected}>
                    <button
                      type="button"
                      data-day={iso}
                      tabIndex={iso === focus ? 0 : -1}
                      disabled={disabled}
                      aria-label={formatLong(iso)}
                      aria-current={iso === today ? "date" : undefined}
                      className={cx(
                        "fg-cal-day",
                        parseIso(iso).getMonth() !== month && "fg-cal-out",
                        iso === today && "fg-cal-today",
                        selected && "fg-cal-on",
                      )}
                      onClick={() => {
                        setFocus(iso);
                        onChange?.(iso);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          if (!disabled) onChange?.(iso);
                        }
                      }}
                    >
                      {parseIso(iso).getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
