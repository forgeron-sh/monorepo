// A checklist to get started: steps with a done mark, a bar of how far along you are, and a button
// on each step that does it or marks it done. It folds to its header, and can be dismissed. The
// app owns what is done; this reports the clicks.

import { ArrowDown01Icon, ArrowRight01Icon, Cancel01Icon, CheckIcon } from "@forgeron/icons";
import { useId, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Progress } from "../marks";
import { editorChecklistProgress, editorNextStep } from "./editor-model";

export interface OnboardingStep {
  id: string;
  title: string;
  description?: ReactNode;
  done?: boolean;
  /** The button that does the step: "Open the editor". Absent: only "Mark done". */
  action?: { label: string; onClick: () => void };
}

export interface OnboardingChecklistProps {
  /** The heading: "Get started". */
  title: string;
  steps: ReadonlyArray<OnboardingStep>;
  /** A step was marked done by hand. */
  onMarkDone?: (id: string) => void;
  /** A done step was taken back. Without it, done steps have no button. */
  onMarkUndone?: (id: string) => void;
  /** The close button. The app hides the checklist (and remembers it). Without it, no button. */
  onDismiss?: () => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Said when every step is done. */
  completeMessage?: ReactNode;
  className?: string;
}

/** The steps to get started, how many are done, and what to do next. */
export function OnboardingChecklist({
  title,
  steps,
  onMarkDone,
  onMarkUndone,
  onDismiss,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  completeMessage = "All done. You know your way around.",
  className,
}: OnboardingChecklistProps) {
  const [folded, setFolded] = useControllableState<boolean>({
    ...(collapsed !== undefined ? { value: collapsed } : {}),
    defaultValue: defaultCollapsed,
    ...(onCollapsedChange ? { onChange: onCollapsedChange } : {}),
  });
  const id = useId();
  const progress = editorChecklistProgress(steps);
  const next = editorNextStep(steps);

  return (
    <section
      className={cx("fg-edt-check", folded && "fg-edt-check-folded", className)}
      aria-label={title}
    >
      <header className="fg-edt-check-head">
        <button
          type="button"
          className="fg-edt-check-toggle"
          aria-expanded={!folded}
          aria-controls={`${id}-body`}
          onClick={() => setFolded(!folded)}
        >
          <Icon icon={folded ? ArrowRight01Icon : ArrowDown01Icon} size={12} variant="mono" />
          <span className="fg-edt-check-title">{title}</span>
          <span className="fg-edt-check-count">
            {progress.done}/{progress.total}
          </span>
        </button>
        {onDismiss ? (
          <IconButton
            icon={Cancel01Icon}
            label={`Dismiss ${title}`}
            size="sm"
            onClick={onDismiss}
          />
        ) : null}
      </header>
      <Progress
        label={`${progress.done} of ${progress.total} done`}
        value={progress.done}
        max={Math.max(progress.total, 1)}
        segments={Math.max(progress.total, 1)}
        tone={progress.complete ? "success" : "accent"}
        className="fg-edt-check-bar"
      />
      <div id={`${id}-body`} hidden={folded} className="fg-edt-check-body">
        {progress.complete ? <p className="fg-edt-check-done">{completeMessage}</p> : null}
        <ol className="fg-edt-check-list">
          {steps.map((s) => {
            const isNext = !progress.complete && next?.id === s.id;
            return (
              <li
                key={s.id}
                className={cx(
                  "fg-edt-step",
                  s.done && "fg-edt-step-done",
                  isNext && "fg-edt-step-next",
                )}
                aria-current={isNext ? "step" : undefined}
              >
                <span className="fg-edt-step-box" aria-hidden="true">
                  {s.done ? <Icon icon={CheckIcon} size={12} variant="mono" /> : null}
                </span>
                <div className="fg-edt-step-text">
                  <span className="fg-edt-step-title">
                    {s.title}
                    {s.done ? <span className="fg-visually-hidden"> (done)</span> : null}
                  </span>
                  {s.description && !s.done ? (
                    <span className="fg-edt-step-desc">{s.description}</span>
                  ) : null}
                </div>
                <div className="fg-edt-step-actions">
                  {!s.done && s.action ? (
                    <Button
                      size="sm"
                      variant={isNext ? "primary" : "secondary"}
                      onClick={s.action.onClick}
                    >
                      {s.action.label}
                    </Button>
                  ) : null}
                  {!s.done && onMarkDone ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Mark “${s.title}” as done`}
                      onClick={() => onMarkDone(s.id)}
                    >
                      Mark done
                    </Button>
                  ) : null}
                  {s.done && onMarkUndone ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Mark “${s.title}” as not done`}
                      onClick={() => onMarkUndone(s.id)}
                    >
                      Undo
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
