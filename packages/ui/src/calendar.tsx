import { ArrowLeft01Icon, ArrowRight01Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
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

export interface CalendarProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "className" | "children" | "defaultValue"
> {
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
  /** A span of days shown as chosen: both ends in ember, the days between in a band. */
  range?: { from: string | null; to: string | null };
  /** Names the grid, e.g. "Due date". */
  label?: string;
  className?: string;
  /** Given, `Calendar` is the root of the parts (`CalendarHeader`, `CalendarGrid`…). */
  children?: undefined;
}

/** The root of the composed calendar: the same props, and the parts as children. */
export type CalendarRootProps = Omit<CalendarProps, "children"> & { children: ReactNode };

interface CalendarState {
  focus: string;
  setFocus: (iso: string) => void;
  move: (iso: string) => void;
  today: string;
  value: string | undefined;
  range: CalendarProps["range"];
  min: string | undefined;
  max: string | undefined;
  onChange: ((value: string) => void) | undefined;
  label: string;
  title: string;
  month: number;
  grid: RefObject<HTMLTableElement | null>;
}

const CalendarContext = createContext<CalendarState | null>(null);

function useCalendar(part: string): CalendarState {
  const state = useContext(CalendarContext);
  if (!state) throw new Error(`${part} goes inside a Calendar.`);
  return state;
}

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * A month of days, Monday first. Arrows move by day and week, Page Up and Page Down by month,
 * Home and End to the ends of the week; Enter or Space chooses. Only one day is a tab stop.
 * Without children it draws `CalendarHeader` and `CalendarGrid`; with children they are yours.
 */
export function Calendar(props: CalendarProps | CalendarRootProps) {
  const {
    value,
    onChange,
    today: todayProp,
    defaultMonth,
    min,
    max,
    range,
    label = "Calendar",
    className,
    children,
    ...rest
  } = props;
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
  const month = shown.getMonth();
  const title = `${MONTHS[month]} ${shown.getFullYear()}`;

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus]);

  const state: CalendarState = {
    focus,
    setFocus,
    move: (next) => {
      moved.current = true;
      setFocus(next);
    },
    today,
    value,
    range,
    min,
    max,
    onChange,
    label,
    title,
    month,
    grid,
  };

  return (
    <CalendarContext.Provider value={state}>
      <div data-slot="calendar" {...rest} className={cx("fg-cal", className)}>
        {children ?? (
          <>
            <CalendarHeader />
            <CalendarGrid />
          </>
        )}
      </div>
    </CalendarContext.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

type Part<T> = Omit<T, "className"> & { className?: string };

export type CalendarHeaderProps = Part<ComponentProps<"div">>;

/** The row above the grid: previous month, the month's name, next month. Its children replace them. */
export function CalendarHeader({ className, children, ...rest }: CalendarHeaderProps) {
  return (
    <div data-slot="calendar-header" {...rest} className={cx("fg-cal-head", className)}>
      {children ?? (
        <>
          <CalendarPrevious />
          <CalendarTitle />
          <CalendarNext />
        </>
      )}
    </div>
  );
}

export type CalendarTitleProps = Part<ComponentProps<"span">>;

/** The month and year shown, announced when it changes. */
export function CalendarTitle({ className, children, ...rest }: CalendarTitleProps) {
  const { title } = useCalendar("CalendarTitle");
  return (
    <span
      aria-live="polite"
      data-slot="calendar-title"
      {...rest}
      className={cx("fg-cal-title", className)}
    >
      {children ?? title}
    </span>
  );
}

export interface CalendarStepProps extends Omit<
  ComponentProps<"button">,
  "children" | "className" | "onClick"
> {
  /** Names the button. */
  label?: string;
  className?: string;
}

/** The button to the month before. */
export function CalendarPrevious({
  label = "Previous month",
  className,
  ...rest
}: CalendarStepProps) {
  const { focus, setFocus } = useCalendar("CalendarPrevious");
  return (
    <IconButton
      size="sm"
      data-slot="calendar-previous"
      {...rest}
      {...(className ? { className } : {})}
      icon={ArrowLeft01Icon}
      label={label}
      onClick={() => setFocus(addMonths(focus, -1))}
    />
  );
}

/** The button to the month after. */
export function CalendarNext({ label = "Next month", className, ...rest }: CalendarStepProps) {
  const { focus, setFocus } = useCalendar("CalendarNext");
  return (
    <IconButton
      size="sm"
      data-slot="calendar-next"
      {...rest}
      {...(className ? { className } : {})}
      icon={ArrowRight01Icon}
      label={label}
      onClick={() => setFocus(addMonths(focus, 1))}
    />
  );
}

export type CalendarGridProps = Part<Omit<ComponentProps<"table">, "children">> & {
  /** Draws a day in place of the default `CalendarDay`: `(iso) => <CalendarDay date={iso} />`. */
  renderDay?: (iso: string) => ReactNode;
};

/** The month as a table: the weekday letters, six weeks of days, the keyboard of the calendar. */
export function CalendarGrid({ className, renderDay, onKeyDown, ...rest }: CalendarGridProps) {
  const { focus, move, grid, label, title, month } = useCalendar("CalendarGrid");
  const shown = parseIso(focus);
  const days = monthGrid(shown.getFullYear(), month);
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  const keys = (event: KeyboardEvent<HTMLTableElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
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

  return (
    <table
      role="grid"
      aria-label={`${label}, ${title}`}
      data-slot="calendar-grid"
      {...rest}
      ref={grid}
      className={cx("fg-cal-grid", className)}
      onKeyDown={keys}
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
            {week.map((iso) => (
              <CalendarCell key={iso} date={iso}>
                {renderDay ? renderDay(iso) : <CalendarDay date={iso} />}
              </CalendarCell>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export type CalendarCellProps = Part<ComponentProps<"td">> & { date: string };

/** A cell of the grid: it says whether its day is chosen. */
export function CalendarCell({ date, className, children, ...rest }: CalendarCellProps) {
  const { value, range } = useCalendar("CalendarCell");
  const selected =
    date === value || (range !== undefined && (date === range.from || date === range.to));
  return (
    <td
      role="gridcell"
      aria-selected={selected}
      data-slot="calendar-cell"
      {...rest}
      className={className}
    >
      {children}
    </td>
  );
}

export type CalendarDayProps = Part<Omit<ComponentProps<"button">, "children">> & {
  /** The day, `YYYY-MM-DD`. */
  date: string;
  children?: ReactNode;
};

/** One day: a button, named by its date, outlined when it is today, in ember when chosen. */
export function CalendarDay({
  date,
  className,
  children,
  onClick,
  onKeyDown,
  ...rest
}: CalendarDayProps) {
  const { focus, setFocus, today, value, range, min, max, onChange, month } =
    useCalendar("CalendarDay");
  const selected =
    date === value || (range !== undefined && (date === range.from || date === range.to));
  const between = range?.from != null && range.to != null && date > range.from && date < range.to;
  const disabled = (min !== undefined && date < min) || (max !== undefined && date > max);
  return (
    <button
      type="button"
      data-day={date}
      tabIndex={date === focus ? 0 : -1}
      disabled={disabled}
      aria-label={formatLong(date)}
      aria-current={date === today ? "date" : undefined}
      data-slot="calendar-day"
      {...rest}
      className={cx(
        "fg-cal-day",
        parseIso(date).getMonth() !== month && "fg-cal-out",
        date === today && "fg-cal-today",
        between && "fg-cal-in",
        selected && "fg-cal-on",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        setFocus(date);
        onChange?.(date);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!disabled) onChange?.(date);
        }
      }}
    >
      {children ?? parseIso(date).getDate()}
    </button>
  );
}
