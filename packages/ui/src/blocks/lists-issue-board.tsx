// The board of the Tasks app: one column per group (a status, a person), a card per issue. Layout
// only: moving a card is the caller's, through its own menus or shortcuts.

import { MoreHorizontalIcon, PlusSignIcon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
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

export interface IssueBoardProps extends IssueEditingProps {
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
}

const CARD = "[data-issue]";

/** Issues as cards in columns: the board layout of the Tasks app. */
export function IssueBoard({
  columns,
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
  showCounts = false,
  onAdd,
  onColumnMenu,
  renderExtra,
  label = "Board",
  className,
  ...editing
}: IssueBoardProps) {
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

  const toggle = (key: string) =>
    setFolded(folded.has(key) ? [...folded].filter((k) => k !== key) : [...folded, key]);

  const visible = columns.flatMap((c) => (folded.has(c.key) ? [] : c.issues.map((i) => i.id)));
  const stop = current !== null && visible.includes(current) ? current : visible[0];
  const { edit, interactive, rootProps, menu, menuOpen, openMenu } = useIssueEditing(
    editing,
    ctx,
    current,
    visible,
  );

  // Up and down inside a lane, left and right to the same rank of the next open lane.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>(CARD);
    if (!card) return;
    if (isMenuKey(event)) {
      event.preventDefault();
      select(card.dataset.issue!);
      openMenu(card.dataset.issue!);
      return;
    }
    const lanes = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-lane]")]
      .map((lane) => [...lane.querySelectorAll<HTMLElement>(CARD)])
      .filter((cards) => cards.length > 0);
    const col = lanes.findIndex((cards) => cards.includes(card));
    const lane = lanes[col];
    if (!lane) return;
    const rank = lane.indexOf(card);
    let next: HTMLElement | undefined;
    if (event.key === "ArrowDown") next = lane[rank + 1];
    else if (event.key === "ArrowUp") next = lane[rank - 1];
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const other = lanes[col + (event.key === "ArrowRight" ? 1 : -1)];
      next = other?.[Math.min(rank, other.length - 1)];
    } else return;
    event.preventDefault();
    if (!next) return;
    next.focus();
    select(next.dataset.issue!);
  };

  return (
    <div
      className={cx("fg-iboard", className)}
      role="region"
      aria-label={label}
      onKeyDown={onKeyDown}
      {...rootProps}
    >
      {columns.map((column) => {
        const mark =
          column.glyph ?? (column.status ? <StatusGlyph status={column.status} /> : null);
        const count = showCounts ? (
          <span className="fg-iboard-count">{column.issues.length}</span>
        ) : null;
        if (folded.has(column.key)) {
          return (
            <section
              key={column.key}
              className="fg-iboard-col fg-iboard-folded"
              aria-label={column.name}
            >
              <button
                type="button"
                className="fg-iboard-head"
                aria-expanded={false}
                title={`Show ${column.name}`}
                onClick={() => toggle(column.key)}
              >
                {mark}
                <span className="fg-iboard-name">{column.name}</span>
                {count}
              </button>
              <div className="fg-iboard-lane" />
            </section>
          );
        }
        return (
          <section key={column.key} className="fg-iboard-col" aria-label={column.name}>
            <div className="fg-iboard-head">
              <button
                type="button"
                className="fg-iboard-toggle"
                aria-expanded={true}
                title={`Fold ${column.name}`}
                onClick={() => toggle(column.key)}
              >
                {mark}
                <span className="fg-iboard-name">{column.name}</span>
                {count}
              </button>
              <span className="fg-iboard-acts">
                {onColumnMenu ? (
                  <IconButton
                    icon={MoreHorizontalIcon}
                    size="sm"
                    label={`${column.name} options`}
                    onClick={() => onColumnMenu(column.key)}
                  />
                ) : null}
                {onAdd ? (
                  <IconButton
                    icon={PlusSignIcon}
                    size="sm"
                    label={`New issue in ${column.name}`}
                    onClick={() => onAdd(column.key)}
                  />
                ) : null}
              </span>
            </div>
            <ul className="fg-iboard-lane" data-lane={column.key}>
              {column.issues.map((issue) => (
                <li key={issue.id}>
                  <RowMenuArea {...menu(issue)}>
                    <IssueCard
                      issue={issue}
                      ctx={ctx}
                      current={issue.id === current}
                      tabbable={issue.id === stop}
                      extra={renderExtra?.(issue)}
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
              {onAdd ? (
                <li>
                  <button
                    type="button"
                    className="fg-iboard-add"
                    onClick={() => onAdd(column.key)}
                    tabIndex={-1}
                  >
                    <Icon icon={PlusSignIcon} size={12} variant="mono" />
                    New issue
                  </button>
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function IssueCard({
  issue,
  ctx,
  current,
  tabbable,
  extra,
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
  extra: ReactNode;
  interactive: boolean;
  edit: IssueEdit | null;
  menu: RowMenuProps;
  menuOpen: { open: boolean; onOpenChange: (open: boolean) => void };
  onClick: () => void;
}) {
  const priority = issue.priority ?? 0;
  const showPriority = ctx.shows("priority") && priority > 0;
  const showLabels = ctx.shows("labels") && (issue.labels?.length ?? 0) > 0;
  const showDue = ctx.shows("due") && issue.due !== undefined && issue.due !== "";
  const chips = showPriority || showLabels || extra;
  type Field = Parameters<typeof IssueFieldEditor>[0]["field"];
  const field = (f: Field, node: ReactNode, cls: string) => (
    <IssueFieldEditor edit={edit} issue={issue} field={f} className={cls}>
      {node}
    </IssueFieldEditor>
  );
  // Empty properties have no mark to click: a hidden anchor still lets a shortcut open them.
  const anchor = (f: Field, when: boolean) =>
    when ? (
      <IssueFieldEditor key={f} edit={edit} issue={issue} field={f} unset>
        {null}
      </IssueFieldEditor>
    ) : null;
  const content = (
    <>
      <span className="fg-iboard-top">
        <span className="fg-iboard-id">{ctx.shows("id") ? issue.id : null}</span>
        <span className="fg-iboard-who">
          {ctx.shows("author")
            ? field("author", <Author issue={issue} ctx={ctx} />, "fg-issue-hit")
            : null}
          {ctx.shows("assignee")
            ? field("assignee", <Assignee issue={issue} ctx={ctx} />, "fg-issue-hit")
            : null}
        </span>
      </span>
      <span className="fg-iboard-title">
        {ctx.shows("status")
          ? field(
              "status",
              <span className="fg-iboard-status" title={statusWords(issue.status)}>
                <StatusGlyph status={issue.status} />
                <span className="fg-sr">{statusWords(issue.status)}</span>
              </span>,
              "fg-issue-hit",
            )
          : null}
        <span>{issue.title}</span>
      </span>
      {chips ? (
        <span className="fg-iboard-chips">
          {showPriority
            ? field(
                "priority",
                <span className="fg-issue-chip fg-iboard-prio" title={priorityWords(priority)}>
                  <PriorityGlyph level={priority} />
                  <span className="fg-sr">{priorityWords(priority)}</span>
                </span>,
                "fg-issue-chips",
              )
            : null}
          {showLabels
            ? field("labels", <LabelChips issue={issue} ctx={ctx} />, "fg-issue-chips")
            : null}
          {extra}
        </span>
      ) : null}
      {showDue
        ? field(
            "due",
            <Due issue={issue} ctx={ctx} prefix="Due " className="fg-iboard-due" />,
            "fg-issue-date",
          )
        : null}
      {anchor("priority", ctx.shows("priority") && !showPriority)}
      {anchor("labels", ctx.shows("labels") && !showLabels)}
      {anchor("due", ctx.shows("due") && !showDue)}
      <RowMore {...menu} {...menuOpen} className="fg-iboard-more" />
    </>
  );
  const props = {
    className: cx("fg-iboard-card", current && "fg-iboard-current"),
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
