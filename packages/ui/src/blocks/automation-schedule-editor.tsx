// When a scheduled automation runs, after the Schedule trigger of the Flows prototype: a few plain
// shapes (every n minutes, hourly, daily, on some weekdays, monthly) and cron for the rest. The
// value is always a cron expression; the line under it says it in words, with the next runs.
//
// Without children it is the editor above. With children they are the parts:
//
//   <ScheduleEditor defaultValue="0 8 * * 1-5" timezone="Europe/Paris" from={now}>
//     <ScheduleEditorModes />
//     <ScheduleEditorControls />
//     <ScheduleEditorSummary />
//     <ScheduleEditorNext />
//   </ScheduleEditor>

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { Segmented, SegmentedItem } from "../controls";
import { cx } from "../cx";
import { Input } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { SelectMenu } from "../overlays";
import { renderPart } from "../part";
import {
  cronToSpec,
  describeCron,
  nextRuns,
  specToCron,
  WEEKDAY_NAMES,
  type ScheduleSpec,
} from "./automation-model";

type Mode = ScheduleSpec["mode"];

export interface ScheduleEditorProps extends Omit<
  ComponentProps<"div">,
  "className" | "onChange" | "defaultValue"
> {
  /** A cron expression: `0 8 * * 1-5`. */
  value?: string;
  defaultValue?: string;
  onChange?: (cron: string) => void;
  /** The timezone the times are read in, shown in the summary. */
  timezone?: string;
  /** Choices of timezone: a picker appears next to the summary. */
  timezones?: ReadonlyArray<string>;
  onTimezoneChange?: (timezone: string) => void;
  /** Now, as `YYYY-MM-DDTHH:MM` in the timezone: the next runs are listed after it. */
  from?: string;
  /** How many next runs to list. */
  preview?: number;
  /** The shapes offered, in order. */
  modes?: ReadonlyArray<Mode>;
  disabled?: boolean;
  className?: string;
  asChild?: boolean;
  /** The parts. Without them the editor is drawn whole. */
  children?: ReactNode;
}

interface ScheduleEditorContext {
  cron: string;
  setCron: (cron: string) => void;
  /** The shape shown: the cron tab stays on cron even when a plain shape could say it. */
  mode: Mode;
  setMode: (mode: Mode) => void;
  modes: ReadonlyArray<Mode>;
  spec: ScheduleSpec;
  /** Writes a shape as its cron expression. */
  set: (spec: ScheduleSpec) => void;
  /** The schedule in words; `null` when the expression is not valid. */
  summary: string | null;
  timezone: string | undefined;
  timezones: ReadonlyArray<string> | undefined;
  onTimezoneChange: ((timezone: string) => void) | undefined;
  runs: string[];
  disabled: boolean;
}

const Ctx = createContext<ScheduleEditorContext | null>(null);

/** The editor a part is in: its cron, its shape and its summary. */
export function useScheduleEditor(part = "useScheduleEditor"): ScheduleEditorContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <ScheduleEditor>.`);
  return ctx;
}

const MODE_LABELS: Record<Mode, string> = {
  minutes: "Minutes",
  hours: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  cron: "Cron",
};

/** Monday first, as the calendar. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const timeOf = (spec: ScheduleSpec) => ("time" in spec ? spec.time : "08:00");

function defaultFor(mode: Exclude<Mode, "cron">, from: ScheduleSpec): ScheduleSpec {
  const time = timeOf(from);
  switch (mode) {
    case "minutes":
      return { mode, every: 15 };
    case "hours":
      return { mode, every: 1, minute: 0 };
    case "daily":
      return { mode, time };
    case "weekly":
      return { mode, days: [1, 2, 3, 4, 5], time };
    case "monthly":
      return { mode, day: 1, time };
  }
}

const formatRun = (iso: string) => {
  const [day = "", time = ""] = iso.split("T");
  const [y, m, d] = day.split("-").map(Number);
  const weekday = WEEKDAY_NAMES[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]!.slice(0, 3);
  return `${weekday} ${day} ${time}`;
};

/** A schedule in a few plain shapes or in cron, said in words, with its next runs. */
export function ScheduleEditor({
  value,
  defaultValue = "0 8 * * 1-5",
  onChange,
  timezone,
  timezones,
  onTimezoneChange,
  from,
  preview = 3,
  modes = ["minutes", "hours", "daily", "weekly", "monthly", "cron"],
  disabled = false,
  className,
  asChild,
  children,
  ...rest
}: ScheduleEditorProps) {
  const [cron, setCron] = useControllableState({ value, defaultValue, onChange });
  const parsed = cronToSpec(cron);
  const [picked, setPicked] = useState<Mode>(parsed.mode);
  // The cron tab keeps showing cron even when a plain shape could say it; otherwise the shape
  // follows the value.
  const mode: Mode = picked === "cron" ? "cron" : parsed.mode;
  const spec: ScheduleSpec = mode === "cron" ? { mode: "cron", cron } : parsed;
  const summary = describeCron(cron);
  const ctx: ScheduleEditorContext = {
    cron,
    setCron,
    mode,
    setMode: (next) => {
      setPicked(next);
      if (next !== "cron" && next !== parsed.mode) setCron(specToCron(defaultFor(next, parsed)));
    },
    modes,
    spec,
    set: (next) => setCron(specToCron(next)),
    summary,
    timezone,
    timezones,
    onTimezoneChange,
    runs: from && summary ? nextRuns(cron, from, preview) : [],
    disabled,
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart("div", cx("fg-sched", className), asChild, {
        "data-slot": "schedule-editor",
        ...rest,
        children: children ?? (
          <>
            <ScheduleEditorModes />
            <ScheduleEditorControls />
            <ScheduleEditorSummary />
            <ScheduleEditorNext />
          </>
        ),
      })}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

/** The shapes offered, as segments. */
export function ScheduleEditorModes({
  className,
  ...rest
}: Omit<ComponentProps<typeof Segmented>, "options" | "value" | "onChange">) {
  const { mode, setMode, modes } = useScheduleEditor("ScheduleEditorModes");
  return (
    <Segmented
      label="Repeat"
      data-slot="schedule-editor-modes"
      {...rest}
      className={className}
      value={mode}
      onChange={(m) => setMode(m as Mode)}
    >
      {modes.map((m) => (
        <SegmentedItem key={m} value={m}>
          {MODE_LABELS[m]}
        </SegmentedItem>
      ))}
    </Segmented>
  );
}

export interface ScheduleEditorNumberProps extends Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> {
  value: number;
  min: number;
  max: number;
  /** Hears the number, rounded and kept between `min` and `max`. */
  onValueChange: (n: number) => void;
}

/** A whole number in a mono field: minutes, hours, a day of the month. */
export function ScheduleEditorNumber({
  value,
  min,
  max,
  onValueChange,
  className,
  ...rest
}: ScheduleEditorNumberProps) {
  const { disabled } = useScheduleEditor("ScheduleEditorNumber");
  return (
    <Input
      data-slot="schedule-editor-number"
      type="number"
      mono
      min={min}
      max={max}
      value={value}
      disabled={disabled}
      {...rest}
      className={cx("fg-sched-num", className)}
      onChange={(e) => {
        const n = Math.round(Number(e.target.value));
        if (!Number.isNaN(n)) onValueChange(Math.max(min, Math.min(max, n)));
      }}
    />
  );
}

export interface ScheduleEditorTimeProps extends Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> {
  /** `HH:MM`. */
  value: string;
  onValueChange: (time: string) => void;
}

/** A time of day, `HH:MM`. */
export function ScheduleEditorTime({
  value,
  onValueChange,
  className,
  ...rest
}: ScheduleEditorTimeProps) {
  const { disabled } = useScheduleEditor("ScheduleEditorTime");
  return (
    <Input
      data-slot="schedule-editor-time"
      type="time"
      mono
      aria-label="Time"
      value={value}
      disabled={disabled}
      {...rest}
      className={cx("fg-sched-time", className)}
      onChange={(e) => e.target.value && onValueChange(e.target.value)}
    />
  );
}

/** The days of the week to press, Monday first; one stays on. */
export function ScheduleEditorDays({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "children">) {
  const { spec, set, disabled } = useScheduleEditor("ScheduleEditorDays");
  if (spec.mode !== "weekly") return null;
  return (
    <div
      data-slot="schedule-editor-days"
      role="group"
      aria-label="Days"
      {...rest}
      className={cx("fg-sched-days", className)}
    >
      {WEEK.map((d) => {
        const on = spec.days.includes(d);
        return (
          <button
            key={d}
            type="button"
            className="fg-sched-day"
            aria-pressed={on}
            aria-label={WEEKDAY_NAMES[d]}
            disabled={disabled || (on && spec.days.length === 1)}
            onClick={() =>
              set({ ...spec, days: on ? spec.days.filter((x) => x !== d) : [...spec.days, d] })
            }
          >
            {WEEKDAY_NAMES[d]!.slice(0, 2)}
          </button>
        );
      })}
    </div>
  );
}

/** The cron expression, as text. */
export function ScheduleEditorCron({
  className,
  ...rest
}: Omit<ComponentProps<typeof Input>, "value" | "onChange">) {
  const { cron, setCron, summary, disabled } = useScheduleEditor("ScheduleEditorCron");
  return (
    <Input
      data-slot="schedule-editor-cron"
      mono
      aria-label="Cron expression"
      aria-invalid={summary ? undefined : true}
      spellCheck={false}
      value={cron}
      disabled={disabled}
      {...rest}
      className={cx("fg-sched-cron", className)}
      onChange={(e) => setCron(e.target.value)}
    />
  );
}

/** The fields of the shape chosen, on one row. Give it children to lay them out yourself. */
export function ScheduleEditorControls({ className, children, ...rest }: ComponentProps<"div">) {
  const { spec, set } = useScheduleEditor("ScheduleEditorControls");
  let controls: ReactNode = null;
  switch (spec.mode) {
    case "minutes":
      controls = (
        <>
          <span>Every</span>
          <ScheduleEditorNumber
            aria-label="Minutes"
            value={spec.every}
            min={1}
            max={59}
            onValueChange={(every) => set({ ...spec, every })}
          />
          <span>minutes</span>
        </>
      );
      break;
    case "hours":
      controls = (
        <>
          <span>Every</span>
          <ScheduleEditorNumber
            aria-label="Hours"
            value={spec.every}
            min={1}
            max={23}
            onValueChange={(every) => set({ ...spec, every })}
          />
          <span>hours, at minute</span>
          <ScheduleEditorNumber
            aria-label="Minute"
            value={spec.minute}
            min={0}
            max={59}
            onValueChange={(minute) => set({ ...spec, minute })}
          />
        </>
      );
      break;
    case "daily":
      controls = (
        <>
          <span>Every day at</span>
          <ScheduleEditorTime value={spec.time} onValueChange={(time) => set({ ...spec, time })} />
        </>
      );
      break;
    case "weekly":
      controls = (
        <>
          <ScheduleEditorDays />
          <span>at</span>
          <ScheduleEditorTime value={spec.time} onValueChange={(time) => set({ ...spec, time })} />
        </>
      );
      break;
    case "monthly":
      controls = (
        <>
          <span>On day</span>
          <ScheduleEditorNumber
            aria-label="Day of the month"
            value={spec.day}
            min={1}
            max={28}
            onValueChange={(day) => set({ ...spec, day })}
          />
          <span>at</span>
          <ScheduleEditorTime value={spec.time} onValueChange={(time) => set({ ...spec, time })} />
        </>
      );
      break;
    case "cron":
      controls = <ScheduleEditorCron />;
      break;
  }
  return (
    <div data-slot="schedule-editor-controls" {...rest} className={cx("fg-sched-row", className)}>
      {children ?? controls}
    </div>
  );
}

/** The schedule in words, its timezone (or a picker of them) and its expression. */
export function ScheduleEditorSummary({ className, children, ...rest }: ComponentProps<"div">) {
  const { cron, mode, summary, timezone, timezones, onTimezoneChange, disabled } =
    useScheduleEditor("ScheduleEditorSummary");
  return (
    <div
      data-slot="schedule-editor-summary"
      aria-live="polite"
      {...rest}
      className={cx("fg-sched-summary", className)}
    >
      {children ?? (
        <>
          <span className={cx("fg-sched-words", !summary && "fg-sched-bad")}>
            <span aria-hidden="true">→ </span>
            {summary ?? "Not a valid cron expression: minute hour day month weekday"}
          </span>
          {summary && timezone && !timezones ? (
            <span className="fg-sched-tz">{timezone}</span>
          ) : null}
          {timezones ? (
            <SelectMenu
              className="fg-sched-tzpick"
              label="Timezone"
              size="sm"
              options={timezones.map((t) => ({ value: t, label: t }))}
              value={timezone ?? null}
              onChange={(t) => t && onTimezoneChange?.(t)}
              disabled={disabled}
            />
          ) : null}
          {mode !== "cron" ? <code className="fg-sched-expr">{cron}</code> : null}
        </>
      )}
    </div>
  );
}

/** The next runs, as a list. Nothing without `from` or when the expression is not valid. */
export function ScheduleEditorNext({ className, ...rest }: Omit<ComponentProps<"ol">, "children">) {
  const { runs } = useScheduleEditor("ScheduleEditorNext");
  if (runs.length === 0) return null;
  return (
    <ol
      data-slot="schedule-editor-next"
      aria-label="Next runs"
      {...rest}
      className={cx("fg-sched-next", className)}
    >
      {runs.map((r) => (
        <li key={r}>{formatRun(r)}</li>
      ))}
    </ol>
  );
}
