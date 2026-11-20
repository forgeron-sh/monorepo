// The fields of an issue, described once (records-model): its status, priority, labels, people and
// due date. The issue list, the issue board, the filters and the property panel of the Tasks app
// all read them; `IssueEditingProps` is what both blocks add to the records' own editing props.

import type { ActionMenuEntry } from "../action-menu";
import { type PriorityLevel, type StatusKind } from "../glyphs";
import { priorityOptions, statusOptions } from "../pickers";
import type { IssueEditors } from "./lists-editing";
import type { IssueItem } from "./lists-parts";
import type { RecordEditors } from "./records-fields";
import { defineFields, type RecordContext } from "./records-model";
import type { LabelOption, Person } from "../pickers";

const closed = (s: StatusKind) => s === "done" || s === "canceled";

/** The fields of an `IssueItem`: what `IssueList`, `IssueBoard` and the view's menus are built on. */
export const issueFields = defineFields<IssueItem>({
  priority: {
    label: "Priority",
    kind: "enum",
    get: (r) => r.priority ?? 0,
    options: priorityOptions,
    none: "0",
    shortcut: "p",
    words: (label, value) => (value === "0" ? label : `${label} priority`),
    set: (value) => ({ priority: Number(value ?? 0) as PriorityLevel }),
    place: { row: "lead", card: "chips" },
  },
  id: {
    label: "ID",
    kind: "text",
    mono: true,
    get: (r) => r.id,
    place: { row: "lead", card: "top" },
  },
  status: {
    label: "Status",
    kind: "status",
    get: (r) => r.status,
    options: statusOptions,
    shortcut: "s",
    place: { row: "lead", card: "lead" },
  },
  title: { label: "Title", kind: "text", get: (r) => r.title },
  labels: {
    label: "Labels",
    kind: "labels",
    get: (r) => r.labels,
    shortcut: "l",
    place: { card: "chips" },
  },
  author: {
    label: "Author",
    kind: "person",
    compact: true,
    hidden: true,
    readOnly: true,
    get: (r) => r.author,
    words: (names) => (names ? `Created by ${names}` : "No author"),
    place: { card: "who" },
  },
  assignee: {
    label: "Assignee",
    kind: "person",
    empty: "No assignee",
    get: (r) => r.assignee,
    shortcut: "a",
    place: { card: "who" },
  },
  due: {
    label: "Due date",
    kind: "date",
    prefix: "Due ",
    get: (r) => r.due,
    shortcut: "d",
    late: (r, today) => r.due !== undefined && r.due < today && !closed(r.status),
    place: { card: "foot" },
  },
});

/** The editing props shared by the issue list and the issue board. */
export interface IssueEditingProps {
  /**
   * Turns editing on: every shown property becomes the trigger of its picker, and this hears the
   * change, e.g. `(id, patch) => setIssues(…)`. Absent, the rows are read-only.
   */
  onIssueChange?: (id: string, patch: Partial<IssueItem>) => void;
  /** Per property: `false` for read-only, options to restrict the choices, `render` for your own. */
  editors?: IssueEditors;
  /** S, P, A, L, D open a picker on the current row while the block has the focus; on by default. */
  shortcuts?: boolean;
  /** The actions of an issue: a right click, Shift+F10, or the ⋯ shown on hover open them. */
  rowMenu?: (issue: IssueItem) => ReadonlyArray<ActionMenuEntry>;
  /** The action chosen in `rowMenu`, with the issue's id. */
  onRowAction?: (id: string, actionId: string) => void;
}

/** The editors of an issue as the records' own: the statuses offered are `values`. */
export function issueEditors(
  editors: IssueEditors | undefined,
): RecordEditors<IssueItem> | undefined {
  if (!editors) return undefined;
  const { status, ...rest } = editors;
  return {
    ...rest,
    ...(status === undefined
      ? {}
      : {
          status:
            status === false
              ? false
              : { ...status, ...(status.statuses ? { values: status.statuses } : {}) },
        }),
  };
}

/** What an issue block hands the records' list or board besides its own props. */
export function issueContext(
  labels: ReadonlyArray<LabelOption> | undefined,
  people: ReadonlyArray<Person> | undefined,
  today: string | undefined,
): RecordContext {
  return {
    ...(labels ? { labels } : {}),
    ...(people ? { people } : {}),
    ...(today ? { today } : {}),
  };
}
