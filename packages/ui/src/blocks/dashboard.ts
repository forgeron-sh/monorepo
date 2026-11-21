// Blocks of the "dashboard and analytics" group: the grid of widgets and the frame around one, the
// comparison of two periods and the picker of a question (the charts themselves live in
// charts/). App-agnostic: nothing here knows what is measured; the app passes the numbers and turns
// a query into data. Each block lives in its own file next to this one; this barrel re-exports them.

export {
  DASHBOARD_AGGREGATIONS,
  DASHBOARD_COLUMNS,
  dashboardBoxText,
  dashboardBucketUnit,
  dashboardBuckets,
  dashboardClampBox,
  dashboardCollides,
  dashboardCompareRanges,
  dashboardCompact,
  dashboardDragBox,
  dashboardEmptyQuery,
  dashboardKeyBox,
  dashboardNextSlot,
  dashboardPlace,
  dashboardQueryReady,
  dashboardQueryText,
  dashboardRows,
  dashboardSameLayout,
  dashboardStackOrder,
  dashboardSync,
} from "./dashboard-model";
export type {
  DashboardAggregation,
  DashboardBucket,
  DashboardCompare,
  DashboardInterval,
  DashboardMetrics,
  DashboardPeriod,
  DashboardPlaceOptions,
  DashboardQuery,
  DashboardQueryCatalog,
  DashboardRanges,
  DashboardSyncOptions,
  WidgetLayout,
  WidgetLimits,
} from "./dashboard-model";
export {
  useWidgetFrame,
  WidgetFrame,
  WidgetFrameBody,
  WidgetFrameContent,
  WidgetFrameExpand,
  WidgetFrameFooter,
  WidgetFrameGrip,
  WidgetFrameHeader,
  WidgetFrameMenu,
  WidgetFrameSubtitle,
  WidgetFrameTitle,
  WidgetFrameTitles,
  WidgetFrameTools,
} from "./dashboard-widget-frame";
export type { WidgetFrameProps } from "./dashboard-widget-frame";
export {
  useWidgetGrid,
  WidgetGrid,
  WidgetGridCanvas,
  WidgetGridContent,
  WidgetGridEditBar,
  WidgetGridGrab,
  WidgetGridItem,
  WidgetGridRemove,
  WidgetGridResize,
  WidgetGridStatus,
} from "./dashboard-widget-grid";
export type {
  DashboardWidget,
  WidgetGridCanvasProps,
  WidgetGridItemProps,
  WidgetGridProps,
} from "./dashboard-widget-grid";
export {
  DateRangeCompare,
  DateRangeCompareCustom,
  DateRangeComparePeriod,
  DateRangeCompareSelect,
  DateRangeCompareSummary,
  DateRangeCompareVs,
  useDateRangeCompare,
} from "./dashboard-compare";
export type { DateRangeCompareProps } from "./dashboard-compare";
export {
  MetricPicker,
  MetricPickerFilter,
  MetricPickerGrouping,
  MetricPickerMeasure,
  MetricPickerStep,
  MetricPickerSteps,
  MetricPickerSummary,
  useMetricPicker,
} from "./dashboard-metric-picker";
export type {
  GroupingOption,
  MetricOption,
  MetricPickerProps,
  MetricPickerStepProps,
} from "./dashboard-metric-picker";
