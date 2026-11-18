// Blocks of the "data and shell" group: tables, figures, charts, settings, the frame of an app.
// Each block lives in its own file next to this one; this barrel re-exports them.

export { AuditLog } from "./data-audit-log";
export type { AuditEvent, AuditLogProps } from "./data-audit-log";
export { KpiRow } from "./data-kpi-row";
export type { Kpi, KpiRowProps } from "./data-kpi-row";
export { LineChart, Sparkline } from "./data-line-chart";
export type { ChartPoint, LineChartProps, SparklineProps } from "./data-line-chart";
