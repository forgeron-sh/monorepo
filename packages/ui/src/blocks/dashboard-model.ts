// The arithmetic of dashboards, as data: a grid of widgets (placing, colliding, pushing down), the
// buckets of a series over time, the range a period is compared with, and the description of a query. No React here, so an
// app can reuse it on the server.

import { addDays, addMonths, MONTHS, parseIso, toIso, weekday } from "../dates";
import type { DateRange } from "../time";
import { operatorText, type Filter, type FilterField } from "./filtering-model";

/* ---------------------------------------------------------------- the grid */

/** The columns of a dashboard grid. */
export const DASHBOARD_COLUMNS = 12;

/** Where a widget sits, in cells: column `x`, row `y`, `w` columns wide, `h` rows tall. */
export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The sizes a widget accepts, in cells. */
export interface WidgetLimits {
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardPlaceOptions {
  /** Default {@link DASHBOARD_COLUMNS}. */
  columns?: number;
  limits?: WidgetLimits;
  /** Pull every widget up into the free space above it. Default `true`. */
  compact?: boolean;
}

type Box = Pick<WidgetLayout, "x" | "y" | "w" | "h">;

const byRow = (a: WidgetLayout, b: WidgetLayout) => a.y - b.y || a.x - b.x;

/** Whether two different widgets share a cell. */
export function dashboardCollides(a: WidgetLayout, b: WidgetLayout): boolean {
  return a.id !== b.id && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** A box inside the grid and inside the limits of its widget; whole cells. */
export function dashboardClampBox(
  box: Box,
  columns = DASHBOARD_COLUMNS,
  limits: WidgetLimits = {},
): Box {
  const minW = Math.max(1, limits.minW ?? 1);
  const maxW = Math.max(minW, Math.min(columns, limits.maxW ?? columns));
  const minH = Math.max(1, limits.minH ?? 1);
  const maxH = Math.max(minH, limits.maxH ?? Number.POSITIVE_INFINITY);
  const w = Math.min(maxW, Math.max(minW, Math.round(box.w) || minW));
  const h = Math.min(maxH, Math.max(minH, Math.round(box.h) || minH));
  const x = Math.min(columns - w, Math.max(0, Math.round(box.x) || 0));
  const y = Math.max(0, Math.round(box.y) || 0);
  return { x, y, w, h };
}

/** How many rows the layout takes. */
export const dashboardRows = (layout: ReadonlyArray<WidgetLayout>): number =>
  layout.reduce((rows, item) => Math.max(rows, item.y + item.h), 0);

/**
 * Pulls every widget up while the cell above is free, keeping the widgets of `fixed` where they are
 * (the one being dragged). Reading order is kept: a widget never jumps over another.
 */
export function dashboardCompact(
  layout: ReadonlyArray<WidgetLayout>,
  fixed: ReadonlyArray<string> = [],
): WidgetLayout[] {
  const pinned = new Set(fixed);
  const settled: WidgetLayout[] = layout.filter((i) => pinned.has(i.id)).map((i) => ({ ...i }));
  const out = new Map<string, WidgetLayout>(settled.map((i) => [i.id, i]));
  for (const item of layout.filter((i) => !pinned.has(i.id)).sort(byRow)) {
    let y = item.y;
    // Pushed down first: out of the widgets already settled.
    for (let hit = settled.find((s) => dashboardCollides({ ...item, y }, s)); hit;) {
      y = hit.y + hit.h;
      hit = settled.find((s) => dashboardCollides({ ...item, y }, s));
    }
    // Then up, one row at a time, while it is free.
    while (y > 0 && !settled.some((s) => dashboardCollides({ ...item, y: y - 1 }, s))) y -= 1;
    const next = { ...item, y };
    settled.push(next);
    out.set(item.id, next);
  }
  return layout.map((i) => out.get(i.id) ?? i);
}

/**
 * Puts widget `id` in `box` (clamped to the grid and its limits). Every widget the box lands on is
 * pushed down below it, then the others fall back up into the free space. The widget itself stays
 * where it was dropped unless the space above it is free.
 */
export function dashboardPlace(
  layout: ReadonlyArray<WidgetLayout>,
  id: string,
  box: Box,
  { columns = DASHBOARD_COLUMNS, limits, compact = true }: DashboardPlaceOptions = {},
): WidgetLayout[] {
  const current = layout.find((i) => i.id === id);
  if (!current) return layout.map((i) => ({ ...i }));
  const moved: WidgetLayout = { id, ...dashboardClampBox(box, columns, limits) };
  const withMoved = layout.map((i) => (i.id === id ? moved : { ...i }));
  // Push down: in reading order, each widget leaves the ones already placed.
  const placed: WidgetLayout[] = [moved];
  const result = new Map<string, WidgetLayout>([[id, moved]]);
  for (const item of withMoved.filter((i) => i.id !== id).sort(byRow)) {
    let y = item.y;
    for (let hit = placed.find((s) => dashboardCollides({ ...item, y }, s)); hit;) {
      y = hit.y + hit.h;
      hit = placed.find((s) => dashboardCollides({ ...item, y }, s));
    }
    const next = { ...item, y };
    placed.push(next);
    result.set(item.id, next);
  }
  const pushed = withMoved.map((i) => result.get(i.id) ?? i);
  if (!compact) return pushed;
  const around = dashboardCompact(pushed, [id]);
  // The widget falls too, once the others have settled.
  const rest = around.filter((i) => i.id !== id);
  let y = moved.y;
  while (y > 0 && !rest.some((s) => dashboardCollides({ ...moved, y: y - 1 }, s))) y -= 1;
  // And the others close any gap it left.
  return dashboardCompact(around.map((i) => (i.id === id ? { ...i, y } : i)));
}

/** The first free place for a widget `w` × `h`, reading rows left to right. */
export function dashboardNextSlot(
  layout: ReadonlyArray<WidgetLayout>,
  w: number,
  h: number,
  columns = DASHBOARD_COLUMNS,
): Box {
  const width = Math.max(1, Math.min(columns, w));
  const probe: WidgetLayout = { id: "", x: 0, y: 0, w: width, h: Math.max(1, h) };
  const last = dashboardRows(layout);
  for (let y = 0; y <= last; y += 1) {
    for (let x = 0; x + width <= columns; x += 1) {
      const at = { ...probe, x, y };
      if (!layout.some((i) => dashboardCollides(at, i))) return { x, y, w: at.w, h: at.h };
    }
  }
  return { x: 0, y: last, w: probe.w, h: probe.h };
}

export interface DashboardSyncOptions {
  columns?: number;
  /** The size of a widget that has no place yet. Default 4 × 2. */
  size?: { w: number; h: number };
  limits?: Readonly<Record<string, WidgetLimits | undefined>>;
}

/**
 * A layout that fits the widgets: the places of widgets that are gone are dropped, the new ones
 * take the first free slot, every box is clamped and nothing overlaps.
 */
export function dashboardSync(
  layout: ReadonlyArray<WidgetLayout>,
  ids: ReadonlyArray<string>,
  { columns = DASHBOARD_COLUMNS, size = { w: 4, h: 2 }, limits = {} }: DashboardSyncOptions = {},
): WidgetLayout[] {
  const known = new Set(ids);
  const kept: WidgetLayout[] = [];
  for (const item of layout) {
    if (!known.has(item.id) || kept.some((k) => k.id === item.id)) continue;
    kept.push({ id: item.id, ...dashboardClampBox(item, columns, limits[item.id]) });
  }
  const fresh = ids.filter((id) => !kept.some((k) => k.id === id));
  // Resolve overlaps among the kept ones: reading order, pushed down.
  const placed: WidgetLayout[] = [];
  for (const item of [...kept].sort(byRow)) {
    let y = item.y;
    for (let hit = placed.find((s) => dashboardCollides({ ...item, y }, s)); hit;) {
      y = hit.y + hit.h;
      hit = placed.find((s) => dashboardCollides({ ...item, y }, s));
    }
    placed.push({ ...item, y });
  }
  for (const id of fresh) {
    const box = dashboardClampBox(
      dashboardNextSlot(placed, size.w, size.h, columns),
      columns,
      limits[id],
    );
    placed.push({ id, ...box });
  }
  const byId = new Map(placed.map((i) => [i.id, i]));
  return dashboardCompact(ids.map((id) => byId.get(id)!).filter(Boolean));
}

/** The ids in reading order: how the grid reads on a narrow screen, one column. */
export const dashboardStackOrder = (layout: ReadonlyArray<WidgetLayout>): string[] =>
  [...layout].sort(byRow).map((i) => i.id);

/** Whether two layouts put every widget in the same place. */
export function dashboardSameLayout(
  a: ReadonlyArray<WidgetLayout>,
  b: ReadonlyArray<WidgetLayout>,
): boolean {
  if (a.length !== b.length) return false;
  const by = new Map(b.map((i) => [i.id, i]));
  return a.every((i) => {
    const o = by.get(i.id);
    return !!o && o.x === i.x && o.y === i.y && o.w === i.w && o.h === i.h;
  });
}

/** What an arrow does to a widget: moves it one cell, or with Shift makes it one cell larger or smaller. */
export function dashboardKeyBox(box: Box, key: string, shift: boolean): Box | null {
  const dx = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;
  const dy = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
  if (!dx && !dy) return null;
  return shift
    ? { x: box.x, y: box.y, w: box.w + dx, h: box.h + dy }
    : { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h };
}

export interface DashboardMetrics {
  /** Width of one column and height of one row, in px. */
  colW: number;
  rowH: number;
  /** Space between cells, in px. */
  gap: number;
}

/** The box a drag of `dx`, `dy` px leads to: moved, or resized from the bottom right corner. */
export function dashboardDragBox(
  start: Box,
  dx: number,
  dy: number,
  { colW, rowH, gap }: DashboardMetrics,
  mode: "move" | "resize",
): Box {
  const cols = Math.round(dx / Math.max(1, colW + gap));
  const rows = Math.round(dy / Math.max(1, rowH + gap));
  return mode === "move"
    ? { x: start.x + cols, y: start.y + rows, w: start.w, h: start.h }
    : { x: start.x, y: start.y, w: start.w + cols, h: start.h + rows };
}

/** A widget's place said in words, for the live region: `column 3, row 1, 4 wide, 2 tall`. */
export const dashboardBoxText = (box: Box): string =>
  `column ${box.x + 1}, row ${box.y + 1}, ${box.w} wide, ${box.h} tall`;

/* ---------------------------------------------------------------- over time */

export type DashboardInterval = "day" | "week" | "month";

/** One slice of time and what fell in it. */
export interface DashboardBucket {
  /** `YYYY-MM-DD`, the first day of the slice that is inside the period. */
  start: string;
  end: string;
  /** `Nov 12`, `Nov` for a month. */
  label: string;
  value: number;
  /** How many points fell in it. */
  count: number;
}

const daysBetween = (from: string, to: string) =>
  Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000);

/** The slice that suits a period: days up to a month, weeks up to six, months beyond. */
export function dashboardBucketUnit(from: string, to: string): DashboardInterval {
  const days = daysBetween(from, to) + 1;
  return days <= 31 ? "day" : days <= 183 ? "week" : "month";
}

const nextBoundary = (iso: string, unit: DashboardInterval): string => {
  if (unit === "day") return addDays(iso, 1);
  if (unit === "week") return addDays(iso, 7 - weekday(iso));
  const d = parseIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 1));
};

/**
 * Sums `points` (`date` is `YYYY-MM-DD`) into slices of `unit` between `from` and `to` inclusive.
 * Empty slices stay, with a value of 0, so a series has no hole. Points outside are left out.
 */
export function dashboardBuckets(
  points: ReadonlyArray<{ date: string; value: number }>,
  from: string,
  to: string,
  unit: DashboardInterval = dashboardBucketUnit(from, to),
): DashboardBucket[] {
  if (from > to) return [];
  const buckets: DashboardBucket[] = [];
  let start = from;
  while (start <= to && buckets.length < 2000) {
    const next = nextBoundary(start, unit);
    const end = addDays(next, -1) > to ? to : addDays(next, -1);
    const date = parseIso(start);
    buckets.push({
      start,
      end,
      label:
        unit === "month"
          ? MONTHS[date.getMonth()]!.slice(0, 3)
          : `${MONTHS[date.getMonth()]!.slice(0, 3)} ${date.getDate()}`,
      value: 0,
      count: 0,
    });
    start = next;
  }
  for (const p of points) {
    const bucket = buckets.find((b) => p.date >= b.start && p.date <= b.end);
    if (bucket) {
      bucket.value += p.value;
      bucket.count += 1;
    }
  }
  return buckets;
}

/* ---------------------------------------------------------------- comparing periods */

export type DashboardCompare = "none" | "previous-period" | "previous-year" | "custom";

/** What a dashboard period and its comparison are. */
export interface DashboardPeriod {
  range: DateRange;
  compare: DashboardCompare;
  /** The range compared with, for `compare: "custom"`. */
  custom?: DateRange;
}

export interface DashboardRanges {
  current: DateRange | null;
  previous: DateRange | null;
  /** Days in the current range. */
  days: number;
}

const complete = (r: DateRange | undefined): r is { from: string; to: string } =>
  !!r && r.from !== null && r.to !== null;

/**
 * The two ranges of a comparison. `previous-period`: as many days, ending the day before the range
 * starts. `previous-year`: the same dates a year earlier (Feb 29 reads Feb 28). `custom`: the one
 * chosen. `previous` is `null` for `none`, an unfinished range or a custom range not yet chosen.
 */
export function dashboardCompareRanges(period: DashboardPeriod): DashboardRanges {
  if (!complete(period.range)) return { current: null, previous: null, days: 0 };
  const { from, to } = period.range;
  const days = daysBetween(from, to) + 1;
  const current = { from, to };
  let previous: DateRange | null = null;
  if (period.compare === "previous-period") {
    previous = { from: addDays(from, -days), to: addDays(from, -1) };
  } else if (period.compare === "previous-year") {
    previous = { from: addMonths(from, -12), to: addMonths(to, -12) };
  } else if (period.compare === "custom" && complete(period.custom)) {
    previous = { from: period.custom.from, to: period.custom.to };
  }
  return { current, previous, days };
}

/* ---------------------------------------------------------------- query */

export type DashboardAggregation = "count" | "sum" | "avg" | "min" | "max" | "distinct";

/** The question a dashboard asks, as data: nothing here fetches anything. */
export interface DashboardQuery {
  /** A measure id (`revenue`), or `null` before one is chosen. */
  measure: string | null;
  aggregation: DashboardAggregation;
  /** A grouping id (`stage`, `created`), or `null` for one figure. */
  groupBy: string | null;
  /** The slice of time, when `groupBy` is a time grouping. */
  interval: DashboardInterval;
  filters: Filter[];
}

export const dashboardEmptyQuery: DashboardQuery = {
  measure: null,
  aggregation: "count",
  groupBy: null,
  interval: "month",
  filters: [],
};

export const DASHBOARD_AGGREGATIONS: ReadonlyArray<{ value: DashboardAggregation; label: string }> =
  [
    { value: "count", label: "Count" },
    { value: "sum", label: "Sum" },
    { value: "avg", label: "Average" },
    { value: "min", label: "Minimum" },
    { value: "max", label: "Maximum" },
    { value: "distinct", label: "Distinct count" },
  ];

export interface DashboardQueryCatalog {
  measures: ReadonlyArray<{ id: string; label: string }>;
  groupings: ReadonlyArray<{ id: string; label: string; kind?: "time" | "category" }>;
  fields?: ReadonlyArray<FilterField>;
}

/** A query is ready to run once it has a measure. */
export const dashboardQueryReady = (query: DashboardQuery): boolean => query.measure !== null;

/** The query in a sentence: `Sum of Revenue, by Created per month, where Stage is Won`. */
export function dashboardQueryText(query: DashboardQuery, catalog: DashboardQueryCatalog): string {
  const measure = catalog.measures.find((m) => m.id === query.measure);
  if (!measure) return "Pick a measure";
  const agg = DASHBOARD_AGGREGATIONS.find((a) => a.value === query.aggregation)?.label ?? "";
  const parts = [`${agg} of ${measure.label}`];
  const group = catalog.groupings.find((g) => g.id === query.groupBy);
  if (group)
    parts.push(`by ${group.label}${group.kind === "time" ? ` per ${query.interval}` : ""}`);
  for (const f of query.filters) {
    if (f.values.length === 0) continue;
    const field = catalog.fields?.find((x) => x.id === f.field);
    const names = f.values.map((v) => field?.options.find((o) => o.value === v)?.label ?? v);
    parts.push(
      `where ${field?.label ?? f.field} ${operatorText(f.operator, f.values.length)} ${names.join(", ")}`,
    );
  }
  return parts.join(", ");
}
