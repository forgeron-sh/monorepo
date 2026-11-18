// What the issue list and the issue board share: the shape of an issue, its group, and the small
// pieces of a row or a card (labels, due date, assignee).

import type { ReactNode } from "react";
import { Avatar } from "../avatar";
import { formatShort, parseIso } from "../dates";
import { type PriorityLevel, type StatusKind } from "../glyphs";
import { PRIORITY_NAMES, STATUS_NAMES, type LabelOption, type Person } from "../pickers";
import { cx } from "../cx";

/** An issue as a list or a board shows it. */
export interface IssueItem {
  /** The identifier, e.g. `OPS-40`: shown in mono, and the key of the row. */
  id: string;
  title: string;
  status: StatusKind;
  /** 0 or absent: no priority. */
  priority?: PriorityLevel;
  /** Values of `labels` given to the list or the board. */
  labels?: ReadonlyArray<string>;
  /** `YYYY-MM-DD`. Before `today` and not closed, it reads as overdue. */
  due?: string;
  /** The id of a person of `people`; `null` or absent: nobody. */
  assignee?: string | null;
  /** Who wrote it: the id of a person of `people`. Shown only when `properties` asks for it. */
  author?: string | null;
}

/** A group of the list or a column of the board: the issues of one status, one person… */
export interface IssueGroup {
  key: string;
  name: string;
  /** Draws the status mark before the name. */
  status?: StatusKind;
  /** Any other mark before the name (an avatar, a swatch); wins over `status`. */
  glyph?: ReactNode;
  issues: ReadonlyArray<IssueItem>;
}

/**
 * The properties a row or a card can show. The identifier, status and title of a card always
 * show. `author` shows only when asked for; the others by default.
 */
export type IssueProperty = "id" | "priority" | "status" | "labels" | "due" | "assignee" | "author";

const ALL_PROPERTIES: ReadonlyArray<IssueProperty> = [
  "id",
  "priority",
  "status",
  "labels",
  "due",
  "assignee",
];

export interface IssueContext {
  labels: ReadonlyMap<string, LabelOption>;
  people: ReadonlyMap<string, Person>;
  /** The same, as given: the choices of the pickers. */
  labelList: ReadonlyArray<LabelOption>;
  peopleList: ReadonlyArray<Person>;
  today: string | undefined;
  shows: (p: IssueProperty) => boolean;
}

export function issueContext(
  labels: ReadonlyArray<LabelOption> | undefined,
  people: ReadonlyArray<Person> | undefined,
  today: string | undefined,
  properties: ReadonlyArray<IssueProperty> | undefined,
): IssueContext {
  const shown = new Set(properties ?? ALL_PROPERTIES);
  return {
    labels: new Map((labels ?? []).map((l) => [l.value, l])),
    people: new Map((people ?? []).map((p) => [p.id, p])),
    labelList: labels ?? [],
    peopleList: people ?? [],
    today,
    shows: (p) => shown.has(p),
  };
}

const closed = (s: StatusKind) => s === "done" || s === "canceled";

const isOverdue = (issue: IssueItem, today: string | undefined) =>
  today !== undefined && issue.due !== undefined && issue.due < today && !closed(issue.status);

export const thisYear = (today: string | undefined) =>
  today === undefined ? undefined : parseIso(today).getFullYear();

/** Words for assistive technology that the marks of a row only draw. */
export const statusWords = (s: StatusKind) => STATUS_NAMES[s];
export const priorityWords = (p: PriorityLevel) =>
  p === 0 ? PRIORITY_NAMES[0] : `${PRIORITY_NAMES[p]} priority`;

export function LabelChips({ issue, ctx }: { issue: IssueItem; ctx: IssueContext }) {
  return (
    <>
      {(issue.labels ?? []).map((value) => {
        const l = ctx.labels.get(value);
        return (
          <span key={value} className="fg-issue-chip">
            <span
              className="fg-swatch-mark"
              style={{ background: l?.color ?? "var(--ink-dim)" }}
              aria-hidden="true"
            />
            {l?.label ?? value}
          </span>
        );
      })}
    </>
  );
}

export function Assignee({ issue, ctx }: { issue: IssueItem; ctx: IssueContext }) {
  const person = issue.assignee ? ctx.people.get(issue.assignee) : undefined;
  if (!person) {
    return (
      <span className="fg-issue-who">
        <span className="fg-issue-nobody" aria-hidden="true" />
        <span className="fg-sr">No assignee</span>
      </span>
    );
  }
  return (
    <span className="fg-issue-who" title={person.name}>
      <Avatar name={person.name} size={18} {...(person.src ? { src: person.src } : {})} />
      <span className="fg-sr">{person.name}</span>
    </span>
  );
}

/** Who wrote the issue: a smaller face, framed, so it never reads as the assignee. */
export function Author({ issue, ctx }: { issue: IssueItem; ctx: IssueContext }) {
  const person = issue.author ? ctx.people.get(issue.author) : undefined;
  const words = person ? `Created by ${person.name}` : "No author";
  return (
    <span className="fg-issue-who fg-issue-author" title={words}>
      {person ? (
        <Avatar name={person.name} size={14} {...(person.src ? { src: person.src } : {})} />
      ) : (
        <span className="fg-issue-nobody" aria-hidden="true" />
      )}
      <span className="fg-sr">{words}</span>
    </span>
  );
}

export function Due({
  issue,
  ctx,
  prefix,
  className,
}: {
  issue: IssueItem;
  ctx: IssueContext;
  prefix?: string;
  className: string;
}) {
  if (!issue.due) return <span className={className} />;
  const late = isOverdue(issue, ctx.today);
  return (
    <span className={cx(className, late && "fg-issue-overdue")}>
      {prefix}
      {formatShort(issue.due, thisYear(ctx.today))}
      {late ? <span className="fg-sr">, overdue</span> : null}
    </span>
  );
}
