// The issue list of the Tasks app: groups (a status, a person) folded or open, then one dense row
// per issue. The arrows move between rows, Enter opens one. A preset of `RecordList` on
// `issueFields`: with children it is the root of the same parts (`IssueListGroup`,
// `IssueListRow`…, the parts of `RecordList` under the issue's names).

import type { HTMLAttributes, ReactNode } from "react";
import { StatusGlyph } from "../glyphs";
import type { LabelOption, Person } from "../pickers";
import {
  issueContext,
  issueEditors,
  issueFields,
  type IssueEditingProps,
} from "./lists-issue-fields";
import type { IssueGroup, IssueProperty } from "./lists-parts";
import type { RecordGroup } from "./records-fields";
import {
  RecordList,
  RecordListGroup,
  type RecordListGroupProps,
  type RecordListProps,
} from "./records-list";
import type { IssueItem } from "./lists-parts";

interface IssueListOwn extends IssueEditingProps {
  groups: ReadonlyArray<IssueGroup>;
  /** The labels issues refer to, with their names and colours. */
  labels?: ReadonlyArray<LabelOption>;
  /** The people issues are assigned to. */
  people?: ReadonlyArray<Person>;
  /** `YYYY-MM-DD`: due dates before it read as overdue, the year is written when it differs. */
  today?: string;
  /** The properties each row shows, all by default. The title always shows. */
  properties?: ReadonlyArray<IssueProperty>;
  /** The row marked as current; the arrows move it. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** A click or Enter on a row. */
  onOpen?: (id: string) => void;
  /** The keys of the folded groups. */
  collapsed?: ReadonlyArray<string>;
  defaultCollapsed?: ReadonlyArray<string>;
  onCollapsedChange?: (keys: string[]) => void;
  /** Shows a group with no issue; hidden by default. */
  showEmptyGroups?: boolean;
  /** Writes the number of issues next to a group's name; off by default (no counters as chrome). */
  showCounts?: boolean;
  /** Adds a + at the end of each group's header. */
  onAdd?: (groupKey: string) => void;
  /** Shown when no group has an issue. */
  empty?: RecordListProps<IssueItem>["empty"];
  /** Names the list for assistive technology. */
  label?: string;
  className?: string;
  /** The parts (`IssueListGroup`…) in place of the groups drawn from `groups`. */
  children?: ReactNode;
}

/** The block's own props, and the attributes of its root element. */
export type IssueListProps = IssueListOwn &
  Omit<HTMLAttributes<HTMLDivElement>, keyof IssueListOwn>;

/** A group of the list as a group of records: its issues are its records. */
const toRecords = (g: IssueGroup): RecordGroup<IssueItem> => ({
  key: g.key,
  name: g.name,
  records: g.issues,
  ...((g.glyph ?? g.status) ? { glyph: g.glyph ?? <StatusGlyph status={g.status!} /> } : {}),
});

/**
 * Issues in groups, one dense row each: what the Tasks app shows for a team, a project, a view.
 * Without children it draws the `groups`; with children it is the root of the parts below, which
 * are those of `RecordList`.
 */
export function IssueList({
  groups,
  labels,
  people,
  today,
  onIssueChange,
  editors,
  empty = "No issues here yet",
  label = "Issues",
  ...rest
}: IssueListProps) {
  return (
    <RecordList<IssueItem>
      fields={issueFields}
      noun="issue"
      itemAttr="data-issue"
      context={issueContext(labels, people, today)}
      groups={groups.map(toRecords)}
      empty={empty}
      label={label}
      {...(onIssueChange ? { onRecordChange: onIssueChange } : {})}
      {...(editors ? { editors: issueEditors(editors)! } : {})}
      {...rest}
    />
  );
}

export type IssueListGroupProps = Omit<RecordListGroupProps<IssueItem>, "group"> & {
  /** An `IssueGroup` of the list's `groups`, or any group of issues as records. */
  group: IssueGroup | RecordGroup<IssueItem>;
};

/** One group: the `RecordListGroup` that takes an `IssueGroup` too. */
export function IssueListGroup({ group, ...rest }: IssueListGroupProps) {
  return (
    <RecordListGroup<IssueItem> group={"issues" in group ? toRecords(group) : group} {...rest} />
  );
}
export {
  RecordListAdd as IssueListAdd,
  RecordListHeader as IssueListHeader,
  RecordListRow as IssueListRow,
  RecordListRows as IssueListRows,
  RecordListToggle as IssueListToggle,
  RecordRow as IssueRow,
} from "./records-list";
