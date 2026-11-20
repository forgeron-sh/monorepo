// One run, step by step, after the logs and run panels of the Flows prototype: the run in a line
// (state, number, start, duration, trigger), the steps as a waterfall (when each started and how
// long it took), and the step chosen: its error with the log and a retry, then what it took in and
// what it gave out, as JSON.

import type { IconDefinition } from "@forgeron/icons";
import { AlertCircleIcon, RefreshIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { Led } from "../led";
import { defineStatuses } from "../status-model";
import { formatDuration, statusLook, type StepStatus } from "./automation-model";
import { JsonView } from "../json-view";
import type { RunSummary } from "./automation-runs";

export interface RunStep {
  id: string;
  name: string;
  icon: IconDefinition;
  status: StepStatus;
  /** When it started, in ms after the start of the run. */
  startMs?: number;
  durationMs?: number;
  /** Items it gave out. */
  items?: number;
  /** Tries it took, when it was retried. */
  attempts?: number;
  input?: unknown;
  output?: unknown;
  error?: { code?: string; message: string; log?: ReadonlyArray<string> };
}

export interface RunDetailProps {
  run: RunSummary;
  steps: ReadonlyArray<RunStep>;
  /** The step shown on the right; by default the failed one, else the last one that ran. */
  selectedStep?: string | null;
  onSelectStep?: (id: string) => void;
  /** `Retry from here` on a failed step: runs again from it, reusing the steps before. */
  onRetry?: (stepId: string) => void;
  /** Buttons at the end of the header: replay, open in the editor. */
  actions?: ReactNode;
  className?: string;
}

const RUN_STATUS = defineStatuses({
  success: { label: "Succeeded", tone: "success" },
  error: { label: "Failed", tone: "danger" },
  running: { label: "Running", tone: "neutral" },
  queued: { label: "Queued", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "warning" },
});

/** A run: its steps as a waterfall, and the input, output and error of the one chosen. */
export function RunDetail({
  run,
  steps,
  selectedStep,
  onSelectStep,
  onRetry,
  actions,
  className,
}: RunDetailProps) {
  const ran = steps.filter((s) => s.status !== "skipped");
  const fallback =
    steps.find((s) => s.status === "error")?.id ?? ran[ran.length - 1]?.id ?? steps[0]?.id ?? null;
  const [chosen, setChosen] = useControllableState<string | null>({
    value: selectedStep,
    defaultValue: null,
    onChange: (id) => id && onSelectStep?.(id),
  });
  const current = steps.find((s) => s.id === chosen) ?? steps.find((s) => s.id === fallback);
  const [side, setSide] = useControllableState<string>({ defaultValue: "output" });
  const total = Math.max(
    run.durationMs ?? 0,
    ...steps.map((s) => (s.startMs ?? 0) + (s.durationMs ?? 0)),
    1,
  );
  const look = statusLook(run.status);

  return (
    <section className={cx("fg-rund", className)} aria-label={`Run ${run.id}`}>
      <header className="fg-rund-head">
        <Badge tone={RUN_STATUS.tone(run.status)} dot>
          {look.word}
        </Badge>
        <b className="fg-rund-id">#{run.id}</b>
        <span className="fg-rund-meta">{run.at}</span>
        <span className="fg-rund-meta">{formatDuration(run.durationMs)}</span>
        {run.trigger ? (
          <span className="fg-rund-trigger">
            {run.trigger.icon ? <Icon icon={run.trigger.icon} size={12} variant="mono" /> : null}
            {run.trigger.label}
          </span>
        ) : null}
        {actions ? <span className="fg-rund-actions">{actions}</span> : null}
      </header>
      <div className="fg-rund-body">
        <ol className="fg-rund-steps" aria-label="Steps">
          {steps.map((s) => {
            const l = statusLook(s.status);
            const left = ((s.startMs ?? 0) / total) * 100;
            const width = Math.max(((s.durationMs ?? 0) / total) * 100, 1);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={cx("fg-rund-step", `fg-rund-${s.status}`)}
                  aria-current={current?.id === s.id ? "true" : undefined}
                  onClick={() => setChosen(s.id)}
                >
                  <Led tone={l.tone} />
                  <Icon icon={s.icon} size={12} variant="mono" />
                  <span className="fg-rund-name">{s.name}</span>
                  <span className="fg-sr">{l.word}</span>
                  <span className="fg-rund-ms">
                    {s.status === "skipped" ? "—" : formatDuration(s.durationMs)}
                  </span>
                  <span className="fg-rund-track" aria-hidden="true">
                    {s.status === "skipped" ? null : (
                      <span
                        className="fg-rund-bar"
                        style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                      />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="fg-rund-panel">
          {current ? (
            <>
              <div className="fg-rund-panel-head">
                <Icon icon={current.icon} size={12} />
                <b>{current.name}</b>
                <span className="fg-rund-panel-sum">
                  {current.status === "skipped"
                    ? "Not reached in this run"
                    : [
                        statusLook(current.status).word,
                        formatDuration(current.durationMs),
                        current.items !== undefined
                          ? `${current.items} item${current.items === 1 ? "" : "s"}`
                          : null,
                        current.attempts && current.attempts > 1
                          ? `${current.attempts} tries`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </span>
                {current.status !== "skipped" ? (
                  <Segmented
                    className="fg-rund-side"
                    label="Data"
                    options={[
                      { value: "input", label: "Input" },
                      { value: "output", label: "Output" },
                    ]}
                    value={side}
                    onChange={setSide}
                  />
                ) : null}
              </div>
              {current.error && side === "output" ? (
                <div className="fg-rund-error" role="alert">
                  <div className="fg-rund-error-head">
                    <Icon icon={AlertCircleIcon} size={12} variant="mono" />
                    {current.error.code ? <code>{current.error.code}</code> : null}
                    <span>{current.error.message}</span>
                  </div>
                  {current.error.log?.length ? (
                    <pre className="fg-rund-log">{current.error.log.join("\n")}</pre>
                  ) : null}
                  {onRetry ? (
                    <div className="fg-rund-error-foot">
                      <Button size="sm" variant="primary" onClick={() => onRetry(current.id)}>
                        <Icon icon={RefreshIcon} size={12} variant="mono" />
                        Retry from here
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {current.status === "skipped" ? (
                <div className="fg-rund-none">No data: an earlier branch sent no item here.</div>
              ) : current.error && side === "output" && current.output === undefined ? null : (
                <JsonView
                  value={side === "input" ? current.input : current.output}
                  label={side === "input" ? "Input" : "Output"}
                />
              )}
            </>
          ) : (
            <div className="fg-rund-none">No step in this run.</div>
          )}
        </div>
      </div>
    </section>
  );
}
