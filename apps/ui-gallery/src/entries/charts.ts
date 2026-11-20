/* Gallery entries of the Charts category (D-157): the chart parts and every chart type. */
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
const dataKey: PropRow = {
  name: "dataKey",
  type: "string",
  description: "The series of a ChartContainer config that colours it and names it in the tooltip.",
};

const markers: PropRow = {
  name: "markers",
  type: "{ at, label }[]",
  description:
    "Events at points (at is a point's label): a numbered flag and a rule over it, a key under the axis, the label in the readout.",
};

/** Gallery pages of the charts, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "chart",
    name: "Chart",
    summary:
      "shadcn's Chart without recharts: a container that colours the series from a config, a tooltip and a legend around our pixel charts.",
    imports: [
      "ChartContainer",
      "ChartTooltip",
      "ChartTooltipContent",
      "ChartLegend",
      "ChartLegendContent",
      "useChart",
      "chartColor",
      "CHART_COLORS",
    ],
    props: [
      {
        name: "ChartContainer config",
        type: "{ [key]: { label?, color?, icon? } }",
        description:
          "One entry per series. Sets --color-<key> (default: ember, then the ink tones, success, warning, danger); our charts read it through their dataKey, or by position.",
      },
      {
        name: "ChartTooltip content",
        type: "ReactElement",
        default: "<ChartTooltipContent />",
        description:
          "Shows what the chart reports on hover or arrow keys; place it inside the container.",
      },
      {
        name: "ChartTooltipContent",
        type: "indicator, hideLabel, hideIndicator, labelFormatter, formatter, nameKey, labelKey, color",
        description: "indicator is dot (default), line or dashed.",
      },
      {
        name: "ChartLegend content",
        type: "ReactElement",
        default: "<ChartLegendContent />",
        description:
          "The key of the config's series; ChartLegendContent takes hideIcon, verticalAlign, nameKey.",
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
      dataKey,
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
      dataKey,
      markers,
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
      dataKey,
      className,
    ],
  },
  {
    slug: "kpi-row",
    name: "KPI row",
    summary: "Key figures side by side: label, figure, change and trend, in glued cells.",
    imports: ["KpiRow", "KpiRowItem"],
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
      {
        name: "dataKey",
        type: "string",
        description: "The config series that colours the sparklines; default the first.",
      },
      {
        name: "children",
        type: "ReactNode",
        description:
          "`KpiRowItem`s in place of `items`: the same fields as props, children for more under the figure (a link, a badge).",
      },
      className,
    ],
  },
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
    imports: ["Donut", "DonutRing", "DonutCenter", "DonutKey", "dashboardRing"],
    props: [
      title,
      {
        name: "items",
        type: "{ label, value }[]",
        description: "One slice each; or `data` with `dataKey` and `nameKey`.",
      },
      {
        name: "data",
        type: "Record<string, unknown>[]",
        description:
          "Rows of any shape, as shadcn's Pie: `nameKey` names a slice, `dataKey` gives its value.",
      },
      {
        name: "dataKey",
        type: "string",
        default: '"value"',
        description: "The field of a row that gives its value.",
      },
      {
        name: "nameKey",
        type: "string",
        default: '"label"',
        description: "The field of a row that names its slice (a config key).",
      },
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
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, laid out as you like: `DonutRing` (`size`, `thickness`, the hole as children), `DonutCenter` (`label`, or children), `DonutKey` (`hideShare`). Without children, the ring and its key.",
      },
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
    imports: ["StackedBar", "StackedBarKey", "StackedBarBars", "dashboardStack"],
    props: [
      title,
      {
        name: "series",
        type: "{ key, label }[]",
        description:
          "What each bar is made of, in stacking order; in a ChartContainer, default the keys of its config.",
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
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, placed as you like: `StackedBarKey` and `StackedBarBars` (`height`). Without children, the key above the bars.",
      },
      className,
    ],
  },
  {
    slug: "column-chart",
    name: "Column chart",
    summary:
      "Pixel columns over time, from zero. The last period dotted over each column, a target as a rule; hover or the arrows read one.",
    imports: ["ColumnChart"],
    props: [
      title,
      { name: "points", type: "{ label, value }[]", description: "One column each, oldest first." },
      {
        name: "previous",
        type: "number[]",
        description: "The same points one period earlier: a dotted cap over each column.",
      },
      { name: "target", type: "number", description: "A dotted rule across the plot, labelled." },
      format,
      highlight("The label of the column drawn in ember: this week."),
      { name: "height", type: "number", default: "160", description: "Of the plot, in px." },
      dataKey,
      markers,
      className,
    ],
  },
  {
    slug: "waffle",
    name: "Waffle",
    summary:
      "Shares as a grid of squares, one square a part of the whole, each slice in its own pattern. Easier to count than a ring.",
    imports: ["Waffle", "WaffleGrid", "WaffleKey", "WaffleNote", "dashboardWaffle"],
    props: [
      title,
      {
        name: "items",
        type: "{ label, value }[]",
        description: "One slice each, in order; or `data` with `dataKey` and `nameKey`.",
      },
      {
        name: "data",
        type: "Record<string, unknown>[]",
        description:
          "Rows of any shape, as shadcn's Pie: `nameKey` names a slice, `dataKey` gives its value.",
      },
      format,
      highlight("The label of the slice drawn in ember; the others share the greys."),
      {
        name: "cells",
        type: "number",
        default: "100",
        description: "Squares in the grid; the counts always add up to it (largest remainder).",
      },
      { name: "columns", type: "number", default: "10", description: "Squares per row." },
      { name: "cell", type: "number", default: "14", description: "Side of a square, in px." },
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, laid out as you like: `WaffleGrid` (`columns`, `cell`), `WaffleKey` (`hideShare`), `WaffleNote`. Without children, the grid, its key and the note.",
      },
      className,
    ],
  },
  {
    slug: "status-strip",
    name: "Status strip",
    summary:
      "A history of states, one cell per period: the shape of an uptime page. The worse the state, the heavier its pixels.",
    imports: ["StatusStrip", "dashboardStatusSummary"],
    props: [
      title,
      {
        name: "items",
        type: `{ label, status: "ok" | "degraded" | "down" | "none", note? }[]`,
        description: "Oldest first; the note is read with its period.",
      },
      {
        name: "labels",
        type: "Partial<Record<status, string>>",
        default: "Operational, Degraded, Down, No data",
        description: "The words of the states: Passed, Retried, Failed for runs.",
      },
      {
        name: "summary",
        type: "ReactNode",
        default: "99.2% up",
        description: "Right of the title when nothing is read.",
      },
      {
        name: "from / to",
        type: "ReactNode",
        default: "first / last label",
        description: "Under each end of the strip.",
      },
      { name: "height", type: "number", default: "32", description: "Of the strip, in px." },
      markers,
      className,
    ],
  },
  {
    slug: "bullet-chart",
    name: "Bullet chart",
    summary:
      "Measures against their targets, one row each: a bar over dithered bands, the target as a tick, the share of it in words.",
    imports: ["BulletChart", "dashboardBullet"],
    props: [
      title,
      {
        name: "items",
        type: "{ label, value, target?, bands?, max?, format? }[]",
        description:
          "One row each, on its own scale. bands end poor, fair, good (up to three); max defaults to the last band.",
      },
      format,
      dataKey,
      className,
    ],
  },
  {
    slug: "waterfall",
    name: "Waterfall",
    summary:
      "How a start becomes an end, step by step: totals on zero, each change floating from the running total, its signed value above it.",
    imports: ["Waterfall", "dashboardWaterfall"],
    props: [
      title,
      { name: "start", type: "{ label, value }", description: "Where it starts: a total." },
      {
        name: "steps",
        type: "{ label, value }[]",
        description: "The changes in order; negative takes away.",
      },
      {
        name: "end",
        type: "string | false",
        default: `"End"`,
        description: "The label of the final total; false leaves it out.",
      },
      {
        name: "totals",
        type: "string[]",
        description: "Labels of steps that are subtotals: the running total, standing on zero.",
      },
      format,
      {
        name: "better",
        type: `"up" | "down"`,
        default: `"up"`,
        description: "Which way is good news; the tone follows, the pattern says the direction.",
      },
      { name: "height", type: "number", default: "200", description: "Of the plot, in px." },
      className,
    ],
  },
  {
    slug: "dumbbell",
    name: "Dumbbell",
    summary:
      "Before and after on one scale, a row each: who moved, which way and how far, with the change written.",
    imports: ["Dumbbell", "dashboardExtent"],
    props: [
      title,
      { name: "items", type: "{ label, from, to }[]", description: "One row each." },
      {
        name: "fromLabel / toLabel",
        type: "string",
        default: "Before / After",
        description: "The names of the two moments, in the key.",
      },
      format,
      {
        name: "better",
        type: `"up" | "down"`,
        default: `"up"`,
        description: "Which way is good news: down for a response time.",
      },
      {
        name: "sort",
        type: `"none" | "change" | "to"`,
        default: `"none"`,
        description: "As given, biggest change first, or highest value after first.",
      },
      {
        name: "zero",
        type: "boolean",
        default: "false",
        description: "The scale starts at zero; else it holds the values with a little room.",
      },
      className,
    ],
  },
  {
    slug: "diverging-bar",
    name: "Diverging bar",
    summary:
      "Values around a central zero, left when below and right when above: a budget gap, gains and losses, a score around neutral.",
    imports: ["DivergingBar"],
    props: [
      title,
      { name: "items", type: "{ label, value }[]", description: "One row each." },
      {
        name: "sides",
        type: "[string, string]",
        description: "What left and right mean, over the axis: Under budget, Over budget.",
      },
      format,
      {
        name: "better",
        type: `"up" | "down"`,
        default: `"up"`,
        description: "Which side is good news.",
      },
      { name: "sorted", type: "boolean", default: "false", description: "Highest first." },
      className,
    ],
  },
  {
    slug: "histogram",
    name: "Histogram",
    summary:
      "How values spread: bins of a round width, quantile rules (p50, p95), the tail past a threshold in ember.",
    imports: ["Histogram", "dashboardHistogram", "dashboardQuantile"],
    props: [
      title,
      { name: "values", type: "number[]", description: "The raw values, one per request or run." },
      {
        name: "bins",
        type: "number",
        default: "20",
        description: "About how many; the width is rounded to 1, 2 or 5 times a power of ten.",
      },
      {
        name: "min / max",
        type: "number",
        description: "The range counted; default the lowest and highest values.",
      },
      format,
      { name: "unit", type: "string", default: `"values"`, description: "What one value is." },
      {
        name: "marks",
        type: "{ p, label }[]",
        default: "p50, p95",
        description: "Quantiles drawn as labelled rules; [] for none.",
      },
      {
        name: "threshold",
        type: "number",
        description: "Bins from it up are in ember, and the share over it is written.",
      },
      { name: "height", type: "number", default: "140", description: "Of the plot, in px." },
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
];
