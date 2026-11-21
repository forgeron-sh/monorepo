// The steps of an automation as a list, for the automations that need no canvas: the trigger,
// then the steps down a rail, the branches of an If or a Switch as nested groups under a closed
// band. A step is added between two others or at the end of a list, moved up and down, removed.
// Every card is an item of one collection: Up and Down (Home, End) move between the steps, Enter
// opens one, Alt with an arrow moves it, Delete removes it.
//
// Two ways to use it. Without children it draws the list from `steps`. With children they are the
// parts, which keep the steps in the root (the tree is the root's, it feeds the keyboard):
//
//   <StepList steps={steps} onChange={setSteps} selected={id} onSelect={setId} onInsert={ask}>
//     <StepListEmpty>Start with a trigger</StepListEmpty>
//     <StepListSteps />
//   </StepList>

import { ArrowDown01Icon, ArrowUp01Icon, Delete02Icon, PlusSignIcon } from "@forgeron/icons";
import {
  createContext,
  Fragment,
  useContext,
  useState,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { useCollection, type Collection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { renderPart } from "../part";
import { sortableKeyStep } from "../sortable-model";
import {
  findStep,
  flattenSteps,
  moveStep,
  removeStep,
  type AutomationStep,
  type StepBranch,
  type StepPlace,
} from "./automation-model";
import { StepCard } from "./automation-step-card";

/* ---------------------------------------------------------------- context */

interface StepListContext {
  steps: ReadonlyArray<AutomationStep>;
  setSteps: (steps: ReadonlyArray<AutomationStep>) => void;
  collection: Collection;
  selected: string | null | undefined;
  onSelect: ((id: string) => void) | undefined;
  onInsert: ((place: StepPlace) => void) | undefined;
  editable: boolean;
  empty: ReactNode;
}

const Ctx = createContext<StepListContext | null>(null);

/** The list a part is in: its steps, its collection, what it may do. */
export function useStepList(part = "useStepList"): StepListContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <StepList>.`);
  return ctx;
}

/* ---------------------------------------------------------------- root */

export interface StepListProps extends Omit<
  ComponentProps<"section">,
  "className" | "onSelect" | "onChange" | "children"
> {
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
  /** shadcn's `asChild`: the one child element becomes the list. */
  asChild?: boolean;
  /** The parts. Without them the list is drawn from `steps`. */
  children?: ReactNode;
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
  asChild,
  children,
  onKeyDown: onKeyDownProp,
  onFocus: onFocusProp,
  ...rest
}: StepListProps) {
  const [steps, setSteps] = useControllableState<ReadonlyArray<AutomationStep>>({
    value: stepsProp,
    defaultValue: defaultSteps,
    onChange,
  });
  const editable = !readOnly;
  const [focused, setFocused] = useState<string | null>(null);
  const flat = flattenSteps(steps);
  // The arrows, Home, End and Enter are the collection's; the buttons of a card are left alone.
  const collection = useCollection({
    items: flat,
    getId: (s) => s.id,
    selectionMode: "none",
    actOnDoubleClick: false,
    focused,
    onFocusedChange: setFocused,
    onAction: (id) => onSelect?.(id),
    ignoreTarget: (target) => target.closest(".fg-step-actions") !== null,
  });

  const focusStep = (id: string) => requestAnimationFrame(() => collection.focus(id));

  // Alt with an arrow moves the step, Delete removes it; the rest is the collection's.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDownProp?.(event);
    const target = event.target as HTMLElement;
    const id = target.closest<HTMLElement>("[data-collection-item]")?.dataset.collectionItem;
    if (!id || target.closest(".fg-step-actions")) return;
    const order = flat.map((s) => s.id);
    const i = order.indexOf(id);
    const step = event.altKey && editable ? sortableKeyStep(event.key) : null;
    if (step && "delta" in step) {
      event.preventDefault();
      setSteps(moveStep(steps, id, step.delta));
      focusStep(id);
    } else if ((event.key === "Delete" || event.key === "Backspace") && editable) {
      event.preventDefault();
      const next = order[i + 1] ?? order[i - 1];
      setSteps(removeStep(steps, id));
      if (next && findStep(removeStep(steps, id), next)) focusStep(next);
    }
  };

  // A click on the button of a card puts the tab stop on that card.
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    onFocusProp?.(event);
    const id = (event.target as HTMLElement).closest<HTMLElement>("[data-collection-item]")?.dataset
      .collectionItem;
    if (id) setFocused(id);
  };

  const ctx: StepListContext = {
    steps,
    setSteps,
    collection,
    selected,
    onSelect,
    onInsert: editable ? onInsert : undefined,
    editable,
    empty,
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart("section", cx("fg-steps", className), asChild, {
        "data-slot": "step-list",
        "aria-label": label,
        ...rest,
        ...collection.getContainerProps({ onKeyDown, onFocus }),
        children: children ?? (
          <>
            <StepListEmpty />
            <StepListSteps />
          </>
        ),
      })}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

/** What an empty list says, under the root's `empty`. Nothing while there are steps. */
export function StepListEmpty({ className, children, ...rest }: ComponentProps<"div">) {
  const { steps, empty } = useStepList("StepListEmpty");
  if (steps.length > 0) return null;
  return (
    <div data-slot="step-list-empty" {...rest} className={cx("fg-steps-empty", className)}>
      {children ?? empty}
    </div>
  );
}

export interface StepListStepsProps extends ComponentProps<"ol"> {
  /** The steps of this list; default the root's. */
  list?: ReadonlyArray<AutomationStep>;
  /** The branch these steps are in: where an added step goes. */
  branch?: string;
  /** Names the add button of a branch: `Add a step to Big deal?: true`. */
  branchLabel?: string;
}

/** One list of steps, the root's or a branch's: each a `StepListItem`, with the add buttons between. */
export function StepListSteps({
  list,
  branch,
  branchLabel,
  className,
  children,
  ...rest
}: StepListStepsProps) {
  const { steps } = useStepList("StepListSteps");
  const items = list ?? steps;
  return (
    <ol data-slot="step-list-steps" {...rest} className={cx("fg-steps-list", className)}>
      {children ??
        items.map((step, index) => (
          <Fragment key={step.id}>
            {index > 0 ? (
              <StepListInsert
                place={branch ? { branch, index } : { index }}
                label={`Add a step before ${step.title}`}
              />
            ) : null}
            <StepListItem step={step} index={index} siblings={items.length} />
          </Fragment>
        ))}
      {children ? null : (
        <StepListInsert
          last
          place={branch ? { branch, index: items.length } : { index: items.length }}
          label={branchLabel ? `Add a step to ${branchLabel}` : "Add a step at the end"}
        />
      )}
    </ol>
  );
}

export interface StepListInsertProps extends Omit<ComponentProps<"li">, "onClick"> {
  /** Where the step goes. */
  place: StepPlace;
  /** Names the button. */
  label: string;
  /** The add button at the end of a list: it says `Add a step`. */
  last?: boolean;
}

/** The add button between two steps or at the end of a list. Nothing without `onInsert` on the root. */
export function StepListInsert({ place, label, last, className, ...rest }: StepListInsertProps) {
  const { onInsert } = useStepList("StepListInsert");
  if (!onInsert) return null;
  return (
    <li
      data-slot="step-list-insert"
      {...rest}
      className={cx("fg-steps-insert", last && "fg-steps-insert-end", className)}
    >
      <button
        type="button"
        className="fg-steps-add"
        aria-label={label}
        onClick={() => onInsert(place)}
      >
        <Icon icon={PlusSignIcon} size={12} variant="mono" />
        {last ? <span>Add a step</span> : null}
      </button>
    </li>
  );
}

export interface StepListItemProps extends Omit<ComponentProps<"li">, "children"> {
  step: AutomationStep;
  /** Its place among its siblings: the first cannot move up, the last down. */
  index?: number;
  siblings?: number;
  /** The card and its branches; default the card of the step, with its moves, and its branches. */
  children?: ReactNode;
}

/** One step: its card, a collection item, with move and remove buttons, and its branches below. */
export function StepListItem({
  step,
  index = 0,
  siblings = 1,
  className,
  children,
  ...rest
}: StepListItemProps) {
  const { steps, setSteps, collection, selected, onSelect, editable } = useStepList("StepListItem");
  return (
    <li
      data-slot="step-list-item"
      {...rest}
      className={cx("fg-steps-item", className)}
      data-step={step.id}
    >
      {children ?? (
        <>
          <StepCard
            {...collection.getItemProps(step.id)}
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
                    disabled={index === siblings - 1}
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
          <StepListBranches step={step} />
        </>
      )}
    </li>
  );
}

export interface StepListBranchesProps extends ComponentProps<"div"> {
  step: AutomationStep;
}

/** The paths of an If or a Switch, under the card: one `StepListBranch` each. */
export function StepListBranches({ step, className, children, ...rest }: StepListBranchesProps) {
  if (!step.branches?.length) return null;
  return (
    <div data-slot="step-list-branches" {...rest} className={cx("fg-steps-branches", className)}>
      {children ??
        step.branches.map((branch) => (
          <StepListBranch key={branch.id} step={step} branch={branch} />
        ))}
    </div>
  );
}

export interface StepListBranchProps extends Omit<ComponentProps<"section">, "children"> {
  step: AutomationStep;
  branch: StepBranch;
  children?: ReactNode;
}

/** One path: its band, `Nothing happens` when it is empty and read-only, and its steps. */
export function StepListBranch({
  step,
  branch,
  className,
  children,
  ...rest
}: StepListBranchProps) {
  const { onInsert } = useStepList("StepListBranch");
  return (
    <section
      data-slot="step-list-branch"
      aria-label={`${step.title}: ${branch.label}`}
      {...rest}
      className={cx("fg-steps-branch", className)}
    >
      {children ?? (
        <>
          <StepListBand>{branch.label}</StepListBand>
          {branch.steps.length === 0 && !onInsert ? (
            <div className="fg-steps-none">Nothing happens</div>
          ) : null}
          <StepListSteps
            list={branch.steps}
            branch={branch.id}
            branchLabel={`${step.title}: ${branch.label}`}
          />
        </>
      )}
    </section>
  );
}

/** The closed band that names a path: `true`, `false`, `billing`. */
export function StepListBand({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="step-list-band" {...rest} className={cx("fg-steps-band", className)}>
      <span>{children}</span>
    </div>
  );
}
