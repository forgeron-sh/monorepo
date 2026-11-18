// The projects table of the Tasks app: one row per project with its status, its health, its lead,
// its target date and how far its issues have gone. Columns can be sorted.

import { Popover } from "@base-ui/react/popover";
import type { IconDefinition } from "@forgeron/icons";
import { ArrowDown01Icon, ArrowUp01Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { formatShort } from "../dates";
import { StatusGlyph, type StatusKind } from "../glyphs";
import { Icon } from "../icon";
import { Led } from "../led";
import { DatePicker, SelectMenu, type DatePreset } from "../overlays";
import { PersonPicker, type Person } from "../pickers";
import type { ActionMenuEntry } from "./navigation-action-menu";
import { isMenuKey, RowMenuArea, RowMore, Stop, useOpenField } from "./lists-editing";
import { thisYear } from "./lists-parts";

export type ProjectStatus = "planned" | "started" | "paused" | "completed" | "canceled";
export type ProjectHealth = "track" | "risk" | "off" | "none";

export const PROJECT_STATUS_NAMES: Record<ProjectStatus, string> = {
  planned: "Planned",
  started: "In Progress",
  paused: "Paused",
  completed: "Completed",
  canceled: "Canceled",
};

export const PROJECT_HEALTH_NAMES: Record<ProjectHealth, string> = {
  track: "On track",
  risk: "At risk",
  off: "Off track",
  none: "No updates",
};

const STATUS_GLYPH: Record<ProjectStatus, StatusKind> = {
  planned: "todo",
  started: "progress",
  paused: "backlog",
  completed: "done",
  canceled: "canceled",
};
const STATUS_ORDER: ReadonlyArray<ProjectStatus> = [
  "started",
  "paused",
  "planned",
  "completed",
  "canceled",
];
const HEALTH_TONE = { track: "success", risk: "warning", off: "danger" } as const;

/** A project as the table shows it. */
export interface ProjectItem {
  id: string;
  name: string;
  /** One line after the name, dimmed. */
  summary?: string;
  /** The project's icon, in a framed square before the name. */
  icon?: IconDefinition;
  /** Without an icon, a square of this colour marks the project. */
  color?: string;
  status: ProjectStatus;
  health?: ProjectHealth;
  /** The id of a person of `people`. */
  lead?: string | null;
  /** `YYYY-MM-DD`. */
  target?: string;
  /** Its issues, canceled ones left out. */
  issues: number;
  /** Of those, the ones done: the filled part of the bar. */
  done: number;
  /** Of those, the ones started (in progress, in review): the amber part of the bar. */
  started?: number;
}

export type ProjectColumn = "health" | "lead" | "target" | "issues" | "progress" | "status";
export type ProjectSortKey = "name" | ProjectColumn;
export interface ProjectSort {
  key: ProjectSortKey;
  direction: "asc" | "desc";
}

/** A fully custom editor of a project's field: drawn in the cell, calls `change` with what it sets. */
export type ProjectEditorRender = (
  project: ProjectItem,
  change: (patch: Partial<ProjectItem>) => void,
) => ReactNode;

interface ProjectEditorBase {
  /** Replaces the picker with your own control. */
  render?: ProjectEditorRender;
}

/**
 * How each field of a project is edited. Absent: the default picker. `false`: read-only. An
 * object: the picker, restricted, or `render` for your own.
 */
export interface ProjectEditors {
  status?: false | (ProjectEditorBase & { statuses?: ReadonlyArray<ProjectStatus> });
  health?: false | ProjectEditorBase;
  lead?:
    | false
    | (ProjectEditorBase & {
        /** The people offered; the table's `people` by default. */
        people?: ReadonlyArray<Person>;
        /** The person viewing: listed first, marked "(you)". */
        me?: string;
        /** The entry for nobody; "No lead" by default, `null` to require someone. */
        noneLabel?: string | null;
      });
  target?:
    | false
    | (ProjectEditorBase & {
        /** Quick picks above the month; none by default. */
        presets?: ReadonlyArray<DatePreset>;
        /** Offers to remove the date; true by default. */
        clearable?: boolean;
      });
}

type ProjectField = keyof ProjectEditors;

export interface ProjectsTableProps {
  projects: ReadonlyArray<ProjectItem>;
  people?: ReadonlyArray<Person>;
  /** `YYYY-MM-DD`: target dates of another year write the year. */
  today?: string;
  /** The columns after the name, in order. Health shows only when a project has one. */
  columns?: ReadonlyArray<ProjectColumn>;
  /** Makes the headers buttons that sort the rows. */
  sortable?: boolean;
  sort?: ProjectSort | null;
  defaultSort?: ProjectSort | null;
  onSortChange?: (sort: ProjectSort) => void;
  /** A click on a row. */
  onOpen?: (id: string) => void;
  /** Makes each row a link to its page. */
  href?: (project: ProjectItem) => string;
  /** Shown when there is no project. */
  empty?: ReactNode;
  /**
   * Turns editing on: status, health, lead and target open their pickers, and this hears the
   * change. Absent, the cells are read-only.
   */
  onProjectChange?: (id: string, patch: Partial<ProjectItem>) => void;
  /** Per field: `false` for read-only, options to restrict the choices, `render` for your own. */
  editors?: ProjectEditors;
  /** The actions of a project: a right click, Shift+F10, or the ⋯ at the end of the row. */
  rowMenu?: (project: ProjectItem) => ReadonlyArray<ActionMenuEntry>;
  /** The action chosen in `rowMenu`, with the project's id. */
  onRowAction?: (id: string, actionId: string) => void;
  label?: string;
  className?: string;
}

const DEFAULT_COLUMNS: ReadonlyArray<ProjectColumn> = [
  "health",
  "lead",
  "target",
  "issues",
  "progress",
  "status",
];

const HEADS: Record<ProjectSortKey, string> = {
  name: "Name",
  health: "Health",
  lead: "Lead",
  target: "Target date",
  issues: "Issues",
  progress: "Progress",
  status: "Status",
};

const WIDTHS: Record<ProjectColumn, number> = {
  health: 104,
  lead: 112,
  target: 100,
  issues: 52,
  progress: 132,
  status: 112,
};
const NAME_MIN = 140;
const GAP = 6;
const PAD = 28;

const HEALTH_ORDER: ReadonlyArray<ProjectHealth> = ["off", "risk", "track", "none"];
const HEALTH_CHOICES: ReadonlyArray<ProjectHealth> = ["track", "risk", "off", "none"];
const STATUS_CHOICES: ReadonlyArray<ProjectStatus> = [
  "planned",
  "started",
  "paused",
  "completed",
  "canceled",
];
const MORE = 28;

const healthMark = (h: ProjectHealth) =>
  h === "none" ? (
    <span className="fg-ptable-noled" aria-hidden="true" />
  ) : (
    <Led tone={HEALTH_TONE[h]} />
  );
const ratio = (p: ProjectItem) => (p.issues > 0 ? p.done / p.issues : 0);

/** Projects in rows: status, health, lead, target and progress at a glance. */
export function ProjectsTable({
  projects,
  people,
  today,
  columns,
  sortable = false,
  sort,
  defaultSort = null,
  onSortChange,
  onOpen,
  href,
  empty = "No projects here",
  onProjectChange,
  editors,
  rowMenu,
  onRowAction,
  label = "Projects",
  className,
}: ProjectsTableProps) {
  const { root: tableRef, props: fieldProps } = useOpenField(
    (id) => `[data-project="${id.replace(/["\\]/g, "\\$&")}"]`,
  );
  const [menuFor, setMenuFor] = useControllableState<string | null>({ defaultValue: null });
  const [order, setOrder] = useControllableState<ProjectSort | null>({
    value: sort,
    defaultValue: defaultSort,
    onChange: (next) => {
      if (next) onSortChange?.(next);
    },
  });
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const year = thisYear(today);
  const cols = (columns ?? DEFAULT_COLUMNS).filter(
    (c) => c !== "health" || projects.some((p) => p.health !== undefined),
  );
  const more = rowMenu !== undefined;
  const template = [
    `minmax(${NAME_MIN}px, 1fr)`,
    ...cols.map((c) => `${WIDTHS[c]}px`),
    ...(more ? [`${MORE}px`] : []),
  ].join(" ");
  // Narrower than this, the table scrolls sideways rather than crushing the names.
  const least = cols.reduce((sum, c) => sum + WIDTHS[c] + GAP, NAME_MIN + PAD + (more ? MORE : 0));
  const editorOf = <F extends ProjectField>(field: F) => {
    if (!onProjectChange) return null;
    const given = editors?.[field];
    if (given === false) return null;
    return (given ?? {}) as Exclude<ProjectEditors[F], false | undefined>;
  };

  const leadName = (p: ProjectItem) => (p.lead ? (byId.get(p.lead)?.name ?? "") : "");
  const compare = (key: ProjectSortKey) => (a: ProjectItem, b: ProjectItem) => {
    switch (key) {
      case "name":
        return a.name.localeCompare(b.name);
      case "health":
        return HEALTH_ORDER.indexOf(a.health ?? "none") - HEALTH_ORDER.indexOf(b.health ?? "none");
      case "lead":
        return (leadName(a) || "￿").localeCompare(leadName(b) || "￿");
      case "target":
        return (a.target ?? "9999").localeCompare(b.target ?? "9999");
      case "issues":
        return a.issues - b.issues;
      case "progress":
        return ratio(a) - ratio(b);
      case "status":
        return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    }
  };
  const rows = order
    ? [...projects].sort((a, b) => compare(order.key)(a, b) * (order.direction === "asc" ? 1 : -1))
    : projects;

  const sortBy = (key: ProjectSortKey) => {
    const next: ProjectSort = {
      key,
      direction: order?.key === key && order.direction === "asc" ? "desc" : "asc",
    };
    setOrder(next);
  };

  const head = (key: ProjectSortKey) => {
    const on = order?.key === key;
    const numeric = key === "issues";
    return (
      <div
        key={key}
        role="columnheader"
        className={cx("fg-ptable-th", numeric && "fg-ptable-num")}
        {...(sortable
          ? { "aria-sort": on ? (order.direction === "asc" ? "ascending" : "descending") : "none" }
          : {})}
      >
        {sortable ? (
          <button type="button" className="fg-ptable-sort" onClick={() => sortBy(key)}>
            {HEADS[key]}
            {on ? (
              <Icon
                icon={order.direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
                size={12}
                variant="mono"
              />
            ) : null}
          </button>
        ) : (
          HEADS[key]
        )}
      </div>
    );
  };

  // A cell's content, or the trigger of its picker when the field is editable.
  const edit = (p: ProjectItem, col: ProjectColumn, shown: ReactNode): ReactNode => {
    if (col !== "status" && col !== "health" && col !== "lead" && col !== "target") return shown;
    const options = editorOf(col);
    if (!options || !onProjectChange) return shown;
    const change = (patch: Partial<ProjectItem>) => onProjectChange(p.id, patch);
    if (options.render) return <Stop className="fg-issue-custom">{options.render(p, change)}</Stop>;
    const open = fieldProps(p.id, col);
    const trigger = "fg-issue-edit fg-ptable-edit";
    switch (col) {
      case "status": {
        const o = editorOf("status")!;
        return (
          <Stop>
            <SelectMenu
              label="Status"
              variant="chip"
              numbered
              value={p.status}
              onChange={(v) => v && change({ status: v as ProjectStatus })}
              options={(o.statuses ?? STATUS_CHOICES).map((s) => ({
                value: s,
                label: PROJECT_STATUS_NAMES[s],
                glyph: <StatusGlyph status={STATUS_GLYPH[s]} />,
              }))}
              {...open}
              className={trigger}
            >
              {shown}
            </SelectMenu>
          </Stop>
        );
      }
      case "health":
        return (
          <Stop>
            <SelectMenu
              label="Health"
              variant="chip"
              value={p.health ?? "none"}
              onChange={(v) => v && change({ health: v as ProjectHealth })}
              options={HEALTH_CHOICES.map((h) => ({
                value: h,
                label: PROJECT_HEALTH_NAMES[h],
                glyph: healthMark(h),
              }))}
              {...open}
              className={trigger}
            >
              {shown}
            </SelectMenu>
          </Stop>
        );
      case "lead": {
        const o = editorOf("lead")!;
        const none = o.noneLabel === undefined ? "No lead" : o.noneLabel;
        return (
          <Stop>
            <PersonPicker
              label="Lead"
              people={o.people ?? people ?? []}
              value={p.lead ?? null}
              onChange={(lead) => change({ lead })}
              {...(o.me ? { me: o.me } : {})}
              {...(none ? { noneLabel: none } : {})}
              {...open}
              className={trigger}
            >
              {shown}
            </PersonPicker>
          </Stop>
        );
      }
      case "target": {
        const o = editorOf("target")!;
        return (
          <Stop>
            <DatePicker
              label="Target date"
              value={p.target ?? null}
              onChange={(target) => change({ target: target ?? undefined })}
              presets={o.presets ?? []}
              {...(o.clearable !== undefined ? { clearable: o.clearable } : {})}
              {...(today ? { today } : {})}
              {...open}
              className={trigger}
            >
              {shown}
            </DatePicker>
          </Stop>
        );
      }
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!more || !isMenuKey(event)) return;
    const row = (event.target as HTMLElement).closest<HTMLElement>("[data-project]");
    if (!row) return;
    event.preventDefault();
    setMenuFor(row.dataset.project!);
  };

  const cell = (p: ProjectItem, col: ProjectColumn) => {
    switch (col) {
      case "health": {
        const h = p.health ?? "none";
        return (
          <span className="fg-ptable-cell">
            {healthMark(h)}
            {PROJECT_HEALTH_NAMES[h]}
          </span>
        );
      }
      case "lead": {
        const person = p.lead ? byId.get(p.lead) : undefined;
        return person ? (
          <span className="fg-ptable-cell">
            <Avatar name={person.name} size={18} {...(person.src ? { src: person.src } : {})} />
            {person.name.split(" ")[0]}
          </span>
        ) : (
          <span className="fg-ptable-cell fg-ptable-dim">
            <span className="fg-issue-nobody" aria-hidden="true" />
            No lead
          </span>
        );
      }
      case "target":
        return (
          <span className="fg-ptable-mono">{p.target ? formatShort(p.target, year) : "—"}</span>
        );
      case "issues":
        return <span className="fg-ptable-mono fg-ptable-num">{p.issues}</span>;
      case "progress":
        return <ProgressBlocks project={p} />;
      case "status":
        return (
          <span className="fg-ptable-cell">
            <StatusGlyph status={STATUS_GLYPH[p.status]} />
            {PROJECT_STATUS_NAMES[p.status]}
          </span>
        );
    }
  };

  return (
    <div
      className={cx("fg-ptable", className)}
      role="table"
      aria-label={label}
      onKeyDown={onKeyDown}
      ref={tableRef}
      style={{
        ["--fg-ptable-cols" as string]: template,
        ["--fg-ptable-min" as string]: `${least}px`,
      }}
    >
      <div role="row" className="fg-ptable-row fg-ptable-headrow">
        {head("name")}
        {cols.map(head)}
        {more ? (
          <div role="columnheader" className="fg-ptable-th">
            <span className="fg-sr">Actions</span>
          </div>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div role="row" className="fg-ptable-empty">
          <span role="cell">{empty}</span>
        </div>
      ) : (
        rows.map((p) => {
          const menu = {
            items: rowMenu?.(p),
            onSelect: (actionId: string) => onRowAction?.(p.id, actionId),
            label: `Actions on ${p.name}`,
          };
          return (
            <RowMenuArea key={p.id} {...menu}>
              <div
                role="row"
                data-project={p.id}
                className={cx("fg-ptable-row", (onOpen || href) && "fg-ptable-link")}
              >
                <span role="cell" className="fg-ptable-name">
                  {p.icon ? (
                    <span className="fg-ptable-icon" aria-hidden="true">
                      <Icon icon={p.icon} size={12} variant="mono" />
                    </span>
                  ) : (
                    <span
                      className="fg-swatch-mark fg-ptable-swatch"
                      style={{ background: p.color ?? "var(--ink-dim)" }}
                      aria-hidden="true"
                    />
                  )}
                  {href ? (
                    <a className="fg-ptable-title fg-ptable-open" href={href(p)}>
                      {p.name}
                    </a>
                  ) : onOpen ? (
                    <button
                      type="button"
                      className="fg-ptable-title fg-ptable-open"
                      onClick={() => onOpen(p.id)}
                    >
                      {p.name}
                    </button>
                  ) : (
                    <span className="fg-ptable-title">{p.name}</span>
                  )}
                  {p.summary ? <span className="fg-ptable-summary">{p.summary}</span> : null}
                </span>
                {cols.map((col) => (
                  <span key={col} role="cell" className="fg-ptable-td">
                    {edit(p, col, cell(p, col))}
                  </span>
                ))}
                {more ? (
                  <span role="cell" className="fg-ptable-td fg-ptable-acts">
                    <RowMore
                      {...menu}
                      open={menuFor === p.id}
                      onOpenChange={(open) => setMenuFor(open ? p.id : null)}
                    />
                  </span>
                ) : null}
              </div>
            </RowMenuArea>
          );
        })
      )}
    </div>
  );
}

const BLOCKS = 20;

const share = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

/**
 * The prototype's bar: twenty blocks, done in ember, started in amber, the rest in line grey.
 * Hover, or focus and Enter, opens the detail: done, started and left, with their shares.
 */
function ProgressBlocks({ project }: { project: ProjectItem }) {
  const total = project.issues;
  const started = project.started ?? 0;
  const left = Math.max(total - project.done - started, 0);
  const on = total > 0 ? Math.round((project.done / total) * BLOCKS) : 0;
  const mid = total > 0 ? Math.round((started / total) * BLOCKS) : 0;
  const percent = Math.round(ratio(project) * 100);
  const lines = [
    { key: "on", name: "Done", n: project.done },
    { key: "mid", name: "Started", n: started },
    { key: "off", name: "Not started", n: left },
  ];
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        className="fg-ptable-cell fg-ptable-progress"
        aria-label={`${project.name}: ${project.done} of ${total} issues done, details`}
      >
        <span
          className="fg-ptable-bar"
          role="progressbar"
          aria-label={`${project.name}: ${project.done} of ${total} issues done`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          {Array.from({ length: BLOCKS }, (_, k) => (
            <i
              key={k}
              className={k < on ? "fg-ptable-on" : k < on + mid ? "fg-ptable-mid" : undefined}
            />
          ))}
        </span>
        <span className="fg-ptable-pct">{percent}%</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="fg-pop-positioner" sideOffset={6} align="start">
          <Popover.Popup
            className="fg-pop fg-ptable-detail"
            aria-label={`${project.name} progress`}
          >
            <span className="fg-ptable-detail-head">
              <span>{project.name}</span>
              <span>
                {project.done}/{total}
              </span>
            </span>
            <dl className="fg-ptable-detail-list">
              {lines.map((l) => (
                <div key={l.key} className="fg-ptable-detail-row">
                  <dt>
                    <i className={`fg-ptable-key fg-ptable-key-${l.key}`} aria-hidden="true" />
                    {l.name}
                  </dt>
                  <dd>
                    <span>{l.n}</span>
                    <span className="fg-ptable-detail-pct">{share(l.n, total)}%</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
