// A checklist to get started: steps with a done mark, a bar of how far along you are, and a button
// on each step that does it or marks it done. It folds to its header, and can be dismissed. The
// app owns what is done; this reports the clicks.
//
// `OnboardingChecklist` with no children builds the usual card. With children it is the root of
// the parts:
//
//   <OnboardingChecklist title="Get started" steps={steps} onMarkDone={done}>
//     <OnboardingChecklistHeader />
//     <OnboardingChecklistProgress />
//     <OnboardingChecklistBody>
//       <OnboardingChecklistComplete />
//       <OnboardingChecklistList />
//     </OnboardingChecklistBody>
//   </OnboardingChecklist>

import { ArrowDown01Icon, ArrowRight01Icon, Cancel01Icon, CheckIcon } from "@forgeron/icons";
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Progress } from "../marks";
import type { Part } from "../part";
import {
  editorChecklistProgress,
  editorNextStep,
  type EditorChecklistProgress,
} from "./editor-model";

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
  /** The parts of the checklist. Without them, the usual checklist is built from the props. */
  children?: ReactNode;
  className?: string;
}

interface ChecklistContext {
  title: string;
  steps: ReadonlyArray<OnboardingStep>;
  progress: EditorChecklistProgress;
  next: OnboardingStep | undefined;
  folded: boolean;
  setFolded: (folded: boolean) => void;
  bodyId: string;
  onMarkDone: ((id: string) => void) | undefined;
  onMarkUndone: ((id: string) => void) | undefined;
  onDismiss: (() => void) | undefined;
  completeMessage: ReactNode;
}

const Ctx = createContext<ChecklistContext | null>(null);

function useChecklist(part: string): ChecklistContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside an <OnboardingChecklist>.`);
  return ctx;
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
  children,
  className,
}: OnboardingChecklistProps) {
  const [folded, setFolded] = useControllableState<boolean>({
    ...(collapsed !== undefined ? { value: collapsed } : {}),
    defaultValue: defaultCollapsed,
    ...(onCollapsedChange ? { onChange: onCollapsedChange } : {}),
  });
  const id = useId();
  const ctx: ChecklistContext = {
    title,
    steps,
    progress: editorChecklistProgress(steps),
    next: editorNextStep(steps) ?? undefined,
    folded,
    setFolded,
    bodyId: `${id}-body`,
    onMarkDone,
    onMarkUndone,
    onDismiss,
    completeMessage,
  };
  return (
    <Ctx.Provider value={ctx}>
      <section
        data-slot="onboarding-checklist"
        className={cx("fg-edt-check", folded && "fg-edt-check-folded", className)}
        aria-label={title}
      >
        {children ?? (
          <>
            <OnboardingChecklistHeader />
            <OnboardingChecklistProgress />
            <OnboardingChecklistBody>
              <OnboardingChecklistComplete />
              <OnboardingChecklistList />
            </OnboardingChecklistBody>
          </>
        )}
      </section>
    </Ctx.Provider>
  );
}

/** The title with its count, which folds the list, and the dismiss button when the root has `onDismiss`. */
export function OnboardingChecklistHeader({
  className,
  children,
  ...rest
}: Part<ComponentProps<"header">>) {
  const c = useChecklist("OnboardingChecklistHeader");
  return (
    <header
      data-slot="onboarding-checklist-header"
      {...rest}
      className={cx("fg-edt-check-head", className)}
    >
      {children ?? (
        <>
          <OnboardingChecklistToggle />
          {c.onDismiss ? (
            <IconButton
              icon={Cancel01Icon}
              label={`Dismiss ${c.title}`}
              size="sm"
              onClick={c.onDismiss}
            />
          ) : null}
        </>
      )}
    </header>
  );
}

/** The button that folds and unfolds the body: title and "done/total". */
export function OnboardingChecklistToggle({
  className,
  children,
  ...rest
}: Part<ComponentProps<"button">>) {
  const c = useChecklist("OnboardingChecklistToggle");
  return (
    <button
      type="button"
      data-slot="onboarding-checklist-toggle"
      aria-expanded={!c.folded}
      aria-controls={c.bodyId}
      onClick={() => c.setFolded(!c.folded)}
      {...rest}
      className={cx("fg-edt-check-toggle", className)}
    >
      {children ?? (
        <>
          <Icon icon={c.folded ? ArrowRight01Icon : ArrowDown01Icon} size={12} variant="mono" />
          <span className="fg-edt-check-title">{c.title}</span>
          <span className="fg-edt-check-count">
            {c.progress.done}/{c.progress.total}
          </span>
        </>
      )}
    </button>
  );
}

/** The bar of how far along you are. */
export function OnboardingChecklistProgress({ className }: { className?: string }) {
  const { progress } = useChecklist("OnboardingChecklistProgress");
  return (
    <Progress
      label={`${progress.done} of ${progress.total} done`}
      value={progress.done}
      max={Math.max(progress.total, 1)}
      segments={Math.max(progress.total, 1)}
      tone={progress.complete ? "success" : "accent"}
      className={cx("fg-edt-check-bar", className)}
    />
  );
}

/** What folds: the message when done, then the steps. */
export function OnboardingChecklistBody({ className, ...rest }: Part<ComponentProps<"div">>) {
  const c = useChecklist("OnboardingChecklistBody");
  return (
    <div
      id={c.bodyId}
      hidden={c.folded}
      data-slot="onboarding-checklist-body"
      {...rest}
      className={cx("fg-edt-check-body", className)}
    />
  );
}

/** The line said when every step is done; nothing before. */
export function OnboardingChecklistComplete({
  className,
  children,
  ...rest
}: Part<ComponentProps<"p">>) {
  const c = useChecklist("OnboardingChecklistComplete");
  if (!c.progress.complete) return null;
  return (
    <p
      data-slot="onboarding-checklist-complete"
      {...rest}
      className={cx("fg-edt-check-done", className)}
    >
      {children ?? c.completeMessage}
    </p>
  );
}

/** The ordered list of the steps; give it your own `OnboardingChecklistStep`s or leave it to draw them all. */
export function OnboardingChecklistList({
  className,
  children,
  ...rest
}: Part<ComponentProps<"ol">>) {
  const c = useChecklist("OnboardingChecklistList");
  return (
    <ol
      data-slot="onboarding-checklist-list"
      {...rest}
      className={cx("fg-edt-check-list", className)}
    >
      {children ?? c.steps.map((s) => <OnboardingChecklistStep key={s.id} step={s} />)}
    </ol>
  );
}

export type OnboardingChecklistStepProps = Part<Omit<ComponentProps<"li">, "children">> & {
  step: OnboardingStep;
};

/** One step: its mark, its words and its buttons. */
export function OnboardingChecklistStep({
  step: s,
  className,
  ...rest
}: OnboardingChecklistStepProps) {
  const c = useChecklist("OnboardingChecklistStep");
  const isNext = !c.progress.complete && c.next?.id === s.id;
  return (
    <li
      data-slot="onboarding-checklist-step"
      aria-current={isNext ? "step" : undefined}
      {...rest}
      className={cx(
        "fg-edt-step",
        s.done && "fg-edt-step-done",
        isNext && "fg-edt-step-next",
        className,
      )}
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
          <Button size="sm" variant={isNext ? "primary" : "secondary"} onClick={s.action.onClick}>
            {s.action.label}
          </Button>
        ) : null}
        {!s.done && c.onMarkDone ? (
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Mark “${s.title}” as done`}
            onClick={() => c.onMarkDone?.(s.id)}
          >
            Mark done
          </Button>
        ) : null}
        {s.done && c.onMarkUndone ? (
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Mark “${s.title}” as not done`}
            onClick={() => c.onMarkUndone?.(s.id)}
          >
            Undo
          </Button>
        ) : null}
      </div>
    </li>
  );
}
