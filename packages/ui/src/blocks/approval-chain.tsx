// An approval as a chain of steps: each step has people who go one after the other or all at once,
// a status, a due date, a reminder and comments. Read-only, it shows where things stand; editable,
// it adds, removes and reorders people, switches a step between sequential and parallel, and adds
// or moves steps. The audit of what happened can sit under it.

import { ArrowDown01Icon, ArrowUp01Icon, Cancel01Icon, PlusSignIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { useState } from "react";
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
import { ParticipantList } from "./approval-participant-list";

/** A person who can be added to a chain. */
export interface ApprovalPerson {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

export interface ApprovalChainProps {
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
  className?: string;
}

const MODES = [
  { value: "sequential", label: "One by one" },
  { value: "parallel", label: "All at once" },
];

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
  className,
}: ApprovalChainProps) {
  const [steps, setSteps] = useControllableState<ReadonlyArray<ApprovalStep>>({
    value,
    defaultValue,
    onChange: (next) => onChange?.([...next]),
  });
  const names = { ...APPROVAL_STATUS_NAMES, ...statusLabels };
  const resolved = resolveChain(steps);
  const overall = chainStatus(steps);
  const progress = chainProgress(resolved);
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
    <section className={cx("fg-apc", className)} aria-label={label}>
      <header className="fg-apc-head">
        <Badge tone={APPROVAL_STATUS_MARKS[overall].tone} dot={overall === "current"}>
          {names[overall]}
        </Badge>
        <span className="fg-apc-count">
          {progress.done} of {progress.total} done
        </span>
      </header>

      {steps.length === 0 ? <p className="fg-apl-empty">{empty}</p> : null}

      <ol className="fg-apc-steps">
        {resolved.map((step, i) => {
          const status = stepStatus(step);
          const mark = APPROVAL_STATUS_MARKS[status];
          const late = today ? isOverdue(step.due, today, status) : false;
          const title = step.label ?? `${stepName} ${i + 1}`;
          const mode: StepMode = step.mode ?? "sequential";
          return (
            <li
              key={step.id}
              className={cx("fg-apc-step", `fg-apc-${status}`)}
              aria-current={status === "current" ? "step" : undefined}
            >
              <div className="fg-apc-rail" aria-hidden="true">
                <span className="fg-apc-node">
                  <Icon icon={mark.icon} size={12} variant="mono" />
                </span>
              </div>
              <div className="fg-apc-body">
                <div className="fg-apc-stephead">
                  <h3 className="fg-apc-title">{title}</h3>
                  <Badge tone={mark.tone} dot={status === "current"}>
                    {names[status]}
                  </Badge>
                  {!editable && step.participants.length > 1 ? (
                    <span className="fg-apc-mode">
                      {mode === "parallel" ? "All at once" : "One by one"}
                    </span>
                  ) : null}
                  {step.due ? (
                    <span className={cx("fg-apc-due", late && "fg-apc-late")}>
                      Due {formatShort(step.due)}
                      {late ? " · late" : ""}
                    </span>
                  ) : null}
                  <span className="fg-apc-spacer" />
                  {stepActions?.(step, i)}
                  {editable ? (
                    <>
                      <IconButton
                        icon={ArrowUp01Icon}
                        size="sm"
                        label={`Move ${title} up`}
                        disabled={i === 0}
                        onClick={() => {
                          setSteps(moveById(steps, step.id, -1));
                          setSaid(`${title} moved to position ${i}.`);
                        }}
                      />
                      <IconButton
                        icon={ArrowDown01Icon}
                        size="sm"
                        label={`Move ${title} down`}
                        disabled={i === steps.length - 1}
                        onClick={() => {
                          setSteps(moveById(steps, step.id, 1));
                          setSaid(`${title} moved to position ${i + 2}.`);
                        }}
                      />
                      <IconButton
                        icon={Cancel01Icon}
                        size="sm"
                        label={`Remove ${title}`}
                        onClick={() => {
                          setSteps(steps.filter((s) => s.id !== step.id));
                          setSaid(`${title} removed.`);
                        }}
                      />
                    </>
                  ) : null}
                </div>

                {editable ? (
                  <Segmented
                    label={`${title}: how people go`}
                    options={MODES}
                    value={mode}
                    onChange={(m) => setSteps(setStepMode(steps, step.id, m as StepMode))}
                  />
                ) : null}

                <ParticipantList
                  label={`${title}: people`}
                  value={step.participants}
                  onChange={(next) => {
                    // The statuses shown were found, not given: write back the people as given.
                    const given = steps[i]?.participants ?? [];
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

                {editable && available.length > 0 ? (
                  <div className="fg-apc-add">
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
                  </div>
                ) : null}

                <StepComments step={step} {...(onComment ? { onComment } : {})} />
              </div>
            </li>
          );
        })}
      </ol>

      {editable ? (
        <div className="fg-apc-foot">
          <Button size="sm" onClick={addStep}>
            <Icon icon={PlusSignIcon} size={12} variant="mono" />
            Add {stepName.toLowerCase()}
          </Button>
        </div>
      ) : null}

      {events && events.length > 0 ? <ApprovalAudit events={events} /> : null}

      <p className="fg-sr" role="status" aria-live="polite">
        {said}
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- comments */

function StepComments({
  step,
  onComment,
}: {
  step: ApprovalStep;
  onComment?: (stepId: string, text: string) => void;
}) {
  const [text, setText] = useState("");
  const comments = step.comments ?? [];
  if (comments.length === 0 && !onComment) return null;
  const send = () => {
    const clean = text.trim();
    if (!clean) return;
    onComment?.(step.id, clean);
    setText("");
  };
  return (
    <div className="fg-apc-comments">
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
    </div>
  );
}

/* ---------------------------------------------------------------- audit */

export interface ApprovalAuditProps {
  events: ReadonlyArray<ApprovalEvent>;
  /** The heading; "History" by default. */
  label?: string;
  /** Newest first. `true` by default. */
  newestFirst?: boolean;
  className?: string;
}

/** What happened to an approval, line by line, with the time of each. */
export function ApprovalAudit({
  events,
  label = "History",
  newestFirst = true,
  className,
}: ApprovalAuditProps) {
  const sorted = [...events].sort((a, b) =>
    newestFirst ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at),
  );
  return (
    <section className={cx("fg-aud", className)} aria-label={label}>
      <h3 className="fg-aud-title">{label}</h3>
      <Feed className="fg-aud-list">
        {sorted.map((e) => (
          <FeedItem key={e.id} className="fg-aud-item">
            <FeedIndicator tone={e.tone ?? "neutral"} />
            <FeedContent>
              <FeedTitle>
                <b>{e.actor}</b> {e.action}
              </FeedTitle>
              <FeedTime className="fg-aud-when" dateTime={e.at}>
                {formatStamp(e.at)}
              </FeedTime>
              {e.detail ? <FeedDescription>{e.detail}</FeedDescription> : null}
            </FeedContent>
          </FeedItem>
        ))}
      </Feed>
    </section>
  );
}
