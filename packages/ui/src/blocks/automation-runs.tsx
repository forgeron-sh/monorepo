// The runs of automations, after the Executions views of the Flows prototype: a list grouped by
// day under a closed band (state in a word and an LED, time, number, what started it, the error
// in one line, the duration), and the pixel bars of the runs of the last days, failures in red.

import type { IconDefinition } from "@forgeron/icons";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { addDays, formatShort, parseIso } from "../dates";
import { Icon } from "../icon";
import { Led } from "../led";
import { formatDuration, statusLook, type RunStatus } from "./automation-model";

/* ---------------------------------------------------------------- RunBars */

export interface RunBarsProps {
  /** Runs per period, oldest first. */
  values: ReadonlyArray<number>;
  /** Failed runs per period, drawn in red over the bar. */
  errors?: ReadonlyArray<number>;
  width?: number;
  height?: number;
  /** Names the bars (`Runs, last 14 days`); without it they are decorative. */
  label?: string;
  className?: string;
}

/** Bars of scanlines, one per period; a period without runs is a flat line; failures in red. */
export function RunBars({
  values,
  errors,
  width = 112,
  height = 24,
  label,
  className,
}: RunBarsProps) {
  const n = Math.max(values.length, 1);
  const bw = Math.max(1, Math.floor(width / n) - 1);
  const max = Math.max(...values, 1);
  let empty = "";
  let bars = "";
  let failed = "";
  values.forEach((v, i) => {
    const x = i * (bw + 1);
    if (!v) {
      empty += `M${x} ${height - 1}h${bw}v1h-${bw}z`;
      return;
    }
    const bh = Math.max(2, Math.round((v / max) * (height - 2)));
    for (let y = height - bh; y < height; y += 2) bars += `M${x} ${y}h${bw}v1h-${bw}z`;
    const e = errors?.[i] ?? 0;
    if (e > 0) {
      const eh = Math.max(3, Math.round((Math.min(v, Math.max(e, v * 0.25)) / max) * (height - 2)));
      for (let y = height - eh; y < height; y++) failed += `M${x} ${y}h${bw}v1h-${bw}z`;
    }
  });
  const total = values.reduce((a, b) => a + b, 0);
  const fails = (errors ?? []).reduce((a, b) => a + b, 0);
  return (
    <svg
      className={cx("fg-runbars", className)}
      viewBox={`0 0 ${n * (bw + 1)} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      {...(label
        ? { role: "img", "aria-label": `${label}: ${total} runs, ${fails} failed` }
        : { "aria-hidden": true })}
    >
      <path className="fg-runbars-empty" d={empty} />
      <path className="fg-runbars-ok" d={bars} />
      {failed ? <path className="fg-runbars-fail" d={failed} /> : null}
    </svg>
  );
}

/* ---------------------------------------------------------------- RunList */

export interface RunSummary {
  id: string;
  status: RunStatus;
  /** Start, local time: `YYYY-MM-DD HH:MM:SS` (or `HH:MM`). */
  at: string;
  durationMs?: number;
  /** What started it: `Schedule`, `Manual · Camille`, `Retry of #1204`. */
  trigger?: { label: string; icon?: IconDefinition };
  /** The automation, for a list across automations. */
  automation?: string;
  /** One line: the error of a failed run (`Send invoice: 503 from upstream`), else a summary. */
  detail?: string;
}

export interface RunListProps {
  /** Newest first. */
  runs: ReadonlyArray<RunSummary>;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** YYYY-MM-DD: its day and the day before read Today and Yesterday. */
  today?: string;
  /** The All / Failed switch above the list. */
  filter?: boolean;
  /** `compact`: time, state and duration only, for a column next to a run. */
  density?: "full" | "compact";
  label?: string;
  empty?: ReactNode;
  className?: string;
}

function dayName(day: string, today?: string) {
  if (today && day === today) return `Today · ${formatShort(day)}`;
  if (today && day === addDays(today, -1)) return `Yesterday · ${formatShort(day)}`;
  return formatShort(day, today ? parseIso(today).getFullYear() : undefined);
}

/** Runs by day, newest first: state, time, number, trigger, error, duration. */
export function RunList({
  runs,
  selected,
  onSelect,
  today,
  filter,
  density = "full",
  label = "Runs",
  empty = "No run yet",
  className,
}: RunListProps) {
  const [only, setOnly] = useState("all");
  const list = filter && only === "error" ? runs.filter((r) => r.status === "error") : runs;
  const days: { day: string; runs: RunSummary[] }[] = [];
  for (const run of list) {
    const day = run.at.slice(0, 10);
    const last = days[days.length - 1];
    if (last?.day === day) last.runs.push(run);
    else days.push({ day, runs: [run] });
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = [...event.currentTarget.querySelectorAll<HTMLElement>(".fg-runs-row")];
    const i = rows.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    event.preventDefault();
    rows[
      event.key === "ArrowDown" ? Math.min(i + 1, rows.length - 1) : Math.max(i - 1, 0)
    ]?.focus();
  };

  return (
    <section
      className={cx("fg-runs", density === "compact" && "fg-runs-compact", className)}
      aria-label={label}
    >
      {filter ? (
        <div className="fg-runs-bar">
          <Segmented
            label="Show"
            options={[
              { value: "all", label: "All" },
              { value: "error", label: "Failed" },
            ]}
            value={only}
            onChange={setOnly}
          />
        </div>
      ) : null}
      {list.length === 0 ? <div className="fg-runs-empty">{empty}</div> : null}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- arrows between the run buttons */}
      <div onKeyDown={onKeyDown}>
        {days.map(({ day, runs: rows }) => (
          <div key={day} className="fg-runs-group">
            <h3 className="fg-runs-day">
              <span>{dayName(day, today)}</span>
            </h3>
            <ol className="fg-runs-list">
              {rows.map((run) => {
                const look = statusLook(run.status);
                const time = run.at.slice(11, 19);
                const line = (
                  <>
                    <span className="fg-runs-state">
                      <Led tone={look.tone} />
                      <span className={density === "compact" ? "fg-sr" : undefined}>
                        {look.word}
                      </span>
                    </span>
                    <time className="fg-runs-time" dateTime={`${day}T${time}`}>
                      {time}
                    </time>
                    {density === "full" ? (
                      <>
                        <span className="fg-runs-id">#{run.id}</span>
                        <span className="fg-runs-what">
                          {run.automation ? <b>{run.automation}</b> : null}
                          {run.trigger ? (
                            <span className="fg-runs-trigger">
                              {run.trigger.icon ? (
                                <Icon icon={run.trigger.icon} size={12} variant="mono" />
                              ) : null}
                              {run.trigger.label}
                            </span>
                          ) : null}
                          {run.detail ? (
                            <span
                              className={cx(
                                "fg-runs-detail",
                                run.status === "error" && "fg-runs-detail-error",
                              )}
                            >
                              {run.detail}
                            </span>
                          ) : null}
                        </span>
                      </>
                    ) : (
                      <span className="fg-runs-id">#{run.id}</span>
                    )}
                    <span className="fg-runs-dur">{formatDuration(run.durationMs)}</span>
                  </>
                );
                return (
                  <li key={run.id} className={cx(run.status === "error" && "fg-runs-failed")}>
                    {onSelect ? (
                      <button
                        type="button"
                        className="fg-runs-row"
                        aria-current={selected === run.id ? "true" : undefined}
                        onClick={() => onSelect(run.id)}
                      >
                        {line}
                      </button>
                    ) : (
                      <div className="fg-runs-row">{line}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
