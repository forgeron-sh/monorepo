/* Blocks of the "dashboard and analytics" group. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const title: PropRow = {
  name: "title",
  type: "string",
  description: "Names the chart; also its caption.",
};
const format: PropRow = {
  name: "format",
  type: "(value: number) => string",
  default: "String",
  description: "Writes a value.",
};
const highlight = (what: string): PropRow => ({
  name: "highlight",
  type: "string",
  description: what,
});

/** Gallery pages of the "dashboard and analytics" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "funnel",
    name: "Funnel",
    summary:
      "Stages as stepped pixel bars, with the count and the conversion from the stage before.",
    imports: ["Funnel", "dashboardFunnel"],
    props: [
      title,
      {
        name: "items",
        type: "{ label, value }[]",
        description: "The stages, first to last.",
      },
      format,
      highlight("The label of the stage drawn in ember."),
      {
        name: "unit",
        type: "string",
        description: "What a stage counts, in the tooltip: deals.",
      },
      className,
    ],
  },
  {
    slug: "heatmap",
    name: "Heatmap",
    summary:
      "Cells in five dithered steps, as a matrix or a calendar. Arrows walk the grid; the scale is in numbers.",
    imports: ["Heatmap", "dashboardHeatLevel", "dashboardCalendarCells"],
    props: [
      title,
      {
        name: "rows / columns / values",
        type: "string[] / string[] / number[][]",
        description: "A matrix: values[row][column].",
      },
      {
        name: "items / from / to",
        type: "{ date, value }[] / string / string",
        description: "A calendar: one value per day (YYYY-MM-DD) of the period.",
      },
      {
        name: "weekStart",
        type: `"mon" | "sun"`,
        default: `"mon"`,
        description: "The first row of a calendar.",
      },
      format,
      highlight("Matrix: the row to stand out. Calendar: a day, YYYY-MM-DD."),
      { name: "unit", type: "string", description: "What a value counts, in the readout." },
      { name: "cell", type: "number", default: "14", description: "Side of a cell, in px." },
      className,
    ],
  },
  {
    slug: "donut",
    name: "Donut",
    summary:
      "A pixel ring cut into slices, each with its own pattern. The key gives value and share.",
    imports: ["Donut", "dashboardRing"],
    props: [
      title,
      { name: "items", type: "{ label, value }[]", description: "One slice each." },
      format,
      highlight("The label of the slice drawn in ember; the others share the greys."),
      { name: "size", type: "number", default: "160", description: "Width of the ring, in px." },
      {
        name: "thickness",
        type: "number",
        default: "12",
        description: "Of the ring, in chart pixels (two px each).",
      },
      { name: "center", type: "ReactNode", description: "In the hole; the total by default." },
      className,
    ],
  },
  {
    slug: "gauge",
    name: "Gauge",
    summary: "A value against its target on a half ring. The state is a word, the target a mark.",
    imports: ["Gauge", "dashboardGaugeState"],
    props: [
      { name: "title", type: "string", description: "Names the gauge." },
      { name: "value", type: "number", description: "Where it stands now." },
      { name: "target", type: "number", description: "What it should reach." },
      {
        name: "min / max",
        type: "number",
        default: "0 / a quarter above",
        description: "The scale. max defaults to a quarter above the larger of value and target.",
      },
      {
        name: "thresholds",
        type: "{ at, label, tone }[]",
        default: "Behind, Close, On target",
        description:
          "States from the value at which each starts; tone is bad, warn or good. Say a state in words.",
      },
      format,
      { name: "size", type: "number", default: "200", description: "Width, in px." },
      className,
    ],
  },
  {
    slug: "stacked-bar",
    name: "Stacked bar",
    summary: "Bars split into series, horizontal or vertical. The key turns a series on or off.",
    imports: ["StackedBar", "dashboardStack"],
    props: [
      title,
      {
        name: "series",
        type: "{ key, label }[]",
        description: "What each bar is made of, in stacking order.",
      },
      {
        name: "items",
        type: "{ label, values: Record<key, number> }[]",
        description: "One bar each.",
      },
      {
        name: "orientation",
        type: `"horizontal" | "vertical"`,
        default: `"horizontal"`,
        description: "Rows, or columns.",
      },
      {
        name: "normalize",
        type: "boolean",
        default: "false",
        description: "Every bar as long as the plot: shares instead of amounts.",
      },
      format,
      highlight("The label of the bar to stand out."),
      { name: "height", type: "number", default: "160", description: "Of a vertical plot, in px." },
      className,
    ],
  },
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
    slug: "delta-badge",
    name: "Delta badge",
    summary: "A change said by an arrow, a sign and a word; the tone only repeats it.",
    imports: ["DeltaBadge", "dashboardRatio", "dashboardDeltaWay"],
    props: [
      {
        name: "delta",
        type: "number | null",
        description: "A ratio: 0.12 reads +12%. null: nothing to compare with.",
      },
      {
        name: "better",
        type: `"up" | "down"`,
        default: `"up"`,
        description: "Which way is good news: down for open tickets.",
      },
      {
        name: "format",
        type: "(delta: number) => string",
        default: "+12.4%",
        description: "Writes the delta.",
      },
      { name: "value", type: "ReactNode", description: "The figure it belongs to." },
      { name: "hint", type: "ReactNode", description: "What it was compared with: vs last month." },
      {
        name: "showWord",
        type: "boolean",
        default: "true",
        description: "Better, Worse or Flat after the sign. Off, it is still read aloud.",
      },
      { name: "size", type: `"sm" | "md"`, default: `"md"`, description: "Of the badge." },
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
