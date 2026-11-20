// The issue list of the Tasks app: groups (a status, a person) folded or open, then one dense row
// per issue. The arrows move between rows, Enter opens one. A preset of `RecordList` on
// `issueFields`.

import { StatusGlyph } from "../glyphs";
import type { LabelOption, Person } from "../pickers";
import {
  issueContext,
  issueEditors,
  issueFields,
  type IssueEditingProps,
} from "./lists-issue-fields";
import type { IssueGroup, IssueProperty } from "./lists-parts";
import { RecordList, type RecordListProps } from "./records-list";
import type { IssueItem } from "./lists-parts";

export interface IssueListProps extends IssueEditingProps {
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
}

/** Issues in groups, one dense row each: what the Tasks app shows for a team, a project, a view. */
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
      groups={groups.map((g) => ({
        key: g.key,
        name: g.name,
        records: g.issues,
        ...((g.glyph ?? g.status) ? { glyph: g.glyph ?? <StatusGlyph status={g.status!} /> } : {}),
      }))}
      empty={empty}
      label={label}
      {...(onIssueChange ? { onRecordChange: onIssueChange } : {})}
      {...(editors ? { editors: issueEditors(editors)! } : {})}
      {...rest}
    />
  );
}
