// The projects table of the Tasks app: one row per project with its status, its health, its lead,
// its target date and how far its issues have gone. Columns can be sorted.
//
// A data table as shadcn builds one: the `Table` parts (table.tsx) for the markup, `useCollection`
// for the arrows between rows. With no children, `ProjectsTable` draws its header and its rows;
// with children it is the root of its parts, which read what the root keeps (the order, the
// editing, the row menus):
//
//   <ProjectsTable projects={projects} people={people} sortable>
//     <ProjectsTableHeader />
//     <ProjectsTableBody>
//       {projects.map((project) => (
//         <ProjectsTableRow key={project.id} project={project}>
//           <ProjectsTableName project={project} />
//           <ProjectsTableCell project={project} column="status" />
//           <ProjectsTableCell project={project} column="progress" />
//         </ProjectsTableRow>
//       ))}
//     </ProjectsTableBody>
//   </ProjectsTable>

import type { IconDefinition } from "@forgeron/icons";
import { ArrowDown01Icon, ArrowUp01Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type TableHTMLAttributes,
} from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useCollection, type Collection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import { formatShort } from "../dates";
import { StatusGlyph, type StatusKind } from "../glyphs";
import { Icon } from "../icon";
import { Led } from "../led";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { defineStatuses } from "../status-model";
import { DatePicker, SelectMenu, type DatePreset } from "../overlays";
import { PersonPicker, type Person } from "../pickers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import type { ActionMenuEntry } from "../action-menu";
import { isMenuKey, RowMenuArea, RowMore, Stop, useOpenField } from "./lists-editing";
import { thisYear } from "./lists-parts";
import { primitivePart } from "../part";

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
const HEALTH = defineStatuses({
  track: { label: "On track", tone: "success" },
  risk: { label: "At risk", tone: "warning" },
  off: { label: "Off track", tone: "danger" },
});

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

interface ProjectsTableOwn {
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
  /** A click on a row, or Enter on it. */
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
  /** The parts (`ProjectsTableHeader`, `ProjectsTableBody`…) in place of the header and rows. */
  children?: ReactNode;
}

/** The props of the table, and the attributes of its `<table>`. */
export type ProjectsTableProps = ProjectsTableOwn &
  Omit<TableHTMLAttributes<HTMLTableElement>, keyof ProjectsTableOwn>;

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
    <Led tone={HEALTH.tone(h)} />
  );
const ratio = (p: ProjectItem) => (p.issues > 0 ? p.done / p.issues : 0);

/* ---------------------------------------------------------------- the root */

interface ProjectsTableContext {
  /** The projects in the order the table shows them. */
  rows: ReadonlyArray<ProjectItem>;
  /** The columns after the name, health left out when no project has one. */
  columns: ReadonlyArray<ProjectColumn>;
  people: ReadonlyArray<Person> | undefined;
  today: string | undefined;
  sortable: boolean;
  sort: ProjectSort | null;
  sortBy: (key: ProjectSortKey) => void;
  onOpen: ((id: string) => void) | undefined;
  href: ((project: ProjectItem) => string) | undefined;
  empty: ReactNode;
  onProjectChange: ProjectsTableOwn["onProjectChange"];
  editors: ProjectEditors | undefined;
  rowMenu: ProjectsTableOwn["rowMenu"];
  onRowAction: ProjectsTableOwn["onRowAction"];
  /** Whether a column of actions is drawn. */
  more: boolean;
  collection: Collection;
  menuFor: string | null;
  setMenuFor: (id: string | null) => void;
  /** The `open` / `onOpenChange` of the picker of a field of a project. */
  openProps: (id: string, field: string) => { open: boolean; onOpenChange: (o: boolean) => void };
}

const TableContext = createContext<ProjectsTableContext | null>(null);

/** What the root of the table keeps: the order, the columns, the editing. For parts of your own. */
export function useProjectsTable(part = "a table part"): ProjectsTableContext {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error(`<${part}> goes inside a <ProjectsTable>.`);
  return ctx;
}

const compareBy =
  (key: ProjectSortKey, leadName: (p: ProjectItem) => string) =>
  (a: ProjectItem, b: ProjectItem) => {
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

/**
 * Projects in rows: status, health, lead, target and progress at a glance. Without children it
 * draws the header and the rows; with children it is the root of the parts below.
 */
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
  children,
  style,
  ...rest
}: ProjectsTableProps) {
  const field = useOpenField((id) => `[data-project="${id.replace(/["\\]/g, "\\$&")}"]`);
  const [menuFor, setMenuFor] = useControllableState<string | null>({ defaultValue: null });
  const [order, setOrder] = useControllableState<ProjectSort | null>({
    value: sort,
    defaultValue: defaultSort,
    onChange: (next) => {
      if (next) onSortChange?.(next);
    },
  });
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const cols = (columns ?? DEFAULT_COLUMNS).filter(
    (c) => c !== "health" || projects.some((p) => p.health !== undefined),
  );
  const more = rowMenu !== undefined;
  // Narrower than this, the table scrolls sideways rather than crushing the names.
  const least = cols.reduce((sum, c) => sum + WIDTHS[c] + GAP, NAME_MIN + PAD + (more ? MORE : 0));
  const leadName = (p: ProjectItem) => (p.lead ? (byId.get(p.lead)?.name ?? "") : "");
  const rows = order
    ? [...projects].sort(
        (a, b) => compareBy(order.key, leadName)(a, b) * (order.direction === "asc" ? 1 : -1),
      )
    : projects;

  // The arrows move between rows; Enter opens one (the row's link when it has one).
  const collection = useCollection<ProjectItem>({
    items: rows,
    getId: (p) => p.id,
    selectionMode: "none",
    onAction: (id) => {
      if (onOpen) onOpen(id);
      else
        field.root.current
          ?.querySelector<HTMLElement>(
            `[data-project="${id.replace(/["\\]/g, "\\$&")}"] a.fg-ptable-open`,
          )
          ?.click();
    },
    actOnDoubleClick: false,
    // Keys that belong to a control inside a row (a picker, the name's button) stay with it.
    ignoreTarget: (target) => !target.hasAttribute("data-collection-item"),
  });

  const sortBy = (key: ProjectSortKey) =>
    setOrder({
      key,
      direction: order?.key === key && order.direction === "asc" ? "desc" : "asc",
    });

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    (rest.onKeyDown as ((e: KeyboardEvent<HTMLElement>) => void) | undefined)?.(event);
    if (!more || !isMenuKey(event)) return;
    const row = (event.target as HTMLElement).closest<HTMLElement>("[data-project]");
    if (!row) return;
    event.preventDefault();
    setMenuFor(row.dataset.project!);
  };

  const value: ProjectsTableContext = {
    rows,
    columns: cols,
    people,
    today,
    sortable,
    sort: order,
    sortBy,
    onOpen,
    href,
    empty,
    onProjectChange,
    editors,
    rowMenu,
    onRowAction,
    more,
    collection,
    menuFor,
    setMenuFor,
    openProps: field.props,
  };
  const container = collection.getContainerProps({
    ...(rest as object),
    ref: field.root as never,
    onKeyDown,
  });
  return (
    <TableContext value={value}>
      <Table
        data-slot="projects-table"
        aria-label={label}
        {...container}
        containerClassName="fg-ptable-wrap"
        className={cx("fg-ptable", className)}
        style={{
          ...style,
          ["--fg-ptable-min" as string]: `${least}px`,
        }}
      >
        {children ?? (
          <>
            <ProjectsTableHeader />
            <ProjectsTableBody />
          </>
        )}
      </Table>
    </TableContext>
  );
}

/* ---------------------------------------------------------------- the header */

export interface ProjectsTableHeaderProps extends Omit<ComponentProps<"thead">, "children"> {
  asChild?: boolean;
  /** The row of heads: the name, the columns and, with a `rowMenu`, the actions. */
  children?: ReactNode;
}

/** The header: one row of `ProjectsTableHead`. */
export function ProjectsTableHeader({
  asChild,
  className,
  children,
  ...rest
}: ProjectsTableHeaderProps) {
  const { columns, more } = useProjectsTable("ProjectsTableHeader");
  return primitivePart(TableHeader, "thead", "fg-table-header", asChild, className, {
    "data-slot": "projects-table-header",
    ...rest,
    children: (
      <TableRow className="fg-ptable-row fg-ptable-headrow">
        {children ?? (
          <>
            <ProjectsTableHead column="name" />
            {columns.map((c) => (
              <ProjectsTableHead key={c} column={c} />
            ))}
            {more ? <ProjectsTableHead column="actions" /> : null}
          </>
        )}
      </TableRow>
    ),
  });
}

export interface ProjectsTableHeadProps extends Omit<ComponentProps<"th">, "children"> {
  /** The column: `name`, one of the others, or `actions` (the column of the ⋯, named for readers). */
  column: ProjectSortKey | "actions";
  asChild?: boolean;
  /** The column's name, in a sorting button when the table is sortable. */
  children?: ReactNode;
}

/** The head of a column; with `sortable`, a button that sorts the rows by it. */
export function ProjectsTableHead({
  column,
  asChild,
  className,
  style,
  children,
  ...rest
}: ProjectsTableHeadProps) {
  const { sortable, sort, sortBy } = useProjectsTable("ProjectsTableHead");
  const width = column === "actions" ? MORE : column === "name" ? undefined : WIDTHS[column];
  const props = {
    scope: "col",
    "data-slot": "projects-table-head",
    style: { ...(width ? { width } : {}), ...style },
    ...rest,
  };
  if (column === "actions") {
    return primitivePart(TableHead, "th", "fg-table-head", asChild, cx("fg-ptable-th", className), {
      ...props,
      children: children ?? <span className="fg-sr">Actions</span>,
    });
  }
  const on = sort?.key === column;
  return primitivePart(
    TableHead,
    "th",
    "fg-table-head",
    asChild,
    cx("fg-ptable-th", column === "issues" && "fg-ptable-num", className),
    {
      ...props,
      ...(sortable
        ? { "aria-sort": on ? (sort.direction === "asc" ? "ascending" : "descending") : "none" }
        : {}),
      children: sortable ? (
        <button type="button" className="fg-ptable-sort" onClick={() => sortBy(column)}>
          {children ?? HEADS[column]}
          {on ? (
            <Icon
              icon={sort.direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
              size={12}
              variant="mono"
            />
          ) : null}
        </button>
      ) : (
        (children ?? HEADS[column])
      ),
    },
  );
}

/* ---------------------------------------------------------------- the body */

export interface ProjectsTableBodyProps extends Omit<ComponentProps<"tbody">, "children"> {
  asChild?: boolean;
  /** A `ProjectsTableRow` per project in the table's order, or `ProjectsTableEmpty`, by default. */
  children?: ReactNode;
}

/** The body: the rows. */
export function ProjectsTableBody({
  asChild,
  className,
  children,
  ...rest
}: ProjectsTableBodyProps) {
  const { rows } = useProjectsTable("ProjectsTableBody");
  return primitivePart(TableBody, "tbody", "fg-table-body", asChild, className, {
    "data-slot": "projects-table-body",
    ...rest,
    children:
      children ??
      (rows.length === 0 ? (
        <ProjectsTableEmpty />
      ) : (
        rows.map((project) => <ProjectsTableRow key={project.id} project={project} />)
      )),
  });
}

/** What the table says when there is no project: `empty`, over a hatched band. */
export function ProjectsTableEmpty({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"td">, "colSpan">) {
  const { columns, more, empty } = useProjectsTable("ProjectsTableEmpty");
  return (
    <TableRow className="fg-ptable-row-empty">
      <TableCell
        data-slot="projects-table-empty"
        colSpan={columns.length + 1 + (more ? 1 : 0)}
        {...rest}
        className={cx("fg-ptable-empty", className)}
      >
        <span>{children ?? empty}</span>
      </TableCell>
    </TableRow>
  );
}

export interface ProjectsTableRowProps extends Omit<ComponentProps<"tr">, "children"> {
  project: ProjectItem;
  asChild?: boolean;
  /** The name, a cell per column and the actions by default. */
  children?: ReactNode;
}

/** One project's row, in its right-click menu. */
export function ProjectsTableRow({
  project: p,
  asChild,
  className,
  children,
  ...rest
}: ProjectsTableRowProps) {
  const { columns, more, onOpen, href, collection, rowMenu, onRowAction } =
    useProjectsTable("ProjectsTableRow");
  const link = onOpen !== undefined || href !== undefined;
  const menu = {
    items: rowMenu?.(p),
    onSelect: (actionId: string) => onRowAction?.(p.id, actionId),
    label: `Actions on ${p.name}`,
  };
  return (
    <RowMenuArea asChild {...menu}>
      {primitivePart(
        TableRow,
        "tr",
        "fg-table-row",
        asChild,
        cx("fg-ptable-row", link && "fg-ptable-link", className),
        {
          "data-slot": "projects-table-row",
          "data-project": p.id,
          ...(link ? collection.getItemProps(p.id) : {}),
          ...rest,
          children: children ?? (
            <>
              <ProjectsTableName project={p} />
              {columns.map((c) => (
                <ProjectsTableCell key={c} project={p} column={c} />
              ))}
              {more ? <ProjectsTableActions project={p} /> : null}
            </>
          ),
        },
      )}
    </RowMenuArea>
  );
}

/* ---------------------------------------------------------------- the cells */

export interface ProjectsTableNameProps extends Omit<ComponentProps<"td">, "children"> {
  project: ProjectItem;
  asChild?: boolean;
  /** The icon, the name (a link or a button when the row opens) and the summary by default. */
  children?: ReactNode;
}

/** The first cell: the project's mark, its name, one dimmed line after it. */
export function ProjectsTableName({
  project: p,
  asChild,
  className,
  children,
  ...rest
}: ProjectsTableNameProps) {
  const { onOpen, href } = useProjectsTable("ProjectsTableName");
  const opens = href !== undefined || onOpen !== undefined;
  return primitivePart(TableCell, "td", "fg-table-cell", asChild, className, {
    "data-slot": "projects-table-name",
    ...rest,
    children: children ?? (
      <div className="fg-ptable-name">
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
        ) : opens ? (
          <button
            type="button"
            className="fg-ptable-title fg-ptable-open"
            onClick={() => onOpen?.(p.id)}
          >
            {p.name}
          </button>
        ) : (
          <span className="fg-ptable-title">{p.name}</span>
        )}
        {p.summary ? <span className="fg-ptable-summary">{p.summary}</span> : null}
      </div>
    ),
  });
}

export interface ProjectsTableCellProps extends Omit<ComponentProps<"td">, "children"> {
  project: ProjectItem;
  column: ProjectColumn;
  asChild?: boolean;
  /** What the cell shows; its mark, in the trigger of its picker when editable, by default. */
  children?: ReactNode;
}

/** The cell of a column: the project's value, or the trigger of its picker when the table edits. */
export function ProjectsTableCell({
  project: p,
  column,
  asChild,
  className,
  children,
  ...rest
}: ProjectsTableCellProps) {
  const ctx = useProjectsTable("ProjectsTableCell");
  return primitivePart(
    TableCell,
    "td",
    "fg-table-cell",
    asChild,
    cx("fg-ptable-td", column === "issues" && "fg-ptable-num", className),
    {
      "data-slot": "projects-table-cell",
      "data-column": column,
      ...rest,
      children: children ?? <ProjectEdit ctx={ctx} project={p} column={column} />,
    },
  );
}

export interface ProjectsTableActionsProps extends Omit<ComponentProps<"td">, "children"> {
  project: ProjectItem;
  asChild?: boolean;
  /** The ⋯ of the row menu by default. */
  children?: ReactNode;
}

/** The last cell: the ⋯ that opens the row's menu. */
export function ProjectsTableActions({
  project: p,
  asChild,
  className,
  children,
  ...rest
}: ProjectsTableActionsProps) {
  const { rowMenu, onRowAction, menuFor, setMenuFor } = useProjectsTable("ProjectsTableActions");
  return primitivePart(
    TableCell,
    "td",
    "fg-table-cell",
    asChild,
    cx("fg-ptable-td fg-ptable-acts", className),
    {
      "data-slot": "projects-table-actions",
      ...rest,
      children: children ?? (
        <RowMore
          items={rowMenu?.(p)}
          onSelect={(actionId) => onRowAction?.(p.id, actionId)}
          label={`Actions on ${p.name}`}
          open={menuFor === p.id}
          onOpenChange={(open) => setMenuFor(open ? p.id : null)}
        />
      ),
    },
  );
}

/* ---------------------------------------------------------------- what a cell draws */

function ProjectEdit({
  ctx,
  project: p,
  column: col,
}: {
  ctx: ProjectsTableContext;
  project: ProjectItem;
  column: ProjectColumn;
}) {
  const shown = <ProjectMark ctx={ctx} project={p} column={col} />;
  if (col !== "status" && col !== "health" && col !== "lead" && col !== "target") return shown;
  const { onProjectChange, editors, people, today } = ctx;
  if (!onProjectChange) return shown;
  const editorOf = <F extends ProjectField>(field: F) => {
    const given = editors?.[field];
    if (given === false) return null;
    return (given ?? {}) as Exclude<ProjectEditors[F], false | undefined>;
  };
  const options = editorOf(col);
  if (!options) return shown;
  const change = (patch: Partial<ProjectItem>) => onProjectChange(p.id, patch);
  if (options.render) return <Stop className="fg-issue-custom">{options.render(p, change)}</Stop>;
  const open = ctx.openProps(p.id, col);
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
}

function ProjectMark({
  ctx,
  project: p,
  column,
}: {
  ctx: ProjectsTableContext;
  project: ProjectItem;
  column: ProjectColumn;
}) {
  switch (column) {
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
      const person = p.lead ? ctx.people?.find((x) => x.id === p.lead) : undefined;
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
        <span className="fg-ptable-mono">
          {p.target ? formatShort(p.target, thisYear(ctx.today)) : "—"}
        </span>
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
    <Popover>
      <PopoverTrigger
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
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="fg-ptable-detail"
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
      </PopoverContent>
    </Popover>
  );
}
