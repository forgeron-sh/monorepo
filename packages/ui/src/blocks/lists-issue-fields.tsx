// One property of an issue in a row or a card, editable in place: the row's own mark becomes the
// trigger of the matching picker, the list opens under it. Read-only, the mark is drawn as is.

import type { ReactNode } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { DatePicker } from "../overlays";
import {
  LabelPicker,
  PersonPicker,
  PriorityPicker,
  StatusPicker,
  type LabelOption,
  type Person,
} from "../pickers";
import type { ActionMenuEntry } from "./navigation-action-menu";
import {
  issueEditor,
  Stop,
  useFieldShortcuts,
  useFocusWithin,
  useOpenField,
  type IssueEditors,
  type IssueField,
  type RowMenuProps,
} from "./lists-editing";
import type { IssueContext, IssueItem } from "./lists-parts";

/** What a block hands its rows when editing is on. */
export interface IssueEdit {
  editors: IssueEditors | undefined;
  change: (id: string, patch: Partial<IssueItem>) => void;
  /** The `open` / `onOpenChange` of a field's picker. */
  openProps: (id: string, field: string) => { open: boolean; onOpenChange: (o: boolean) => void };
  labels: ReadonlyArray<LabelOption>;
  people: ReadonlyArray<Person>;
  today: string | undefined;
}

/**
 * A property of `issue`: `children` (the row's mark) alone when read-only, else the trigger of its
 * picker. `unset` draws it as a hidden anchor, for an empty property a shortcut can still open.
 */
export function IssueFieldEditor({
  edit,
  issue,
  field,
  className,
  unset,
  children,
}: {
  edit: IssueEdit | null;
  issue: IssueItem;
  field: IssueField;
  className?: string;
  unset?: boolean;
  children: ReactNode;
}) {
  const options = edit ? issueEditor(edit.editors, field) : null;
  if (!edit || !options) return unset ? null : children;
  const change = (patch: Partial<IssueItem>) => edit.change(issue.id, patch);
  if (options.render) {
    return unset ? null : <Stop className="fg-issue-custom">{options.render(issue, change)}</Stop>;
  }
  const trigger = cx("fg-issue-edit", unset ? "fg-issue-unset" : className);
  const open = edit.openProps(issue.id, field);
  const picker = (() => {
    switch (field) {
      case "status": {
        const o = issueEditor(edit.editors, "status")!;
        return (
          <StatusPicker
            value={issue.status}
            onChange={(status) => change({ status })}
            {...(o.statuses ? { statuses: o.statuses } : {})}
            {...(o.names ? { names: o.names } : {})}
            {...open}
            className={trigger}
          >
            {children}
          </StatusPicker>
        );
      }
      case "priority":
        return (
          <PriorityPicker
            value={issue.priority ?? 0}
            onChange={(priority) => change({ priority })}
            {...open}
            className={trigger}
          >
            {children}
          </PriorityPicker>
        );
      case "assignee": {
        const o = issueEditor(edit.editors, "assignee")!;
        const none = o.noneLabel === undefined ? "No assignee" : o.noneLabel;
        return (
          <PersonPicker
            label="Assignee"
            people={o.people ?? edit.people}
            value={issue.assignee ?? null}
            onChange={(assignee) => change({ assignee })}
            {...(o.me ? { me: o.me } : {})}
            {...(none ? { noneLabel: none } : {})}
            {...open}
            className={trigger}
          >
            {children}
          </PersonPicker>
        );
      }
      case "author": {
        const o = issueEditor(edit.editors, "author")!;
        return (
          <PersonPicker
            label="Author"
            people={o.people ?? edit.people}
            value={issue.author ?? null}
            onChange={(author) => change({ author })}
            {...(o.me ? { me: o.me } : {})}
            {...open}
            className={trigger}
          >
            {children}
          </PersonPicker>
        );
      }
      case "labels": {
        const o = issueEditor(edit.editors, "labels")!;
        return (
          <LabelPicker
            labels={o.labels ?? edit.labels}
            value={issue.labels ?? []}
            onChange={(labels) => change({ labels })}
            {...open}
            className={trigger}
          >
            {children}
          </LabelPicker>
        );
      }
      case "due": {
        const o = issueEditor(edit.editors, "due")!;
        return (
          <DatePicker
            label="Due date"
            value={issue.due ?? null}
            onChange={(due) => change({ due: due ?? undefined })}
            {...(o.presets ? { presets: o.presets } : {})}
            {...(o.clearable !== undefined ? { clearable: o.clearable } : {})}
            {...(edit.today ? { today: edit.today } : {})}
            {...open}
            className={trigger}
          >
            {children}
          </DatePicker>
        );
      }
    }
  })();
  return <Stop className={unset ? "fg-issue-anchor" : undefined}>{picker}</Stop>;
}

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

const rowOf = (id: string) => `[data-issue="${id.replace(/["\\]/g, "\\$&")}"]`;

/** Editing, shortcuts and row menus of an issue block, from its props. */
export function useIssueEditing(
  { onIssueChange, editors, shortcuts = true, rowMenu, onRowAction }: IssueEditingProps,
  ctx: IssueContext,
  current: string | null,
  visible: ReadonlyArray<string>,
) {
  const fields = useOpenField(rowOf);
  const focus = useFocusWithin();
  const [menuFor, setMenuFor] = useControllableState<string | null>({ defaultValue: null });
  const edit: IssueEdit | null = onIssueChange
    ? {
        editors,
        change: onIssueChange,
        openProps: fields.props,
        labels: ctx.labelList,
        people: ctx.peopleList,
        today: ctx.today,
      }
    : null;
  const keyable = (field: IssueField) => {
    const o = edit ? issueEditor(edit.editors, field) : null;
    return o !== null && !o.render && ctx.shows(field);
  };
  useFieldShortcuts(
    edit !== null && shortcuts && focus.inside && current !== null && visible.includes(current),
    (field) => {
      if (current !== null) fields.show(current, field);
    },
    keyable,
  );
  const menu = (issue: IssueItem): RowMenuProps => ({
    items: rowMenu?.(issue),
    onSelect: (actionId) => onRowAction?.(issue.id, actionId),
    label: `Actions on ${issue.id}`,
  });
  return {
    edit,
    /** Rows hold controls: a focusable group rather than one button. */
    interactive: edit !== null || rowMenu !== undefined,
    rootProps: { ref: fields.root, ...focus.props },
    menu,
    menuOpen: (id: string) => ({
      open: menuFor === id,
      onOpenChange: (open: boolean) => setMenuFor(open ? id : null),
    }),
    openMenu: (id: string) => {
      if (rowMenu) setMenuFor(id);
    },
  };
}
