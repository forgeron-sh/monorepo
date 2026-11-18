// The issue list of the Tasks app: groups (a status, a person) folded or open, then one dense row
// per issue. The arrows move between rows, Enter opens one.

import { ArrowDown01Icon, Calendar03Icon, PlusSignIcon } from "@forgeron/icons";
import { useId, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { PriorityGlyph, StatusGlyph } from "../glyphs";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import type { LabelOption, Person } from "../pickers";
import { isMenuKey, RowMenuArea, RowMore, type RowMenuProps } from "./lists-editing";
import {
  IssueFieldEditor,
  useIssueEditing,
  type IssueEdit,
  type IssueEditingProps,
} from "./lists-issue-fields";
import {
  Assignee,
  Author,
  Due,
  issueContext,
  LabelChips,
  priorityWords,
  statusWords,
  type IssueContext,
  type IssueGroup,
  type IssueItem,
  type IssueProperty,
} from "./lists-parts";

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
  empty?: ReactNode;
  /** Names the list for assistive technology. */
  label?: string;
  className?: string;
}

const ROW = "[data-issue]";

/** Issues in groups, one dense row each: what the Tasks app shows for a team, a project, a view. */
export function IssueList({
  groups,
  labels,
  people,
  today,
  properties,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onOpen,
  collapsed,
  defaultCollapsed = [],
  onCollapsedChange,
  showEmptyGroups = false,
  showCounts = false,
  onAdd,
  empty = "No issues here yet",
  label = "Issues",
  className,
  ...editing
}: IssueListProps) {
  const [current, select] = useControllableState<string | null>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (id) => {
      if (id !== null) onSelectedChange?.(id);
    },
  });
  const [foldedKeys, setFolded] = useControllableState<ReadonlyArray<string>>({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: (keys) => onCollapsedChange?.([...keys]),
  });
  const folded = new Set(foldedKeys);
  const ctx = issueContext(labels, people, today, properties);
  const uid = useId();

  const toggle = (key: string) =>
    setFolded(folded.has(key) ? [...folded].filter((k) => k !== key) : [...folded, key]);

  const shown = groups.filter((g) => showEmptyGroups || g.issues.length > 0);
  const visible = shown.flatMap((g) => (folded.has(g.key) ? [] : g.issues.map((i) => i.id)));
  // One tab stop for all the rows: the current one, else the first.
  const stop = current !== null && visible.includes(current) ? current : visible[0];
  const { edit, interactive, rootProps, menu, menuOpen, openMenu } = useIssueEditing(
    editing,
    ctx,
    current,
    visible,
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>(ROW);
    if (!row) return;
    if (isMenuKey(event)) {
      event.preventDefault();
      select(row.dataset.issue!);
      openMenu(row.dataset.issue!);
      return;
    }
    const rows = [...event.currentTarget.querySelectorAll<HTMLElement>(ROW)];
    const at = rows.indexOf(row);
    const to =
      event.key === "ArrowDown"
        ? at + 1
        : event.key === "ArrowUp"
          ? at - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? rows.length - 1
              : -2;
    if (to === -2) return;
    event.preventDefault();
    const next = rows[Math.min(Math.max(to, 0), rows.length - 1)];
    if (!next) return;
    next.focus();
    select(next.dataset.issue!);
  };

  if (!groups.some((g) => g.issues.length > 0) && !showEmptyGroups) {
    return <div className={cx("fg-ilist-empty", className)}>{empty}</div>;
  }

  return (
    <div
      className={cx("fg-ilist", className)}
      role="region"
      aria-label={label}
      onKeyDown={onKeyDown}
      {...rootProps}
    >
      {shown.map((group) => {
        const open = !folded.has(group.key);
        const bodyId = `${uid}-${group.key}`;
        return (
          <section key={group.key} className="fg-ilist-group" aria-label={group.name}>
            <div className="fg-ilist-head">
              <button
                type="button"
                className="fg-ilist-toggle"
                aria-expanded={open}
                aria-controls={bodyId}
                onClick={() => toggle(group.key)}
              >
                <Icon
                  icon={ArrowDown01Icon}
                  size={12}
                  variant="mono"
                  className="fg-ilist-chevron"
                />
                {group.glyph ?? (group.status ? <StatusGlyph status={group.status} /> : null)}
                <span className="fg-ilist-name">{group.name}</span>
                {showCounts ? <span className="fg-ilist-count">{group.issues.length}</span> : null}
              </button>
              {onAdd ? (
                <IconButton
                  icon={PlusSignIcon}
                  size="sm"
                  label={`New issue in ${group.name}`}
                  onClick={() => onAdd(group.key)}
                />
              ) : null}
            </div>
            {open ? (
              <ul className="fg-ilist-rows" id={bodyId}>
                {group.issues.map((issue) => (
                  <li key={issue.id}>
                    <RowMenuArea {...menu(issue)}>
                      <IssueRow
                        issue={issue}
                        ctx={ctx}
                        current={issue.id === current}
                        tabbable={issue.id === stop}
                        interactive={interactive}
                        edit={edit}
                        menu={menu(issue)}
                        menuOpen={menuOpen(issue.id)}
                        onClick={() => {
                          select(issue.id);
                          onOpen?.(issue.id);
                        }}
                      />
                    </RowMenuArea>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function IssueRow({
  issue,
  ctx,
  current,
  tabbable,
  interactive,
  edit,
  menu,
  menuOpen,
  onClick,
}: {
  issue: IssueItem;
  ctx: IssueContext;
  current: boolean;
  tabbable: boolean;
  interactive: boolean;
  edit: IssueEdit | null;
  menu: RowMenuProps;
  menuOpen: { open: boolean; onOpenChange: (open: boolean) => void };
  onClick: () => void;
}) {
  const priority = issue.priority ?? 0;
  const hasLabels = (issue.labels?.length ?? 0) > 0;
  const field = (
    f: Parameters<typeof IssueFieldEditor>[0]["field"],
    node: ReactNode,
    cls: string,
  ) => (
    <IssueFieldEditor edit={edit} issue={issue} field={f} className={cls}>
      {node}
    </IssueFieldEditor>
  );
  const content = (
    <>
      {ctx.shows("priority")
        ? field(
            "priority",
            <span className="fg-ilist-mark" title={priorityWords(priority)}>
              <PriorityGlyph level={priority} />
              <span className="fg-sr">{priorityWords(priority)}</span>
            </span>,
            "fg-issue-hit",
          )
        : null}
      {ctx.shows("id") ? <span className="fg-ilist-id">{issue.id}</span> : null}
      {ctx.shows("status")
        ? field(
            "status",
            <span className="fg-ilist-mark" title={statusWords(issue.status)}>
              <StatusGlyph status={issue.status} />
              <span className="fg-sr">{statusWords(issue.status)}</span>
            </span>,
            "fg-issue-hit",
          )
        : null}
      <span className="fg-ilist-title">{issue.title}</span>
      <span className="fg-ilist-trail">
        {ctx.shows("labels") && hasLabels
          ? field("labels", <LabelChips issue={issue} ctx={ctx} />, "fg-issue-chips")
          : null}
        {ctx.shows("author")
          ? field("author", <Author issue={issue} ctx={ctx} />, "fg-issue-hit")
          : null}
        {ctx.shows("assignee")
          ? field("assignee", <Assignee issue={issue} ctx={ctx} />, "fg-issue-hit")
          : null}
        {ctx.shows("due")
          ? field(
              "due",
              issue.due || !edit ? (
                <Due issue={issue} ctx={ctx} className="fg-ilist-due" />
              ) : (
                <span className="fg-ilist-due fg-issue-ghost">
                  <Icon icon={Calendar03Icon} size={12} variant="mono" />
                  <span className="fg-sr">No due date</span>
                </span>
              ),
              "fg-issue-date",
            )
          : null}
        <RowMore {...menu} {...menuOpen} />
      </span>
      {ctx.shows("labels") && !hasLabels ? (
        <IssueFieldEditor edit={edit} issue={issue} field="labels" unset>
          {null}
        </IssueFieldEditor>
      ) : null}
    </>
  );
  const props = {
    className: cx("fg-ilist-row", current && "fg-ilist-current"),
    "data-issue": issue.id,
    tabIndex: tabbable ? 0 : -1,
    ...(current ? { "aria-current": true } : {}),
    onClick,
  };
  if (!interactive) {
    return (
      <button type="button" {...props}>
        {content}
      </button>
    );
  }
  // The row holds the pickers' triggers: a focusable group (a button cannot hold buttons) that
  // Enter and Space open, like the button it replaces.
  return (
    <div
      {...props}
      role="group"
      aria-label={`${issue.id} ${issue.title}`}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onClick();
      }}
    >
      {content}
    </div>
  );
}
