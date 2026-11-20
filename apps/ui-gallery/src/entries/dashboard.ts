/* Blocks of the "dashboard and analytics" group (the charts are in charts.ts). */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };

/** Gallery pages of the "dashboard and analytics" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "widget-grid",
    name: "Widget grid",
    summary: "Widgets on 12 columns. In edit mode: drag, resize, arrows. One column when narrow.",
    imports: ["WidgetGrid", "dashboardPlace", "dashboardSync", "dashboardNextSlot"],
    props: [
      {
        name: "widgets",
        type: "{ id, label, content, locked?, minW?, minH?, maxW?, maxH? }[]",
        description: "What the grid shows; label names it in the edit controls.",
      },
      {
        name: "layout / defaultLayout / onLayoutChange",
        type: "{ id, x, y, w, h }[]",
        description:
          "Where each widget sits, in cells. Plain data: save it. A widget without a place takes the first free slot.",
      },
      {
        name: "editing / defaultEditing / onEditingChange",
        type: "boolean",
        default: "false",
        description:
          "Edit mode. Drag by the body, resize by the corner; arrows move, Shift and arrows resize, Delete removes.",
      },
      { name: "columns", type: "number", default: "12", description: "Columns of the grid." },
      { name: "rowHeight / gap", type: "number", default: "96 / 12", description: "In px." },
      {
        name: "collapseBelow",
        type: "number",
        default: "640",
        description: "Under this width the grid is one column, in reading order.",
      },
      {
        name: "onRemoveWidget",
        type: "(id) => void",
        description:
          "Shows a remove button on each widget in edit mode. The page drops the widget.",
      },
      {
        name: "onAddWidget / addLabel",
        type: "() => void / string",
        description: "Shows the add button above the grid in edit mode.",
      },
      { name: "label", type: "string", default: `"Dashboard"`, description: "Names the region." },
      { name: "empty", type: "ReactNode", description: "Shown when there is no widget." },
      className,
    ],
  },
  {
    slug: "widget-frame",
    name: "Widget frame",
    summary:
      "A titled box for a chart: menu, loading, error with retry, empty, and full size in a dialog.",
    imports: ["WidgetFrame"],
    props: [
      {
        name: "title / subtitle",
        type: "ReactNode",
        description: "The heading and one line under it.",
      },
      {
        name: "menu / onMenuSelect",
        type: "ActionMenuEntry[] / (id) => void",
        description: "The rows of the … menu.",
      },
      {
        name: "expandable",
        type: "boolean",
        description:
          "A button opens the content in a dialog. expanded, defaultExpanded and onExpandedChange control it.",
      },
      { name: "loading", type: "boolean", description: "Skeletons in place of the content." },
      {
        name: "error / onRetry",
        type: "ReactNode / () => void",
        description: "A message and a Retry button. error true gives the default message.",
      },
      {
        name: "empty / emptyText",
        type: "boolean / ReactNode",
        description: "Nothing to show for these filters.",
      },
      {
        name: "dragHandle",
        type: "ReactNode",
        description: "Before the title: the grip to drag by.",
      },
      {
        name: "actions / footer",
        type: "ReactNode",
        description: "Controls before the menu; a line under the content.",
      },
      {
        name: "headingLevel",
        type: "2 | 3 | 4",
        default: "3",
        description: "Of the title.",
      },
      className,
    ],
  },
  {
    slug: "date-range-compare",
    name: "Date range compare",
    summary:
      "A period and what it is compared to: previous period, previous year, or a custom one.",
    imports: ["DateRangeCompare", "dashboardCompareRanges"],
    props: [
      {
        name: "value / defaultValue",
        type: "{ range, compare, custom? }",
        description:
          "compare: none, previous-period, previous-year or custom. dashboardCompareRanges(value) gives the two ranges.",
      },
      {
        name: "onChange",
        type: "(value, ranges) => void",
        description: "The period and { current, previous, days }.",
      },
      {
        name: "compareOptions",
        type: "DashboardCompare[]",
        default: "all four",
        description: "What can be compared with.",
      },
      { name: "label", type: "string", default: `"Period"`, description: "Names the picker." },
      {
        name: "today / presets / min / max",
        type: "as DateRangePicker",
        description: "Passed through.",
      },
      className,
    ],
  },
  {
    slug: "metric-picker",
    name: "Metric picker",
    summary: "Pick a measure, a grouping and filters. The value is a query to run, not data.",
    imports: ["MetricPicker", "dashboardQueryText", "dashboardEmptyQuery"],
    props: [
      {
        name: "measures",
        type: "{ id, label, hint?, aggregations? }[]",
        description: "What can be measured, and how each adds up.",
      },
      {
        name: "groupings",
        type: "{ id, label, hint?, kind? }[]",
        description: "kind time adds a slice of time (day, week, month).",
      },
      {
        name: "fields",
        type: "FilterField[]",
        description: "What can be filtered; the same as the FilterBar. Without it, no filter step.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "{ measure, aggregation, groupBy, interval, filters }",
        description: "The question, serialisable.",
      },
      {
        name: "intervals",
        type: "DashboardInterval[]",
        default: "day, week, month",
        description: "Offered for a time grouping.",
      },
      {
        name: "summary",
        type: "boolean",
        default: "true",
        description: "The query in a sentence.",
      },
      { name: "label", type: "string", default: `"Question"`, description: "Names the group." },
      className,
    ],
  },
];
