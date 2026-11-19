// Blocks of the "dashboard and analytics" group: charts in the pixel style (funnel, heatmap, donut,
// gauge, stacked bar), the grid of widgets and the frame around one, the comparison of two periods
// and the picker of a question. App-agnostic: nothing here knows what is measured; the app passes
// the numbers and turns a query into data. Each block lives in its own file next to this one; this
// barrel re-exports them.

export {
  DASHBOARD_AGGREGATIONS,
  DASHBOARD_COLUMNS,
  dashboardBoxText,
  dashboardBucketUnit,
  dashboardBuckets,
  dashboardCalendarCells,
  dashboardClampBox,
  dashboardCollides,
  dashboardCompareRanges,
  dashboardCompact,
  dashboardDeltaWay,
  dashboardDragBox,
  dashboardEmptyQuery,
  dashboardFormatPercent,
  dashboardFunnel,
  dashboardGaugeState,
  dashboardGaugeThresholds,
  dashboardHeatLevel,
  dashboardKeyBox,
  dashboardNextSlot,
  dashboardPatternOn,
  dashboardPercent,
  dashboardPlace,
  dashboardQueryReady,
  dashboardQueryText,
  dashboardRatio,
  dashboardRing,
  dashboardRows,
  dashboardSameLayout,
  dashboardStack,
  dashboardStackOrder,
  dashboardSync,
} from "./dashboard-model";
export type {
  DashboardAggregation,
  DashboardBucket,
  DashboardCompare,
  DashboardFunnelRow,
  DashboardGaugeState,
  DashboardInterval,
  DashboardMetrics,
  DashboardPeriod,
  DashboardPlaceOptions,
  DashboardQuery,
  DashboardQueryCatalog,
  DashboardRanges,
  DashboardRingCell,
  DashboardStackRow,
  DashboardSyncOptions,
  DashboardTone,
  DashboardWay,
  GaugeThreshold,
  GaugeTone,
  WidgetLayout,
  WidgetLimits,
} from "./dashboard-model";
export { Funnel } from "./dashboard-funnel";
export type { FunnelItem, FunnelProps } from "./dashboard-funnel";
export { Heatmap } from "./dashboard-heatmap";
export type { HeatmapCalendarProps, HeatmapMatrixProps, HeatmapProps } from "./dashboard-heatmap";
export { Donut } from "./dashboard-donut";
export type { DonutItem, DonutProps } from "./dashboard-donut";
export { Gauge } from "./dashboard-gauge";
export type { GaugeProps } from "./dashboard-gauge";
export { StackedBar } from "./dashboard-stacked-bar";
export type { StackedBarItem, StackedBarProps, StackedBarSeries } from "./dashboard-stacked-bar";
export { WidgetFrame } from "./dashboard-widget-frame";
export type { WidgetFrameProps } from "./dashboard-widget-frame";
export { WidgetGrid } from "./dashboard-widget-grid";
export type { DashboardWidget, WidgetGridProps } from "./dashboard-widget-grid";
export { DateRangeCompare, DeltaBadge } from "./dashboard-compare";
export type { DateRangeCompareProps, DeltaBadgeProps } from "./dashboard-compare";
export { MetricPicker } from "./dashboard-metric-picker";
export type { GroupingOption, MetricOption, MetricPickerProps } from "./dashboard-metric-picker";
