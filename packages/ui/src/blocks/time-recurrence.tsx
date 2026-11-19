// How an event repeats, in the same shape as the schedule editor of the automations (a few plain
// choices, then a sentence and the next dates): every n days, weeks, months or years, on some
// weekdays, until a date or after a number of times.

import { Segmented, Switch } from "../controls";
import { cx } from "../cx";
import { formatLong, WEEKDAYS, weekday } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { NumberInput } from "../numbers";
import { DatePicker, SelectMenu } from "../overlays";
import {
  describeRecurrence,
  expandRecurrence,
  FREQUENCY_UNITS,
  type Recurrence,
  type RecurrenceFrequency,
} from "./time-model";

export interface RecurrenceEditorProps {
  /** The rule, or null for an event that does not repeat. */
  value?: Recurrence | null;
  defaultValue?: Recurrence | null;
  onChange?: (value: Recurrence | null) => void;
  /** The first date of the event, `YYYY-MM-DD`: the weekday and the day of the month come from it. */
  start: string;
  /** How many next dates to list. Default 3; 0 for none. */
  preview?: number;
  /** Shows the "Repeat" switch that turns the rule off. Default `true`. */
  optional?: boolean;
  /** The units offered. Default the four. */
  frequencies?: ReadonlyArray<RecurrenceFrequency>;
  disabled?: boolean;
  className?: string;
}

const WEEK = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_RULE: Recurrence = { frequency: "weekly", interval: 1, end: { kind: "never" } };

/**
 * A repetition with its sentence ("Every 2 weeks on Monday and Wednesday, until Dec 31") and the
 * dates it gives next. The weekday chips are a group of toggles; the last one cannot be removed.
 */
export function RecurrenceEditor({
  value,
  defaultValue = null,
  onChange,
  start,
  preview = 3,
  optional = true,
  frequencies = ["daily", "weekly", "monthly", "yearly"],
  disabled,
  className,
}: RecurrenceEditorProps) {
  const [rule, setRule] = useControllableState<Recurrence | null>({
    value,
    defaultValue: defaultValue ?? (optional ? null : DEFAULT_RULE),
    onChange,
  });
  const on = rule !== null;
  const r = rule ?? DEFAULT_RULE;
  const set = (patch: Partial<Recurrence>) => setRule({ ...r, ...patch });
  const days = r.weekdays?.length ? r.weekdays : [weekday(start)];
  const [one, many] = FREQUENCY_UNITS[r.frequency];
  const next = on && preview > 0 ? expandRecurrence(r, start, { limit: preview }) : [];

  return (
    <div className={cx("fg-rec", className)}>
      {optional ? (
        <Switch
          label="Repeat"
          checked={on}
          disabled={disabled}
          onChange={(e) => setRule(e.target.checked ? { ...DEFAULT_RULE } : null)}
        />
      ) : null}
      {on ? (
        <>
          <div className="fg-rec-row">
            <span>Every</span>
            <NumberInput
              className="fg-rec-num"
              label="Interval"
              value={r.interval}
              min={1}
              max={999}
              buttons={false}
              disabled={disabled}
              onChange={(n) => n !== null && set({ interval: Math.max(1, Math.round(n)) })}
            />
            <SelectMenu
              label="Unit"
              size="sm"
              value={r.frequency}
              disabled={disabled}
              options={frequencies.map((f) => ({
                value: f,
                label: r.interval === 1 ? FREQUENCY_UNITS[f][0] : FREQUENCY_UNITS[f][1],
              }))}
              onChange={(f) => {
                if (!f) return;
                const frequency = f as RecurrenceFrequency;
                const { weekdays: _drop, ...rest } = r;
                setRule(
                  frequency === "weekly"
                    ? { ...rest, frequency, weekdays: [weekday(start)] }
                    : { ...rest, frequency },
                );
              }}
            />
          </div>
          {r.frequency === "weekly" ? (
            <div className="fg-rec-days" role="group" aria-label="On these days">
              {WEEK.map((d) => {
                const pressed = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    className="fg-rec-day"
                    aria-pressed={pressed}
                    aria-label={WEEKDAYS[d]}
                    disabled={disabled || (pressed && days.length === 1)}
                    onClick={() =>
                      set({
                        weekdays: pressed ? days.filter((x) => x !== d) : [...days, d].sort(),
                      })
                    }
                  >
                    {WEEKDAYS[d]!.slice(0, 2)}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="fg-rec-end">
            <Segmented
              label="Ends"
              options={[
                { value: "never", label: "Never" },
                { value: "until", label: "On a date" },
                { value: "count", label: "After" },
              ]}
              value={r.end.kind}
              onChange={(k) =>
                set({
                  end:
                    k === "until"
                      ? {
                          kind: "until",
                          date: expandRecurrence(r, start, { limit: 10 }).pop() ?? start,
                        }
                      : k === "count"
                        ? { kind: "count", count: 10 }
                        : { kind: "never" },
                })
              }
            />
            {r.end.kind === "until" ? (
              <DatePicker
                label="Last date"
                variant="field"
                presets={[]}
                clearable={false}
                value={r.end.date}
                onChange={(date) => date && set({ end: { kind: "until", date } })}
              />
            ) : null}
            {r.end.kind === "count" ? (
              <NumberInput
                className="fg-rec-num"
                label="Number of times"
                value={r.end.count}
                min={1}
                max={999}
                buttons={false}
                suffix="times"
                disabled={disabled}
                onChange={(n) =>
                  n !== null && set({ end: { kind: "count", count: Math.max(1, Math.round(n)) } })
                }
              />
            ) : null}
          </div>
          <p className="fg-rec-summary" aria-live="polite">
            <span aria-hidden="true">→ </span>
            {describeRecurrence(r, start)}
          </p>
          {next.length ? (
            <ol className="fg-rec-next" aria-label="Next dates">
              {next.map((d) => (
                <li key={d}>{formatLong(d)}</li>
              ))}
            </ol>
          ) : null}
        </>
      ) : (
        <p className="fg-rec-summary">Does not repeat.</p>
      )}
      <span className="fg-sr">
        {on
          ? `Repeats every ${r.interval === 1 ? one : `${r.interval} ${many}`}.`
          : "Does not repeat."}
      </span>
    </div>
  );
}
