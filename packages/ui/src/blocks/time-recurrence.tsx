// How an event repeats, in the same shape as the schedule editor of the automations (a few plain
// choices, then a sentence and the next dates): every n days, weeks, months or years, on some
// weekdays, until a date or after a number of times.
//
// Two ways to use it. With props it is the whole editor. With children it is the root of the parts:
//
//   <RecurrenceEditor start="2026-11-18" optional={false}>
//     <RecurrenceEditorEvery />
//     <RecurrenceEditorDays />
//     <RecurrenceEditorEnd />
//     <RecurrenceEditorSummary />
//     <RecurrenceEditorNext />
//   </RecurrenceEditor>
//
// Every part but the switch (`RecurrenceEditorToggle`) draws nothing while the event does not
// repeat, except `RecurrenceEditorSummary`, which then says so.

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { Segmented, Switch } from "../controls";
import { cx } from "../cx";
import { formatLong, WEEKDAYS, weekday } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { NumberInput } from "../numbers";
import { DatePicker, SelectMenu } from "../overlays";
import { renderPart, type Part } from "../part";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group";
import {
  describeRecurrence,
  expandRecurrence,
  FREQUENCY_UNITS,
  type Recurrence,
  type RecurrenceFrequency,
} from "./time-model";

interface RecurrenceEditorBase {
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
}

type RootAttrs = Omit<Part<ComponentProps<"div">>, "children" | "onChange" | "defaultValue"> & {
  asChild?: boolean;
};

export interface RecurrenceEditorProps extends RecurrenceEditorBase, RootAttrs {
  /** Given, `RecurrenceEditor` is the root of the parts. */
  children?: undefined;
}

export interface RecurrenceEditorRootProps extends RecurrenceEditorBase, RootAttrs {
  children: ReactNode;
}

const WEEK = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_RULE: Recurrence = { frequency: "weekly", interval: 1, end: { kind: "never" } };

interface RecurrenceState {
  /** The rule, or null when the event does not repeat. */
  rule: Recurrence | null;
  setRule: (rule: Recurrence | null) => void;
  /** Whether the event repeats. */
  on: boolean;
  /** The rule, or the default one while it is off. */
  current: Recurrence;
  /** Changes part of the rule. */
  patch: (patch: Partial<Recurrence>) => void;
  start: string;
  preview: number;
  optional: boolean;
  frequencies: ReadonlyArray<RecurrenceFrequency>;
  disabled: boolean | undefined;
}

const RecurrenceContext = createContext<RecurrenceState | null>(null);

/** The state of the `RecurrenceEditor` a part sits in: the rule and the ways to change it. */
export function useRecurrenceEditor(part = "useRecurrenceEditor"): RecurrenceState {
  const state = useContext(RecurrenceContext);
  if (!state) throw new Error(`${part} goes inside a RecurrenceEditor.`);
  return state;
}

/**
 * A repetition with its sentence ("Every 2 weeks on Monday and Wednesday, until Dec 31") and the
 * dates it gives next. The weekday chips are a group of toggles; the last one cannot be removed.
 */
export function RecurrenceEditor(props: RecurrenceEditorProps | RecurrenceEditorRootProps) {
  const {
    value,
    defaultValue = null,
    onChange,
    start,
    preview = 3,
    optional = true,
    frequencies = ["daily", "weekly", "monthly", "yearly"],
    disabled,
    className,
    asChild,
    children,
    ...rest
  } = props;
  const [rule, setRule] = useControllableState<Recurrence | null>({
    value,
    defaultValue: defaultValue ?? (optional ? null : DEFAULT_RULE),
    onChange,
  });
  const current = rule ?? DEFAULT_RULE;
  const state: RecurrenceState = {
    rule,
    setRule,
    on: rule !== null,
    current,
    patch: (patch) => setRule({ ...current, ...patch }),
    start,
    preview,
    optional,
    frequencies,
    disabled,
  };
  return (
    <RecurrenceContext.Provider value={state}>
      {renderPart("div", cx("fg-rec", className), asChild, {
        "data-slot": "recurrence-editor",
        ...rest,
        children: children ?? (
          <>
            <RecurrenceEditorToggle />
            <RecurrenceEditorEvery />
            <RecurrenceEditorDays />
            <RecurrenceEditorEnd />
            <RecurrenceEditorSummary />
            <RecurrenceEditorNext />
            <RecurrenceEditorStatus />
          </>
        ),
      })}
    </RecurrenceContext.Provider>
  );
}

type Parted<T> = Part<T> & { asChild?: boolean };

/** The "Repeat" switch that turns the rule off. Nothing when the editor is not `optional`. */
export function RecurrenceEditorToggle({ label = "Repeat" }: { label?: string }) {
  const g = useRecurrenceEditor("RecurrenceEditorToggle");
  if (!g.optional) return null;
  return (
    <Switch
      label={label}
      checked={g.on}
      disabled={g.disabled}
      onChange={(e) => g.setRule(e.target.checked ? { ...DEFAULT_RULE } : null)}
    />
  );
}

/** "Every [2] [weeks]": the interval and the unit. */
export function RecurrenceEditorEvery({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useRecurrenceEditor("RecurrenceEditorEvery");
  if (!g.on) return null;
  const r = g.current;
  return renderPart("div", cx("fg-rec-row", className), asChild, {
    "data-slot": "recurrence-editor-every",
    ...rest,
    children: children ?? (
      <>
        <span>Every</span>
        <NumberInput
          className="fg-rec-num"
          label="Interval"
          value={r.interval}
          min={1}
          max={999}
          buttons={false}
          disabled={g.disabled}
          onChange={(n) => n !== null && g.patch({ interval: Math.max(1, Math.round(n)) })}
        />
        <SelectMenu
          label="Unit"
          size="sm"
          value={r.frequency}
          disabled={g.disabled}
          options={g.frequencies.map((f) => ({
            value: f,
            label: r.interval === 1 ? FREQUENCY_UNITS[f][0] : FREQUENCY_UNITS[f][1],
          }))}
          onChange={(f) => {
            if (!f) return;
            const frequency = f as RecurrenceFrequency;
            const { weekdays: _drop, ...others } = r;
            g.setRule(
              frequency === "weekly"
                ? { ...others, frequency, weekdays: [weekday(g.start)] }
                : { ...others, frequency },
            );
          }}
        />
      </>
    ),
  });
}

/** The weekdays of a weekly rule, as a group of toggles; the last one cannot be removed. */
export function RecurrenceEditorDays({
  className,
  disabled,
  ...rest
}: Omit<ComponentProps<typeof ToggleGroup>, "value" | "onValueChange" | "type" | "children">) {
  const g = useRecurrenceEditor("RecurrenceEditorDays");
  if (!g.on || g.current.frequency !== "weekly") return null;
  const days = g.current.weekdays?.length ? g.current.weekdays : [weekday(g.start)];
  return (
    <ToggleGroup
      type="multiple"
      size="sm"
      aria-label="On these days"
      data-slot="recurrence-editor-days"
      {...rest}
      className={cx("fg-rec-days", className)}
      disabled={disabled ?? g.disabled}
      value={days.map(String)}
      onValueChange={(next) => {
        // At least one weekday stays on.
        if (next.length === 0) return;
        g.patch({ weekdays: next.map(Number).sort() });
      }}
    >
      {WEEK.map((d) => (
        <ToggleGroupItem key={d} value={String(d)} className="fg-rec-day" aria-label={WEEKDAYS[d]}>
          {WEEKDAYS[d]!.slice(0, 2)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** When it stops: never, on a date, or after a number of times. */
export function RecurrenceEditorEnd({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useRecurrenceEditor("RecurrenceEditorEnd");
  if (!g.on) return null;
  const r = g.current;
  return renderPart("div", cx("fg-rec-end", className), asChild, {
    "data-slot": "recurrence-editor-end",
    ...rest,
    children: children ?? (
      <>
        <Segmented
          label="Ends"
          options={[
            { value: "never", label: "Never" },
            { value: "until", label: "On a date" },
            { value: "count", label: "After" },
          ]}
          value={r.end.kind}
          onChange={(k) =>
            g.patch({
              end:
                k === "until"
                  ? {
                      kind: "until",
                      date: expandRecurrence(r, g.start, { limit: 10 }).pop() ?? g.start,
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
            onChange={(date) => date && g.patch({ end: { kind: "until", date } })}
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
            disabled={g.disabled}
            onChange={(n) =>
              n !== null && g.patch({ end: { kind: "count", count: Math.max(1, Math.round(n)) } })
            }
          />
        ) : null}
      </>
    ),
  });
}

/** The rule in a sentence: "Every 2 weeks on Monday and Wednesday"; "Does not repeat." when off. */
export function RecurrenceEditorSummary({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"p">>) {
  const g = useRecurrenceEditor("RecurrenceEditorSummary");
  return renderPart("p", cx("fg-rec-summary", className), asChild, {
    "data-slot": "recurrence-editor-summary",
    ...(g.on ? { "aria-live": "polite" } : {}),
    ...rest,
    children:
      children ??
      (g.on ? (
        <>
          <span aria-hidden="true">→ </span>
          {describeRecurrence(g.current, g.start)}
        </>
      ) : (
        "Does not repeat."
      )),
  });
}

/** The next dates the rule gives, as a list. */
export function RecurrenceEditorNext({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"ol">>) {
  const g = useRecurrenceEditor("RecurrenceEditorNext");
  const next =
    g.on && g.preview > 0 ? expandRecurrence(g.current, g.start, { limit: g.preview }) : [];
  if (next.length === 0) return null;
  return renderPart("ol", cx("fg-rec-next", className), asChild, {
    "data-slot": "recurrence-editor-next",
    "aria-label": "Next dates",
    ...rest,
    children: children ?? next.map((d) => <li key={d}>{formatLong(d)}</li>),
  });
}

/** What assistive technology hears: "Repeats every 2 weeks." */
export function RecurrenceEditorStatus({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"span">>) {
  const g = useRecurrenceEditor("RecurrenceEditorStatus");
  const [one, many] = FREQUENCY_UNITS[g.current.frequency];
  return renderPart("span", cx("fg-sr", className), asChild, {
    "data-slot": "recurrence-editor-status",
    ...rest,
    children:
      children ??
      (g.on
        ? `Repeats every ${g.current.interval === 1 ? one : `${g.current.interval} ${many}`}.`
        : "Does not repeat."),
  });
}
