// The steps of an automation as a list, for the automations that need no canvas: the trigger,
// then the steps down a rail, the branches of an If or a Switch as nested groups under a closed
// band. A step is added between two others or at the end of a list, moved up and down, removed.
// Up and Down move between the steps; Alt with an arrow moves the step; Delete removes it.

import { ArrowDown01Icon, ArrowUp01Icon, Delete02Icon, PlusSignIcon } from "@forgeron/icons";
import { Fragment, type KeyboardEvent, type ReactNode } from "react";
import { useControllableState } from "../hooks/use-controllable";
import { cx } from "../cx";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import {
  findStep,
  flattenSteps,
  moveStep,
  removeStep,
  type AutomationStep,
  type StepPlace,
} from "./automation-model";
import { StepCard } from "./automation-step-card";

export interface StepListProps {
  steps?: ReadonlyArray<AutomationStep>;
  defaultSteps?: ReadonlyArray<AutomationStep>;
  /** Every move and removal, as the new tree. */
  onChange?: (steps: ReadonlyArray<AutomationStep>) => void;
  /** The id of the open step. */
  selected?: string | null;
  onSelect?: (id: string) => void;
  /**
   * Asks for a step at this place: open a StepPicker, then insert what is picked with
   * `insertStep`. Without it there is no add button.
   */
  onInsert?: (place: StepPlace) => void;
  /** No add, move or remove: a run, a published version. */
  readOnly?: boolean;
  /** Under an empty list: `Start with a trigger`. */
  empty?: ReactNode;
  label?: string;
  className?: string;
}

/** A linear automation: steps down a rail, branches nested, add, move and remove in place. */
export function StepList({
  steps: stepsProp,
  defaultSteps = [],
  onChange,
  selected,
  onSelect,
  onInsert,
  readOnly,
  empty = "No step yet",
  label = "Steps",
  className,
}: StepListProps) {
  const [steps, setSteps] = useControllableState<ReadonlyArray<AutomationStep>>({
    value: stepsProp,
    defaultValue: defaultSteps,
    onChange,
  });
  const editable = !readOnly;
  const canInsert = editable && onInsert !== undefined;

  const focusStep = (root: HTMLElement | null, id: string) =>
    requestAnimationFrame(() =>
      root?.querySelector<HTMLElement>(`[data-step="${CSS.escape(id)}"] .fg-step-main`)?.focus(),
    );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-step]");
    if (!target || !(event.target as HTMLElement).classList.contains("fg-step-main")) return;
    const id = target.dataset.step!;
    const root = event.currentTarget;
    const order = flattenSteps(steps).map((s) => s.id);
    const i = order.indexOf(id);
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown") && editable) {
      event.preventDefault();
      setSteps(moveStep(steps, id, event.key === "ArrowUp" ? -1 : 1));
      focusStep(root, id);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next =
        order[event.key === "ArrowDown" ? Math.min(i + 1, order.length - 1) : Math.max(i - 1, 0)];
      if (next) focusStep(root, next);
    } else if ((event.key === "Delete" || event.key === "Backspace") && editable) {
      event.preventDefault();
      const next = order[i + 1] ?? order[i - 1];
      setSteps(removeStep(steps, id));
      if (next && findStep(removeStep(steps, id), next)) focusStep(root, next);
    }
  };

  const insertAt = (place: StepPlace, name: string, last: boolean) =>
    canInsert ? (
      <li className={cx("fg-steps-insert", last && "fg-steps-insert-end")}>
        <button
          type="button"
          className="fg-steps-add"
          aria-label={name}
          onClick={() => onInsert(place)}
        >
          <Icon icon={PlusSignIcon} size={12} variant="mono" />
          {last ? <span>Add a step</span> : null}
        </button>
      </li>
    ) : null;

  const renderList = (
    list: ReadonlyArray<AutomationStep>,
    branch: string | undefined,
    branchLabel?: string,
  ) => (
    <ol className="fg-steps-list">
      {list.map((step, index) => {
        const place: StepPlace = branch ? { branch, index } : { index };
        return (
          <Fragment key={step.id}>
            {index > 0 ? insertAt(place, `Add a step before ${step.title}`, false) : null}
            <li className="fg-steps-item" data-step={step.id}>
              <StepCard
                title={step.title}
                icon={step.icon}
                {...(step.subtitle !== undefined ? { subtitle: step.subtitle } : {})}
                {...(step.kind ? { kind: step.kind } : {})}
                {...(step.status ? { status: step.status } : {})}
                {...(step.meta !== undefined ? { meta: step.meta } : {})}
                {...(step.error !== undefined ? { error: step.error } : {})}
                {...(step.disabled !== undefined ? { disabled: step.disabled } : {})}
                selected={selected === step.id}
                onSelect={() => onSelect?.(step.id)}
                actions={
                  editable ? (
                    <>
                      <IconButton
                        icon={ArrowUp01Icon}
                        label={`Move ${step.title} up`}
                        size="sm"
                        disabled={index === 0}
                        onClick={() => setSteps(moveStep(steps, step.id, -1))}
                      />
                      <IconButton
                        icon={ArrowDown01Icon}
                        label={`Move ${step.title} down`}
                        size="sm"
                        disabled={index === list.length - 1}
                        onClick={() => setSteps(moveStep(steps, step.id, 1))}
                      />
                      <IconButton
                        icon={Delete02Icon}
                        label={`Remove ${step.title}`}
                        size="sm"
                        onClick={() => setSteps(removeStep(steps, step.id))}
                      />
                    </>
                  ) : undefined
                }
              />
              {step.branches?.length ? (
                <div className="fg-steps-branches">
                  {step.branches.map((b) => (
                    <section
                      key={b.id}
                      className="fg-steps-branch"
                      aria-label={`${step.title}: ${b.label}`}
                    >
                      <div className="fg-steps-band">
                        <span>{b.label}</span>
                      </div>
                      {b.steps.length === 0 && !canInsert ? (
                        <div className="fg-steps-none">Nothing happens</div>
                      ) : null}
                      {renderList(b.steps, b.id, `${step.title}: ${b.label}`)}
                    </section>
                  ))}
                </div>
              ) : null}
            </li>
          </Fragment>
        );
      })}
      {insertAt(
        branch ? { branch, index: list.length } : { index: list.length },
        branchLabel ? `Add a step to ${branchLabel}` : "Add a step at the end",
        true,
      )}
    </ol>
  );

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrows between the step buttons
    <section className={cx("fg-steps", className)} aria-label={label} onKeyDown={onKeyDown}>
      {steps.length === 0 ? <div className="fg-steps-empty">{empty}</div> : null}
      {renderList(steps, undefined)}
    </section>
  );
}
