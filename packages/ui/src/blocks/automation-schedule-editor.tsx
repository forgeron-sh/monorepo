// When a scheduled automation runs, after the Schedule trigger of the Flows prototype: a few plain
// shapes (every n minutes, hourly, daily, on some weekdays, monthly) and cron for the rest. The
// value is always a cron expression; the line under it says it in words, with the next runs.

import { useState } from "react";
import { Input } from "../form";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { SelectMenu } from "../overlays";
import {
  cronToSpec,
  describeCron,
  nextRuns,
  specToCron,
  WEEKDAY_NAMES,
  type ScheduleSpec,
} from "./automation-model";

type Mode = ScheduleSpec["mode"];

export interface ScheduleEditorProps {
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
  disabled,
  className,
}: ScheduleEditorProps) {
  const [cron, setCron] = useControllableState({ value, defaultValue, onChange });
  const parsed = cronToSpec(cron);
  const [mode, setMode] = useState<Mode>(parsed.mode);
  // The cron tab keeps showing cron even when a plain shape could say it; otherwise the shape
  // follows the value.
  const shownMode: Mode = mode === "cron" ? "cron" : parsed.mode;
  const spec: ScheduleSpec = shownMode === "cron" ? { mode: "cron", cron } : parsed;
  const set = (next: ScheduleSpec) => setCron(specToCron(next));
  const summary = describeCron(cron);
  const runs = from && summary ? nextRuns(cron, from, preview) : [];

  const number = (
    label: string,
    v: number,
    min: number,
    max: number,
    apply: (n: number) => void,
  ) => (
    <Input
      className="fg-sched-num"
      type="number"
      mono
      aria-label={label}
      min={min}
      max={max}
      value={v}
      disabled={disabled}
      onChange={(e) => {
        const n = Math.round(Number(e.target.value));
        if (!Number.isNaN(n)) apply(Math.max(min, Math.min(max, n)));
      }}
    />
  );
  const time = (t: string, apply: (t: string) => void) => (
    <Input
      className="fg-sched-time"
      type="time"
      mono
      aria-label="Time"
      value={t}
      disabled={disabled}
      onChange={(e) => e.target.value && apply(e.target.value)}
    />
  );

  let controls = null;
  switch (spec.mode) {
    case "minutes":
      controls = (
        <>
          <span>Every</span>
          {number("Minutes", spec.every, 1, 59, (every) => set({ ...spec, every }))}
          <span>minutes</span>
        </>
      );
      break;
    case "hours":
      controls = (
        <>
          <span>Every</span>
          {number("Hours", spec.every, 1, 23, (every) => set({ ...spec, every }))}
          <span>hours, at minute</span>
          {number("Minute", spec.minute, 0, 59, (minute) => set({ ...spec, minute }))}
        </>
      );
      break;
    case "daily":
      controls = (
        <>
          <span>Every day at</span>
          {time(spec.time, (t) => set({ ...spec, time: t }))}
        </>
      );
      break;
    case "weekly":
      controls = (
        <>
          <div className="fg-sched-days" role="group" aria-label="Days">
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
                    set({
                      ...spec,
                      days: on ? spec.days.filter((x) => x !== d) : [...spec.days, d],
                    })
                  }
                >
                  {WEEKDAY_NAMES[d]!.slice(0, 2)}
                </button>
              );
            })}
          </div>
          <span>at</span>
          {time(spec.time, (t) => set({ ...spec, time: t }))}
        </>
      );
      break;
    case "monthly":
      controls = (
        <>
          <span>On day</span>
          {number("Day of the month", spec.day, 1, 28, (day) => set({ ...spec, day }))}
          <span>at</span>
          {time(spec.time, (t) => set({ ...spec, time: t }))}
        </>
      );
      break;
    case "cron":
      controls = (
        <Input
          className="fg-sched-cron"
          mono
          aria-label="Cron expression"
          aria-invalid={summary ? undefined : true}
          spellCheck={false}
          value={cron}
          disabled={disabled}
          onChange={(e) => setCron(e.target.value)}
        />
      );
      break;
  }

  return (
    <div className={cx("fg-sched", className)}>
      <Segmented
        label="Repeat"
        options={modes.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
        value={shownMode}
        onChange={(m) => {
          const next = m as Mode;
          setMode(next);
          if (next !== "cron" && next !== parsed.mode) set(defaultFor(next, parsed));
        }}
      />
      <div className="fg-sched-row">{controls}</div>
      <div className="fg-sched-summary" aria-live="polite">
        <span className={cx("fg-sched-words", !summary && "fg-sched-bad")}>
          <span aria-hidden="true">→ </span>
          {summary ?? "Not a valid cron expression: minute hour day month weekday"}
        </span>
        {summary && timezone && !timezones ? <span className="fg-sched-tz">{timezone}</span> : null}
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
        {shownMode !== "cron" ? <code className="fg-sched-expr">{cron}</code> : null}
      </div>
      {runs.length ? (
        <ol className="fg-sched-next" aria-label="Next runs">
          {runs.map((r) => (
            <li key={r}>{formatRun(r)}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
