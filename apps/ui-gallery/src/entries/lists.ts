import type { Atom } from "../types";

const shared = {
  labels: {
    name: "labels",
    type: "{ value, label, color }[]",
    description: "The labels issues refer to, with their names and colours.",
  },
  people: {
    name: "people",
    type: "{ id, name, src? }[]",
    description: "The people issues are assigned to.",
  },
  today: {
    name: "today",
    type: "string",
    description: "YYYY-MM-DD: earlier due dates read as overdue, in red.",
  },
  properties: {
    name: "properties",
    type: `("id" | "priority" | "status" | "labels" | "due" | "assignee" | "author")[]`,
    default: "all but author",
    description: "What each issue shows. The author shows only when asked for.",
  },
  selected: {
    name: "selected / defaultSelected",
    type: "string | null",
    description: "The current issue, marked; the arrows move it. Controlled or not.",
  },
  onSelectedChange: {
    name: "onSelectedChange",
    type: "(id: string) => void",
    description: "When the arrows or a click move the current issue.",
  },
  onOpen: {
    name: "onOpen",
    type: "(id: string) => void",
    description: "A click or Enter on an issue.",
  },
  collapsed: {
    name: "collapsed / defaultCollapsed",
    type: "string[]",
    description: "The keys of the folded groups. Controlled or not.",
  },
  onCollapsedChange: {
    name: "onCollapsedChange",
    type: "(keys: string[]) => void",
    description: "When a group is folded or opened.",
  },
  showCounts: {
    name: "showCounts",
    type: "boolean",
    default: "false",
    description: "The number of issues next to a group's name. Off: no counters as chrome.",
  },
  className: { name: "className", type: "string", description: "Extra classes." },
  onIssueChange: {
    name: "onIssueChange",
    type: "(id: string, patch: Partial<IssueItem>) => void",
    description:
      "Turns editing on: each shown property becomes the trigger of its picker. Absent: read-only.",
  },
  editors: {
    name: "editors",
    type: "{ status?, priority?, labels?, assignee?, author?, due? }",
    description:
      "Per property: false for read-only; options (statuses, names, people, me, noneLabel, labels, presets, clearable); render(issue, change) for your own. Author is read-only unless given.",
  },
  shortcuts: {
    name: "shortcuts",
    type: "boolean",
    default: "true",
    description:
      "S, P, A, L, D open the matching picker on the current issue while the block has the focus.",
  },
  rowMenu: {
    name: "rowMenu",
    type: "(issue) => ActionMenuEntry[]",
    description: "The actions of an issue: right click, Shift+F10, or the ⋯ shown on hover.",
  },
  onRowAction: {
    name: "onRowAction",
    type: "(id: string, actionId: string) => void",
    description: "The action chosen in rowMenu.",
  },
};

/** Gallery pages of the "lists" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "issue-list",
    name: "Issue list",
    summary:
      "Issues in foldable groups, one dense row each. Arrows move, Enter opens. Composed from parts, with a props shorthand.",
    imports: [
      "IssueList",
      "IssueListGroup",
      "IssueListHeader",
      "IssueListToggle",
      "IssueListAdd",
      "IssueListRows",
      "IssueListRow",
      "IssueRow",
    ],
    props: [
      {
        name: "groups",
        type: "{ key, name, status?, glyph?, issues }[]",
        description:
          "The groups in order. An issue: { id, title, status, priority?, labels?, due?, assignee?, author? }.",
      },
      shared.labels,
      shared.people,
      shared.today,
      shared.properties,
      shared.selected,
      shared.onSelectedChange,
      shared.onOpen,
      shared.collapsed,
      shared.onCollapsedChange,
      {
        name: "showEmptyGroups",
        type: "boolean",
        default: "false",
        description: "Shows a group with no issue.",
      },
      shared.showCounts,
      {
        name: "onAdd",
        type: "(groupKey: string) => void",
        description: "Adds a + to each group's header.",
      },
      {
        name: "empty",
        type: "ReactNode",
        default: `"No issues here yet"`,
        description: "Shown when no group has an issue.",
      },
      shared.onIssueChange,
      shared.editors,
      shared.shortcuts,
      shared.rowMenu,
      shared.onRowAction,
      shared.className,
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in place of the groups drawn from groups: IssueListGroup (group: an IssueGroup) with IssueListHeader (IssueListToggle, IssueListAdd) and IssueListRows of IssueListRow (record). They are those of RecordList; each takes className, the element's attributes, a data-slot and, where it is one element, asChild.",
      },
    ],
  },
  {
    slug: "issue-board",
    name: "Issue board",
    summary:
      "Issues as cards in columns. Layout only: moving a card is the caller's. Composed from parts, with a props shorthand.",
    imports: [
      "IssueBoard",
      "IssueBoardColumn",
      "IssueBoardColumnHeader",
      "IssueBoardColumnToggle",
      "IssueBoardColumnActions",
      "IssueBoardCards",
      "IssueBoardCard",
      "IssueBoardAdd",
      "IssueCard",
    ],
    props: [
      {
        name: "columns",
        type: "{ key, name, status?, glyph?, issues }[]",
        description: "The columns in order, with the same issues as the list.",
      },
      shared.labels,
      shared.people,
      shared.today,
      shared.properties,
      shared.selected,
      shared.onSelectedChange,
      shared.onOpen,
      {
        ...shared.collapsed,
        description: "The folded columns: a narrow strip, the name written down.",
      },
      shared.onCollapsedChange,
      shared.showCounts,
      {
        name: "onAdd",
        type: "(columnKey: string) => void",
        description: "A + in each header and a New issue button at the end of each lane.",
      },
      {
        name: "onColumnMenu",
        type: "(columnKey: string) => void",
        description: "A ⋯ in each header.",
      },
      {
        name: "renderExtra",
        type: "(issue) => ReactNode",
        description: "More chips at the end of a card: a project, an estimate.",
      },
      shared.onIssueChange,
      shared.editors,
      shared.shortcuts,
      shared.rowMenu,
      shared.onRowAction,
      shared.className,
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in place of the columns drawn from columns: IssueBoardColumn (column: an IssueGroup) with IssueBoardColumnHeader (IssueBoardColumnToggle, IssueBoardColumnActions) and IssueBoardCards of IssueBoardCard (record) and IssueBoardAdd. They are those of RecordBoard.",
      },
    ],
  },
  {
    slug: "projects-table",
    name: "Projects table",
    summary:
      "Projects in rows: health, lead, target date and progress at a glance. Point at a bar for its detail. A data table on the Table parts, composed from parts, with a props shorthand.",
    imports: [
      "ProjectsTable",
      "ProjectsTableHeader",
      "ProjectsTableHead",
      "ProjectsTableBody",
      "ProjectsTableRow",
      "ProjectsTableName",
      "ProjectsTableCell",
      "ProjectsTableActions",
      "ProjectsTableEmpty",
      "useProjectsTable",
    ],
    props: [
      {
        name: "projects",
        type: "ProjectItem[]",
        description:
          "{ id, name, summary?, icon?, color?, status, health?, lead?, target?, issues, done, started? }.",
      },
      shared.people,
      {
        name: "today",
        type: "string",
        description: "YYYY-MM-DD: target dates of another year write the year.",
      },
      {
        name: "columns",
        type: `("health" | "lead" | "target" | "issues" | "progress" | "status")[]`,
        default: "all",
        description: "The columns after the name. Health shows only when a project has one.",
      },
      {
        name: "sortable",
        type: "boolean",
        default: "false",
        description: "Makes the headers buttons that sort the rows.",
      },
      {
        name: "sort / defaultSort",
        type: `{ key, direction: "asc" | "desc" } | null`,
        description: "The order of the rows. Controlled or not.",
      },
      {
        name: "onSortChange",
        type: "(sort) => void",
        description: "When a header is clicked.",
      },
      { name: "onOpen", type: "(id: string) => void", description: "A click on a row." },
      {
        name: "href",
        type: "(project) => string",
        description: "Makes each row a link to its page.",
      },
      {
        name: "onProjectChange",
        type: "(id: string, patch: Partial<ProjectItem>) => void",
        description:
          "Turns editing on: status, health, lead and target open their pickers. Absent: read-only.",
      },
      {
        name: "editors",
        type: "{ status?, health?, lead?, target? }",
        description:
          "Per field: false for read-only; options (statuses, people, me, noneLabel, presets, clearable); render(project, change) for your own.",
      },
      {
        ...shared.rowMenu,
        type: "(project) => ActionMenuEntry[]",
        description: "The actions of a project: right click, Shift+F10, or a ⋯ column.",
      },
      shared.onRowAction,
      shared.className,
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in place of the header and the rows: ProjectsTableHeader (ProjectsTableHead column), ProjectsTableBody of ProjectsTableRow (project) holding ProjectsTableName, ProjectsTableCell (project, column) and ProjectsTableActions. They read the order, the editing and the menus from the table, and take the attributes of td and tr.",
      },
      {
        name: "…rest",
        type: "TableHTMLAttributes",
        description:
          "The attributes of the <table>. The arrows move between rows when the table has onOpen or href.",
      },
    ],
  },
];
