// The board of the Tasks app: one column per group (a status, a person), a card per issue. Layout
// only: moving a card is the caller's, through its own menus or shortcuts. A preset of
// `RecordBoard` on `issueFields`: with children it is the root of the same parts
// (`IssueBoardColumn`, `IssueBoardCard`…, the parts of `RecordBoard` under the issue's names).

import type { HTMLAttributes, ReactNode } from "react";
import { StatusGlyph } from "../glyphs";
import type { LabelOption, Person } from "../pickers";
import {
  issueContext,
  issueEditors,
  issueFields,
  type IssueEditingProps,
} from "./lists-issue-fields";
import type { IssueGroup, IssueItem, IssueProperty } from "./lists-parts";
import { RecordBoard, RecordBoardColumn, type RecordBoardColumnProps } from "./records-board";
import type { RecordGroup } from "./records-fields";

interface IssueBoardOwn extends IssueEditingProps {
  /** The columns, in order. */
  columns: ReadonlyArray<IssueGroup>;
  labels?: ReadonlyArray<LabelOption>;
  people?: ReadonlyArray<Person>;
  /** `YYYY-MM-DD`: due dates before it read as overdue. */
  today?: string;
  /** The properties each card shows, all by default. */
  properties?: ReadonlyArray<IssueProperty>;
  /** The card marked as current. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** A click or Enter on a card. */
  onOpen?: (id: string) => void;
  /** The keys of the folded columns: a narrow strip with the name written down. */
  collapsed?: ReadonlyArray<string>;
  defaultCollapsed?: ReadonlyArray<string>;
  onCollapsedChange?: (keys: string[]) => void;
  /** Writes the number of issues next to a column's name; off by default (no counters as chrome). */
  showCounts?: boolean;
  /** Adds a + to each column's header and a "New issue" button at the end of its lane. */
  onAdd?: (columnKey: string) => void;
  /** Adds a ⋯ to each column's header. */
  onColumnMenu?: (columnKey: string) => void;
  /** Extra content at the end of a card (a project chip, an estimate). */
  renderExtra?: (issue: IssueItem) => ReactNode;
  label?: string;
  className?: string;
  /** The parts (`IssueBoardColumn`…) in place of the columns drawn from `columns`. */
  children?: ReactNode;
}

/** The block's own props, and the attributes of its root element. */
export type IssueBoardProps = IssueBoardOwn &
  Omit<HTMLAttributes<HTMLDivElement>, keyof IssueBoardOwn>;

/** A column of the board as a group of records: its issues are its records. */
const toRecords = (c: IssueGroup): RecordGroup<IssueItem> => ({
  key: c.key,
  name: c.name,
  records: c.issues,
  ...((c.glyph ?? c.status) ? { glyph: c.glyph ?? <StatusGlyph status={c.status!} /> } : {}),
});

/**
 * Issues as cards in columns: the board layout of the Tasks app. Without children it draws the
 * `columns`; with children it is the root of the parts below, which are those of `RecordBoard`.
 */
export function IssueBoard({
  columns,
  labels,
  people,
  today,
  onIssueChange,
  editors,
  label = "Board",
  ...rest
}: IssueBoardProps) {
  return (
    <RecordBoard<IssueItem>
      fields={issueFields}
      noun="issue"
      itemAttr="data-issue"
      context={issueContext(labels, people, today)}
      columns={columns.map(toRecords)}
      label={label}
      {...(onIssueChange ? { onRecordChange: onIssueChange } : {})}
      {...(editors ? { editors: issueEditors(editors)! } : {})}
      {...rest}
    />
  );
}

export type IssueBoardColumnProps = Omit<RecordBoardColumnProps<IssueItem>, "column"> & {
  /** An `IssueGroup` of the board's `columns`, or any group of issues as records. */
  column: IssueGroup | RecordGroup<IssueItem>;
};

/** One column: the `RecordBoardColumn` that takes an `IssueGroup` too. */
export function IssueBoardColumn({ column, ...rest }: IssueBoardColumnProps) {
  return (
    <RecordBoardColumn<IssueItem>
      column={"issues" in column ? toRecords(column) : column}
      {...rest}
    />
  );
}
export {
  RecordBoardAdd as IssueBoardAdd,
  RecordBoardCard as IssueBoardCard,
  RecordBoardCards as IssueBoardCards,
  RecordBoardColumnActions as IssueBoardColumnActions,
  RecordBoardColumnHeader as IssueBoardColumnHeader,
  RecordBoardColumnToggle as IssueBoardColumnToggle,
  RecordCard as IssueCard,
} from "./records-board";
