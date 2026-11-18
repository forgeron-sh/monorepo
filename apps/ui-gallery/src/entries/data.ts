/* Blocks of the "data and shell" group. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const format: PropRow = {
  name: "format",
  type: "(value: number) => string",
  default: "String",
  description: "Writes a value.",
};

/** Gallery pages of the "data and shell" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "kpi-row",
    name: "KPI row",
    summary: "Key figures side by side: label, figure, change and trend, in glued cells.",
    imports: ["KpiRow"],
    props: [
      {
        name: "items",
        type: "{ label, value, delta?, better?, hint?, trend? }[]",
        description:
          "One cell each. delta is a ratio (0.12 reads +12%); better says which way is good news.",
      },
      {
        name: "formatDelta",
        type: "(delta: number) => string",
        default: "signed percent",
        description: "Writes a delta, for a change that is not a ratio: +3 tickets.",
      },
      className,
    ],
  },
  {
    slug: "stat",
    name: "Stat",
    summary: "One figure with its label and a hint: a tile on its own.",
    imports: ["Stat"],
    props: [
      {
        name: "label",
        type: "ReactNode",
        description: "What the figure counts, in mono capitals.",
      },
      { name: "value", type: "ReactNode", description: "The figure, already written." },
      { name: "hint", type: "ReactNode", description: "Context under it: last 7 days." },
      className,
    ],
  },
  {
    slug: "line-chart",
    name: "Line chart",
    summary:
      "A pixel step line over time. Hover or the arrows read a point; the values are a table too.",
    imports: ["LineChart"],
    props: [
      { name: "title", type: "string", description: "Names the chart; also its caption." },
      { name: "points", type: "{ label, value }[]", description: "In order, oldest first." },
      {
        name: "previous",
        type: "number[]",
        description: "The same points one period earlier, dotted in grey behind the line.",
      },
      format,
      { name: "height", type: "number", default: "160", description: "Of the plot, in px." },
      className,
    ],
  },
  {
    slug: "sparkline",
    name: "Sparkline",
    summary: "A small step line of a trend, next to a figure or in a row.",
    imports: ["Sparkline"],
    props: [
      {
        name: "values",
        type: "number[]",
        description: "Oldest first; drawn from lowest to highest.",
      },
      { name: "width / height", type: "number", default: "96 / 24", description: "In px." },
      {
        name: "tone",
        type: `"accent" | "ink"`,
        default: `"accent"`,
        description: "Ember for the figure that matters, grey for a quiet one.",
      },
      {
        name: "label",
        type: "string",
        description: "Names the trend; without it the line is decorative.",
      },
      className,
    ],
  },
  {
    slug: "bar-chart",
    name: "Bar chart",
    summary: "Horizontal pixel bars that carry their label and value. One may stand out.",
    imports: ["BarChart"],
    props: [
      { name: "title", type: "string", description: "Names the chart; also its caption." },
      { name: "data", type: "{ label, value }[]", description: "One bar each, in order." },
      format,
      {
        name: "highlight",
        type: "string",
        description: "The label of the bar drawn in ember: this month, the leader.",
      },
      className,
    ],
  },
  {
    slug: "table",
    name: "Table",
    summary: "Typed columns, 44px rows; a clickable row opens on Enter.",
    imports: ["Table"],
    props: [
      {
        name: "columns",
        type: "{ key, header, align?, mono?, render? }[]",
        description: "row[key] by default; render for anything else.",
      },
      { name: "rows", type: "Row[]", description: "The data." },
      { name: "rowKey", type: "(row) => Key", description: "Identifies a row." },
      {
        name: "onRowClick",
        type: "(row) => void",
        description: "Makes each row a focusable button: click, Enter or Space.",
      },
      {
        name: "empty",
        type: "ReactNode",
        default: `"Nothing to show"`,
        description: "Shown when there is no row.",
      },
      { name: "label", type: "string", description: "Names the table when no heading does." },
      className,
    ],
  },
  {
    slug: "data-grid",
    name: "Data grid",
    summary: "Rows of a database table: typed headers, constraints, sort, NULL and masked cells.",
    imports: ["DataGrid", "ConstraintChip"],
    props: [
      { name: "label", type: "string", description: "Names the grid; it scrolls on the keyboard." },
      {
        name: "columns",
        type: "{ name, type, chips?, masked?, numeric? }[]",
        description: "chips: Primary, Not null, Unique, Foreign key. masked says why.",
      },
      {
        name: "rows",
        type: "(string | number | null | { masked })[][]",
        description: "null reads NULL; a masked cell says it is masked.",
      },
      {
        name: "sort / onSort",
        type: "{ column, descending } / (column) => void",
        description: "The sort is the page's: the grid only shows it and asks for it.",
      },
      { name: "onOpenRow", type: "(index) => void", description: "Click or Enter on a row." },
      {
        name: "onCopyCell",
        type: "(text, column) => void",
        description: "A double click on a cell gives its text.",
      },
      { name: "selectedRow", type: "number", description: "The open row, marked in ember." },
      { name: "empty", type: "ReactNode", default: `"No rows"`, description: "No row." },
      className,
    ],
  },
  {
    slug: "pager",
    name: "Pager",
    summary: "Where the page sits, 51–100 of 120, and Previous and Next.",
    imports: ["Pager"],
    props: [
      { name: "page", type: "number", description: "1-based." },
      { name: "pageSize", type: "number", description: "Rows per page." },
      { name: "count", type: "number", description: "Rows on this page." },
      { name: "total", type: "number", description: "Every row that matches, when known." },
      { name: "hasMore", type: "boolean", description: "Whether Next leads somewhere." },
      { name: "onPage", type: "(page) => void", description: "Previous or Next." },
      {
        name: "limitNote",
        type: "ReactNode",
        description: "When paging stops short, a way to narrow instead.",
      },
      className,
    ],
  },
  {
    slug: "audit-log",
    name: "Audit log",
    summary: "Who did what to which thing, by day. Refusals say so; detail folds open.",
    imports: ["AuditLog"],
    props: [
      {
        name: "events",
        type: "{ id, at, actor, actorIcon?, action, target?, outcome?, detail? }[]",
        description: "Newest first. at: YYYY-MM-DD HH:MM. outcome: ok, denied or failed.",
      },
      {
        name: "today",
        type: "string",
        description: "YYYY-MM-DD: its day and the one before read Today and Yesterday.",
      },
      { name: "defaultExpanded", type: "string[]", description: "Rows open at first." },
      { name: "label", type: "string", default: `"Audit log"`, description: "Its name." },
      {
        name: "empty",
        type: "ReactNode",
        default: `"Nothing happened yet"`,
        description: "Shown when there is no event.",
      },
      className,
    ],
  },
  {
    slug: "detail-list",
    name: "Detail list",
    summary: "Label and value pairs, stacked: the facts beside a record.",
    imports: ["DetailList"],
    props: [
      { name: "items", type: "{ label, value }[]", description: "In order; value is any node." },
      className,
    ],
  },
  {
    slug: "tool-card",
    name: "Tool card",
    summary: "A tool in a grid: monogram, name, summary, facts and the one thing to do.",
    imports: ["ToolCard", "ToolIcon"],
    props: [
      { name: "name", type: "string", description: "Its first letters make the monogram." },
      { name: "summary", type: "string", description: "What it does; three lines at most." },
      { name: "href", type: "string", description: "The tool's page: the whole card links there." },
      {
        name: "onNavigate",
        type: "(href) => void",
        description: "Routes a plain click without a page load.",
      },
      { name: "meta", type: "ReactNode", description: "Small facts by the name: version, status." },
      {
        name: "footer",
        type: "ReactNode",
        description: "The one thing to do: Open, Connect. Stays clickable over the link.",
      },
      className,
    ],
  },
  {
    slug: "settings-group",
    name: "Settings group",
    summary: "A titled card of rows, label left and control right; a link row ends with a chevron.",
    imports: ["SettingsGroup", "SettingsRow"],
    props: [
      { name: "title / description", type: "ReactNode", description: "Of the group." },
      {
        name: "tone",
        type: `"default" | "danger"`,
        default: `"default"`,
        description: "A danger zone, outlined in red. Last on the page.",
      },
      {
        name: "SettingsRow label / description",
        type: "ReactNode",
        description: "Left: what the setting is.",
      },
      {
        name: "SettingsRow children",
        type: "ReactNode",
        description: "Right: a switch, a select, a button, a value.",
      },
      {
        name: "SettingsRow href / value",
        type: "string / ReactNode",
        description: "The row links to a sub-page, its current value before the chevron.",
      },
      {
        name: "SettingsRow onNavigate",
        type: "(href, event) => void",
        description: "Routes a plain click without a page load.",
      },
      className,
    ],
  },
  {
    slug: "drawer",
    name: "Drawer",
    summary: "A side panel for one record. Not modal; Escape closes, focus comes back.",
    imports: ["Drawer"],
    props: [
      { name: "title", type: "ReactNode", description: "Names the panel." },
      { name: "description", type: "ReactNode", description: "One line under the title." },
      { name: "onClose", type: "() => void", description: "Escape and the close button." },
      {
        name: "actions",
        type: "ReactNode",
        description: "Small buttons before the close button: copy a link, open in full.",
      },
      { name: "footer", type: "ReactNode", description: "Buttons at the foot." },
      { name: "children", type: "ReactNode", description: "The body; it scrolls." },
      className,
    ],
  },
  {
    slug: "app-shell",
    name: "App shell",
    summary: "Sidebar, content and a skip link; at phone width the sidebar folds behind a menu.",
    imports: ["AppShell", "Sidebar", "Nav"],
    props: [
      { name: "sidebar", type: "ReactNode", description: "Left column: a Sidebar, an AppSidebar." },
      { name: "topbar", type: "ReactNode", description: "Beside the menu button at phone width." },
      {
        name: "menuOpen / onMenuToggle",
        type: "boolean / () => void",
        description: "The folded sidebar, opened by the menu button (phone width).",
      },
      {
        name: "contentId",
        type: "string",
        default: `"content"`,
        description: "Where the skip link jumps.",
      },
      {
        name: "frame",
        type: `"page" | "box"`,
        default: `"page"`,
        description: "Fills the window, or its parent: then it folds by the parent's width.",
      },
      {
        name: "Nav items",
        type: "{ id, label, href, current?, badge?, icon? }[]",
        description: "The links; current gets aria-current.",
      },
      className,
    ],
  },
];
