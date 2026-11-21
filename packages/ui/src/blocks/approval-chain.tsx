// An approval as a chain of steps: each step has people who go one after the other or all at once,
// a status, a due date, a reminder and comments. Read-only, it shows where things stand; editable,
// it adds, removes and reorders people, switches a step between sequential and parallel, and adds
// or moves steps. The audit of what happened can sit under it.
//
// With `value` it is the usual chain. With children it is a frame, and the parts compose it:
//
//   <ApprovalChain label="Expense 214" value={steps} onChange={setSteps} editable people={people}>
//     <ApprovalChainHeader />
//     <ApprovalChainSteps
//       renderStep={(step, i) => (
//         <ApprovalChainStep step={step} index={i}>
//           <ApprovalChainRail />
//           <ApprovalChainBody>
//             <ApprovalChainStepHead />
//             <ApprovalChainModes /><ApprovalChainPeople /><ApprovalChainAdd /><ApprovalChainComments />
//           </ApprovalChainBody>
//         </ApprovalChainStep>
//       )}
//     />
//     <ApprovalChainFoot /><ApprovalChainAudit /><ApprovalChainLive />
//   </ApprovalChain>
//
// ApprovalAudit has its own parts: `ApprovalAuditTitle`, `ApprovalAuditList`, `ApprovalAuditItem`.

import { ArrowDown01Icon, ArrowUp01Icon, Cancel01Icon, PlusSignIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { createContext, Fragment, useContext, useState } from "react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Combobox } from "../combobox";
import { cx } from "../cx";
import { formatShort } from "../dates";
import { Textarea } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import {
  Feed,
  FeedContent,
  FeedDescription,
  FeedIndicator,
  FeedItem,
  FeedTime,
  FeedTitle,
} from "../timeline";
import { Segmented } from "../controls";
import {
  addParticipant,
  APPROVAL_STATUS_MARKS,
  APPROVAL_STATUS_NAMES,
  chainProgress,
  chainStatus,
  formatStamp,
  isOverdue,
  moveById,
  nextId,
  resolveChain,
  setParticipants,
  setStepMode,
  stepStatus,
  type ApprovalEvent,
  type ApprovalParticipant,
  type ApprovalStatus,
  type ApprovalStep,
  type StepMode,
} from "./approval-model";
import { part, type PartProps } from "../part";
import { ParticipantList } from "./approval-participant-list";

/** A person who can be added to a chain. */
export interface ApprovalPerson {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

export interface ApprovalChainProps extends Omit<
  PartProps<"section">,
  "children" | "onChange" | "defaultValue"
> {
  /** Names the chain: "Approval of expense 214". */
  label: string;
  value?: ReadonlyArray<ApprovalStep>;
  defaultValue?: ReadonlyArray<ApprovalStep>;
  onChange?: (steps: ApprovalStep[]) => void;
  /** Add, remove and reorder people, switch a step's mode, add and move steps. */
  editable?: boolean;
  /** Who can be added; those already in the chain are left out. */
  people?: ReadonlyArray<ApprovalPerson>;
  /** What a step is called when it has no label: "Step". */
  stepName?: string;
  /** `YYYY-MM-DD`; a step past its due date and not over is marked late. */
  today?: string;
  /** The Remind button on whoever is current. */
  onRemind?: (person: ApprovalParticipant, step: ApprovalStep) => void;
  /** Gives each step a box to write a comment in; the text goes to you. */
  onComment?: (stepId: string, text: string) => void;
  /** The audit of the approval, under the chain. */
  events?: ReadonlyArray<ApprovalEvent>;
  /** Words for the statuses. */
  statusLabels?: Partial<Record<ApprovalStatus, string>>;
  /** More at the end of a step's header: a link, a menu. */
  stepActions?: (step: ApprovalStep, index: number) => ReactNode;
  /** Written in the chain when there are no steps. */
  empty?: ReactNode;
  /** The parts (`ApprovalChainHeader`, `ApprovalChainSteps`…). Without them, the chain is built from the props. */
  children?: ReactNode;
}

const MODES = [
  { value: "sequential", label: "One by one" },
  { value: "parallel", label: "All at once" },
];

interface ChainContext {
  label: string;
  steps: ReadonlyArray<ApprovalStep>;
  setSteps: (steps: ReadonlyArray<ApprovalStep>) => void;
  resolved: ReadonlyArray<ApprovalStep>;
  names: Record<ApprovalStatus, string>;
  editable: boolean;
  stepName: string;
  today: string | undefined;
  available: ReadonlyArray<ApprovalPerson>;
  onRemind: ApprovalChainProps["onRemind"];
  onComment: ApprovalChainProps["onComment"];
  events: ReadonlyArray<ApprovalEvent> | undefined;
  stepActions: ApprovalChainProps["stepActions"];
  empty: ReactNode;
  said: string;
  setSaid: (said: string) => void;
  addStep: () => void;
}
const ChainCtx = createContext<ChainContext | null>(null);

interface StepContext {
  step: ApprovalStep;
  index: number;
  status: ApprovalStatus;
  title: string;
  mode: StepMode;
}
const StepCtx = createContext<StepContext | null>(null);

function useChain(name: string): ChainContext {
  const ctx = useContext(ChainCtx);
  if (!ctx) throw new Error(`<${name}> goes inside an <ApprovalChain>.`);
  return ctx;
}
function useStep(name: string): StepContext {
  const ctx = useContext(StepCtx);
  if (!ctx) throw new Error(`<${name}> goes inside an <ApprovalChainStep>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The overall status and how many steps are done. */
export function ApprovalChainHeader({ children, ...rest }: PartProps<"header">) {
  const { steps, resolved, names } = useChain("ApprovalChainHeader");
  const overall = chainStatus(steps);
  const progress = chainProgress(resolved);
  return part("header", "approval-chain-header", "fg-apc-head", {
    ...rest,
    children: children ?? (
      <>
        <Badge tone={APPROVAL_STATUS_MARKS[overall].tone} dot={overall === "current"}>
          {names[overall]}
        </Badge>
        <span className="fg-apc-count">
          {progress.done} of {progress.total} done
        </span>
      </>
    ),
  });
}

/** The ordered list of steps; `renderStep` draws a step your way. Says so when there is none. */
export function ApprovalChainSteps({
  renderStep,
  ...rest
}: Omit<PartProps<"ol">, "children"> & {
  renderStep?: (step: ApprovalStep, index: number) => ReactNode;
}) {
  const { resolved, steps, empty } = useChain("ApprovalChainSteps");
  return (
    <>
      {steps.length === 0 ? <p className="fg-apl-empty">{empty}</p> : null}
      {part("ol", "approval-chain-steps", "fg-apc-steps", {
        ...rest,
        children: resolved.map((step, i) => (
          <Fragment key={step.id}>
            {renderStep ? renderStep(step, i) : <ApprovalChainStep step={step} index={i} />}
          </Fragment>
        )),
      })}
    </>
  );
}

/** One step. Without children: the rail and the body with its usual parts. */
export function ApprovalChainStep({
  step,
  index,
  children,
  ...rest
}: Omit<PartProps<"li">, "children"> & {
  step: ApprovalStep;
  index: number;
  children?: ReactNode;
}) {
  const { stepName } = useChain("ApprovalChainStep");
  const status = stepStatus(step);
  const ctx: StepContext = {
    step,
    index,
    status,
    title: step.label ?? `${stepName} ${index + 1}`,
    mode: step.mode ?? "sequential",
  };
  return (
    <StepCtx.Provider value={ctx}>
      {part(
        "li",
        "approval-chain-step",
        cx("fg-apc-step", `fg-apc-${status}`),
        {
          ...rest,
          children: children ?? (
            <>
              <ApprovalChainRail />
              <ApprovalChainBody>
                <ApprovalChainStepHead />
                <ApprovalChainModes />
                <ApprovalChainPeople />
                <ApprovalChainAdd />
                <ApprovalChainComments />
              </ApprovalChainBody>
            </>
          ),
        },
        { "aria-current": status === "current" ? "step" : undefined },
      )}
    </StepCtx.Provider>
  );
}

/** The rail and the node with the step's mark. */
export function ApprovalChainRail({ children, ...rest }: PartProps<"div">) {
  const { status } = useStep("ApprovalChainRail");
  return part(
    "div",
    "approval-chain-rail",
    "fg-apc-rail",
    {
      ...rest,
      children: children ?? (
        <span className="fg-apc-node">
          <Icon icon={APPROVAL_STATUS_MARKS[status].icon} size={12} variant="mono" />
        </span>
      ),
    },
    { "aria-hidden": "true" },
  );
}

/** What is beside the rail. */
export function ApprovalChainBody(props: PartProps<"div">) {
  return part("div", "approval-chain-body", "fg-apc-body", props);
}

/** The step's name. */
export function ApprovalChainTitle({ children, ...rest }: PartProps<"h3">) {
  const { title } = useStep("ApprovalChainTitle");
  return part("h3", "approval-chain-title", "fg-apc-title", {
    ...rest,
    children: children ?? title,
  });
}

/** The step's status, as a badge. */
export function ApprovalChainStatus({ children }: { children?: ReactNode }) {
  const { names } = useChain("ApprovalChainStatus");
  const { status } = useStep("ApprovalChainStatus");
  const mark = APPROVAL_STATUS_MARKS[status];
  return (
    <Badge tone={mark.tone} dot={status === "current"}>
      {children ?? names[status]}
    </Badge>
  );
}

/** "One by one" or "All at once", for a step of several people; not when the chain is editable. */
export function ApprovalChainMode({ children, ...rest }: PartProps<"span">) {
  const { editable } = useChain("ApprovalChainMode");
  const { step, mode } = useStep("ApprovalChainMode");
  if (editable || step.participants.length <= 1) return null;
  return part("span", "approval-chain-mode", "fg-apc-mode", {
    ...rest,
    children: children ?? (mode === "parallel" ? "All at once" : "One by one"),
  });
}

/** The due date, marked late when past and not over. */
export function ApprovalChainDue({ children, ...rest }: PartProps<"span">) {
  const { today } = useChain("ApprovalChainDue");
  const { step, status } = useStep("ApprovalChainDue");
  if (!step.due) return null;
  const late = today ? isOverdue(step.due, today, status) : false;
  return part("span", "approval-chain-due", cx("fg-apc-due", late && "fg-apc-late"), {
    ...rest,
    children: children ?? (
      <>
        Due {formatShort(step.due)}
        {late ? " · late" : ""}
      </>
    ),
  });
}

/** Move up, move down and remove, for an editable chain. */
export function ApprovalChainControls() {
  const { steps, setSteps, setSaid, editable } = useChain("ApprovalChainControls");
  const { step, index, title } = useStep("ApprovalChainControls");
  if (!editable) return null;
  return (
    <>
      <IconButton
        data-slot="approval-chain-up"
        icon={ArrowUp01Icon}
        size="sm"
        label={`Move ${title} up`}
        disabled={index === 0}
        onClick={() => {
          setSteps(moveById(steps, step.id, -1));
          setSaid(`${title} moved to position ${index}.`);
        }}
      />
      <IconButton
        data-slot="approval-chain-down"
        icon={ArrowDown01Icon}
        size="sm"
        label={`Move ${title} down`}
        disabled={index === steps.length - 1}
        onClick={() => {
          setSteps(moveById(steps, step.id, 1));
          setSaid(`${title} moved to position ${index + 2}.`);
        }}
      />
      <IconButton
        data-slot="approval-chain-remove"
        icon={Cancel01Icon}
        size="sm"
        label={`Remove ${title}`}
        onClick={() => {
          setSteps(steps.filter((s) => s.id !== step.id));
          setSaid(`${title} removed.`);
        }}
      />
    </>
  );
}

/** The head of a step: its name, status, mode, due date, your `stepActions`, and the controls. */
export function ApprovalChainStepHead({ children, ...rest }: PartProps<"div">) {
  const { stepActions } = useChain("ApprovalChainStepHead");
  const { step, index } = useStep("ApprovalChainStepHead");
  return part("div", "approval-chain-step-head", "fg-apc-stephead", {
    ...rest,
    children: children ?? (
      <>
        <ApprovalChainTitle />
        <ApprovalChainStatus />
        <ApprovalChainMode />
        <ApprovalChainDue />
        <span className="fg-apc-spacer" />
        {stepActions?.(step, index)}
        <ApprovalChainControls />
      </>
    ),
  });
}

/** One by one or all at once, for an editable chain. */
export function ApprovalChainModes() {
  const { steps, setSteps, editable } = useChain("ApprovalChainModes");
  const { step, title, mode } = useStep("ApprovalChainModes");
  if (!editable) return null;
  return (
    <Segmented
      label={`${title}: how people go`}
      options={MODES}
      value={mode}
      onChange={(m) => setSteps(setStepMode(steps, step.id, m as StepMode))}
    />
  );
}

/** The people of the step, as a participant list. */
export function ApprovalChainPeople() {
  const { steps, setSteps, editable, names, onRemind } = useChain("ApprovalChainPeople");
  const { step, index, title, mode } = useStep("ApprovalChainPeople");
  return (
    <ParticipantList
      label={`${title}: people`}
      value={step.participants}
      onChange={(next) => {
        // The statuses shown were found, not given: write back the people as given.
        const given = steps[index]?.participants ?? [];
        const back = next.flatMap((p) => given.find((g) => g.id === p.id) ?? []);
        setSteps(setParticipants(steps, step.id, back));
      }}
      editable={editable}
      ordered={mode === "sequential"}
      colors={false}
      statusLabels={names}
      {...(onRemind ? { onRemind: (p: ApprovalParticipant) => onRemind(p, step) } : {})}
      empty="Nobody in this step."
    />
  );
}

/** The picker that adds a person to the step; for an editable chain with people left to add. */
export function ApprovalChainAdd(props: PartProps<"div">) {
  const { steps, setSteps, setSaid, editable, available } = useChain("ApprovalChainAdd");
  const { step, title } = useStep("ApprovalChainAdd");
  if (!editable || available.length === 0) return null;
  return part("div", "approval-chain-add", "fg-apc-add", {
    ...props,
    children: props.children ?? (
      <Combobox
        label={`Add a person to ${title}`}
        placeholder="Add a person"
        value={null}
        clearable={false}
        options={available.map((p) => ({
          value: p.id,
          label: p.name,
          ...(p.role ? { hint: p.role } : {}),
        }))}
        onChange={(id) => {
          const person = available.find((p) => p.id === id);
          if (!person) return;
          setSteps(addParticipant(steps, step.id, { ...person }));
          setSaid(`${person.name} added to ${title}.`);
        }}
      />
    ),
  });
}

/** The comments of the step and the box to write one (when the chain has `onComment`). */
export function ApprovalChainComments({ children, ...rest }: PartProps<"div">) {
  const { onComment } = useChain("ApprovalChainComments");
  const { step } = useStep("ApprovalChainComments");
  const [text, setText] = useState("");
  const comments = step.comments ?? [];
  if (comments.length === 0 && !onComment) return null;
  const send = () => {
    const clean = text.trim();
    if (!clean) return;
    onComment?.(step.id, clean);
    setText("");
  };
  return part("div", "approval-chain-comments", "fg-apc-comments", {
    ...rest,
    children: children ?? (
      <>
        {comments.length > 0 ? (
          <ul className="fg-apc-clist" aria-label="Comments">
            {comments.map((c) => (
              <li key={c.id} className="fg-apc-comment">
                <span className="fg-apc-cmeta">
                  <b>{c.author}</b> · {formatStamp(c.at)}
                </span>
                <span className="fg-apc-ctext">{c.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {onComment ? (
          <div className="fg-apc-compose">
            <Textarea
              aria-label="Write a comment"
              rows={2}
              value={text}
              placeholder="Write a comment"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button size="sm" disabled={!text.trim()} onClick={send}>
              Comment
            </Button>
          </div>
        ) : null}
      </>
    ),
  });
}

/** The button that adds a step; for an editable chain. */
export function ApprovalChainFoot({ children, ...rest }: PartProps<"div">) {
  const { editable, stepName, addStep } = useChain("ApprovalChainFoot");
  if (!editable) return null;
  return part("div", "approval-chain-foot", "fg-apc-foot", {
    ...rest,
    children: children ?? (
      <Button size="sm" onClick={addStep}>
        <Icon icon={PlusSignIcon} size={12} variant="mono" />
        Add {stepName.toLowerCase()}
      </Button>
    ),
  });
}

/** The audit of the approval, under the chain; nothing without `events`. */
export function ApprovalChainAudit() {
  const { events } = useChain("ApprovalChainAudit");
  return events && events.length > 0 ? <ApprovalAudit events={events} /> : null;
}

/** The polite line that says every change. */
export function ApprovalChainLive(props: PartProps<"p">) {
  const { said } = useChain("ApprovalChainLive");
  return part(
    "p",
    "approval-chain-live",
    "fg-sr",
    { ...props, children: props.children ?? said },
    { role: "status", "aria-live": "polite" },
  );
}

/* ---------------------------------------------------------------- the chain */

/** An approval as ordered and parallel steps with their people, due dates, reminders, comments. */
export function ApprovalChain({
  label,
  value,
  defaultValue = [],
  onChange,
  editable = false,
  people = [],
  stepName = "Step",
  today,
  onRemind,
  onComment,
  events,
  statusLabels,
  stepActions,
  empty = "No step yet.",
  children,
  className,
  asChild,
  ...rest
}: ApprovalChainProps) {
  const [steps, setSteps] = useControllableState<ReadonlyArray<ApprovalStep>>({
    value,
    defaultValue,
    onChange: (next) => onChange?.([...next]),
  });
  const names = { ...APPROVAL_STATUS_NAMES, ...statusLabels };
  const resolved = resolveChain(steps);
  const inChain = new Set(steps.flatMap((s) => s.participants.map((p) => p.id)));
  const available = people.filter((p) => !inChain.has(p.id));
  const [said, setSaid] = useState("");

  const addStep = () => {
    const id = nextId(
      steps.map((s) => s.id),
      "step",
    );
    setSteps([...steps, { id, mode: "sequential", participants: [] }]);
    setSaid(`${stepName} ${steps.length + 1} added.`);
  };

  return (
    <ChainCtx.Provider
      value={{
        label,
        steps,
        setSteps,
        resolved,
        names,
        editable,
        stepName,
        today,
        available,
        onRemind,
        onComment,
        events,
        stepActions,
        empty,
        said,
        setSaid,
        addStep,
      }}
    >
      {part(
        "section",
        "approval-chain",
        "fg-apc",
        {
          className,
          asChild,
          ...rest,
          children: children ?? (
            <>
              <ApprovalChainHeader />
              <ApprovalChainSteps />
              <ApprovalChainFoot />
              <ApprovalChainAudit />
              <ApprovalChainLive />
            </>
          ),
        },
        { "aria-label": label },
      )}
    </ChainCtx.Provider>
  );
}

/* ---------------------------------------------------------------- audit */

interface AuditContext {
  label: string;
  events: ReadonlyArray<ApprovalEvent>;
}
const AuditCtx = createContext<AuditContext | null>(null);

function useAudit(name: string): AuditContext {
  const ctx = useContext(AuditCtx);
  if (!ctx) throw new Error(`<${name}> goes inside an <ApprovalAudit>.`);
  return ctx;
}

/** The heading of the audit. */
export function ApprovalAuditTitle({ children, ...rest }: PartProps<"h3">) {
  const { label } = useAudit("ApprovalAuditTitle");
  return part("h3", "approval-audit-title", "fg-aud-title", {
    ...rest,
    children: children ?? label,
  });
}

/** One line of the audit: who did what, when, and the detail. */
export function ApprovalAuditItem({ event }: { event: ApprovalEvent }) {
  return (
    <FeedItem className="fg-aud-item" data-slot="approval-audit-item">
      <FeedIndicator tone={event.tone ?? "neutral"} />
      <FeedContent>
        <FeedTitle>
          <b>{event.actor}</b> {event.action}
        </FeedTitle>
        <FeedTime className="fg-aud-when" dateTime={event.at}>
          {formatStamp(event.at)}
        </FeedTime>
        {event.detail ? <FeedDescription>{event.detail}</FeedDescription> : null}
      </FeedContent>
    </FeedItem>
  );
}

/** The lines of the audit, as a feed. */
export function ApprovalAuditList({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { events } = useAudit("ApprovalAuditList");
  return (
    <Feed className={cx("fg-aud-list", className)} data-slot="approval-audit-list">
      {children ?? events.map((e) => <ApprovalAuditItem key={e.id} event={e} />)}
    </Feed>
  );
}

export interface ApprovalAuditProps extends Omit<PartProps<"section">, "children"> {
  events: ReadonlyArray<ApprovalEvent>;
  /** The heading; "History" by default. */
  label?: string;
  /** Newest first. `true` by default. */
  newestFirst?: boolean;
  /** The parts (`ApprovalAuditTitle`, `ApprovalAuditList`). Without them, the audit is built from the props. */
  children?: ReactNode;
}

/** What happened to an approval, line by line, with the time of each. */
export function ApprovalAudit({
  events,
  label = "History",
  newestFirst = true,
  children,
  className,
  asChild,
  ...rest
}: ApprovalAuditProps) {
  const sorted = [...events].sort((a, b) =>
    newestFirst ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at),
  );
  return (
    <AuditCtx.Provider value={{ label, events: sorted }}>
      {part(
        "section",
        "approval-audit",
        "fg-aud",
        {
          className,
          asChild,
          ...rest,
          children: children ?? (
            <>
              <ApprovalAuditTitle />
              <ApprovalAuditList />
            </>
          ),
        },
        { "aria-label": label },
      )}
    </AuditCtx.Provider>
  );
}
