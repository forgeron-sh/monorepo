// The arithmetic of the charts, as data: percent and delta, the stages of a funnel, the cells of a
// heatmap, the pixels of a ring and their patterns, stacks and gauge states. No React here, so an
// app can reuse it on the server.

import { addDays, weekday } from "../dates";

/* ---------------------------------------------------------------- percent and delta */

/** How much `current` moved from `previous`, as a ratio (0.12 is +12%); `null` when there was nothing before. */
export function dashboardRatio(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

/** `part` as a share of `total`, 0 to 1; 0 when there is no total. */
export const dashboardPercent = (part: number, total: number): number =>
  total > 0 && Number.isFinite(part) ? part / total : 0;

/** A ratio as a percent: `12%`, `12.4%` with `digits`, `+12%` with `sign`. Uses a true minus. */
export function dashboardFormatPercent(
  ratio: number,
  { digits = 0, sign = false }: { digits?: number; sign?: boolean } = {},
): string {
  const factor = 10 ** digits;
  const rounded = Math.round(ratio * 100 * factor) / factor;
  const text = String(Math.abs(rounded));
  if (!sign) return `${rounded < 0 ? "−" : ""}${text}%`;
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : "±"}${text}%`;
}

export type DashboardWay = "up" | "down" | "flat";
export type DashboardTone = "good" | "bad" | "flat";

/** Which way a delta went, and whether that is good news (`better`: the way that is). */
export function dashboardDeltaWay(
  delta: number,
  better: "up" | "down" = "up",
  digits = 1,
): { way: DashboardWay; tone: DashboardTone } {
  const rounded = Math.round(delta * 100 * 10 ** digits);
  const way: DashboardWay = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  return { way, tone: way === "flat" ? "flat" : way === better ? "good" : "bad" };
}

/* ---------------------------------------------------------------- funnel */

export interface DashboardFunnelRow {
  label: string;
  value: number;
  /** Share of the first stage, 0 to 1. */
  ofFirst: number;
  /** Share of the stage before; `null` for the first. */
  ofPrevious: number | null;
  /** How many fell out since the stage before; `null` for the first. */
  lost: number | null;
}

/** The stages of a funnel with the conversion between them and from the top. */
export function dashboardFunnel(items: ReadonlyArray<{ label: string; value: number }>): {
  rows: DashboardFunnelRow[];
  /** Last stage over the first. */
  overall: number;
} {
  const first = items[0]?.value ?? 0;
  const rows = items.map((item, i) => {
    const before = i > 0 ? items[i - 1]!.value : null;
    return {
      label: item.label,
      value: item.value,
      ofFirst: dashboardPercent(item.value, first),
      ofPrevious: before === null ? null : dashboardPercent(item.value, before),
      lost: before === null ? null : Math.max(0, before - item.value),
    };
  });
  return { rows, overall: rows.length > 1 ? rows[rows.length - 1]!.ofFirst : rows.length ? 1 : 0 };
}

/* ---------------------------------------------------------------- heat */

/** The step of a value, 0 (none) to `levels`: dither patterns, never a smooth ramp. */
export function dashboardHeatLevel(value: number, max: number, levels = 4): number {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.min(levels, 1 + Math.floor((value / max) * (levels - 0.001)));
}

/**
 * The days of a period as columns of weeks, seven rows each (Monday first, or Sunday with
 * `weekStart: "sun"`); a day outside the period is `null`.
 */
export function dashboardCalendarCells(
  from: string,
  to: string,
  weekStart: "mon" | "sun" = "mon",
): Array<Array<string | null>> {
  if (from > to) return [];
  const offset = (iso: string) => (weekStart === "mon" ? weekday(iso) : (weekday(iso) + 1) % 7);
  const weeks: Array<Array<string | null>> = [];
  let monday = addDays(from, -offset(from));
  while (monday <= to && weeks.length < 400) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const day = addDays(monday, i);
        return day >= from && day <= to ? day : null;
      }),
    );
    monday = addDays(monday, 7);
  }
  return weeks;
}

/* ---------------------------------------------------------------- pixels */

/**
 * Whether pixel (`x`, `y`) of fill pattern `k` is on. Six patterns tell the series of a chart apart
 * without colour: solid, checker, scan lines, dots, columns, dense.
 */
export function dashboardPatternOn(k: number, x: number, y: number): boolean {
  switch (((k % 6) + 6) % 6) {
    case 0:
      return true;
    case 1:
      return (x + y) % 2 === 1;
    case 2:
      return y % 2 === 0;
    case 3:
      return x % 2 === 1 && y % 2 === 0;
    case 4:
      return x % 2 === 0;
    default:
      return !(x % 2 === 1 && y % 2 === 0);
  }
}

/** One pixel of a ring and how far along it is, 0 to 1. */
export interface DashboardRingCell {
  x: number;
  y: number;
  t: number;
}

/**
 * The pixels of a ring `size` pixels across and `thickness` thick. `full`: a whole circle, `t`
 * runs clockwise from the top. `half`: the upper half (the grid is `size` wide and `size / 2 + 1`
 * tall), `t` runs from the left end to the right one.
 */
export function dashboardRing(
  size: number,
  thickness: number,
  sweep: "full" | "half" = "full",
): DashboardRingCell[] {
  const r = size / 2;
  const inner = Math.max(0, r - thickness);
  const rows = sweep === "full" ? size : Math.floor(r) + 1;
  const cells: DashboardRingCell[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - r;
      const dy = y + 0.5 - r;
      const d = Math.hypot(dx, dy);
      if (d > r || d < inner) continue;
      if (sweep === "half") {
        if (dy > 0) continue;
        cells.push({ x, y, t: (Math.PI - Math.atan2(-dy, dx)) / Math.PI });
      } else {
        const turn = Math.atan2(dx, -dy) / (2 * Math.PI);
        cells.push({ x, y, t: turn < 0 ? turn + 1 : turn });
      }
    }
  }
  return cells;
}

/* ---------------------------------------------------------------- stacks and gauges */

export interface DashboardStackRow {
  label: string;
  /** What the shown series add up to. */
  total: number;
  segments: Array<{ key: string; value: number; share: number }>;
}

/**
 * The rows of a stacked bar. `share` is the part of the longest row (or of its own row with
 * `normalize`) the segment takes, 0 to 1. Series in `hidden` are left out.
 */
export function dashboardStack(
  items: ReadonlyArray<{ label: string; values: Readonly<Record<string, number>> }>,
  series: ReadonlyArray<{ key: string }>,
  { hidden = [], normalize = false }: { hidden?: ReadonlyArray<string>; normalize?: boolean } = {},
): DashboardStackRow[] {
  const shown = series.filter((s) => !hidden.includes(s.key));
  const totals = items.map((item) =>
    shown.reduce((sum, s) => sum + Math.max(0, item.values[s.key] ?? 0), 0),
  );
  const longest = Math.max(0, ...totals);
  return items.map((item, i) => ({
    label: item.label,
    total: totals[i]!,
    segments: shown.map((s) => {
      const value = Math.max(0, item.values[s.key] ?? 0);
      return {
        key: s.key,
        value,
        share: dashboardPercent(value, normalize ? totals[i]! : longest),
      };
    }),
  }));
}

export type GaugeTone = "bad" | "warn" | "good";

/** A state of a gauge from `at` (a value) upwards: `{ at: 0, label: "Behind", tone: "bad" }`. */
export interface GaugeThreshold {
  at: number;
  label: string;
  tone: GaugeTone;
}

/** Under 70% of the target, under the target, the target met. */
export const dashboardGaugeThresholds = (target: number): GaugeThreshold[] => [
  { at: Number.NEGATIVE_INFINITY, label: "Behind", tone: "bad" },
  { at: target * 0.7, label: "Close", tone: "warn" },
  { at: target, label: "On target", tone: "good" },
];

export interface DashboardGaugeState {
  /** The value over the target (1 is met); 0 without a target. */
  ofTarget: number;
  /** Where the value sits on the scale, 0 to 1. */
  fraction: number;
  /** Where the target sits on the scale, 0 to 1. */
  targetAt: number;
  label: string;
  tone: GaugeTone;
}

/** Where a value stands against its target and thresholds. `max` defaults to a quarter above the larger of the two. */
export function dashboardGaugeState(
  value: number,
  {
    target,
    min = 0,
    max,
    thresholds,
  }: { target: number; min?: number; max?: number; thresholds?: ReadonlyArray<GaugeThreshold> },
): DashboardGaugeState {
  const top = max ?? Math.max(target, value) * 1.25;
  const span = top - min || 1;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const steps = [...(thresholds ?? dashboardGaugeThresholds(target))].sort((a, b) => a.at - b.at);
  const state = [...steps].reverse().find((s) => value >= s.at) ?? steps[0];
  return {
    ofTarget: target ? value / target : 0,
    fraction: clamp((value - min) / span),
    targetAt: clamp((target - min) / span),
    label: state?.label ?? "",
    tone: state?.tone ?? "good",
  };
}

/* ---------------------------------------------------------------- waffle */

/**
 * How many of `cells` squares each value takes, by largest remainder: the counts add up to
 * `cells` exactly (0 when nothing is positive), and a value above zero never rounds to nothing
 * unless there are more values than squares.
 */
export function dashboardWaffle(values: ReadonlyArray<number>, cells = 100): number[] {
  const clean = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = clean.reduce((sum, v) => sum + v, 0);
  if (!(total > 0) || cells <= 0) return clean.map(() => 0);
  const exact = clean.map((v) => (v / total) * cells);
  const counts = exact.map(Math.floor);
  // A small but present value keeps one square, taken from the largest count.
  clean.forEach((v, i) => {
    if (v > 0 && counts[i] === 0 && clean.filter((x) => x > 0).length <= cells) {
      counts[i] = 1;
      exact[i] = 1;
    }
  });
  let left = cells - counts.reduce((sum, n) => sum + n, 0);
  const order = exact
    .map((e, i) => ({ i, rest: e - Math.floor(e) }))
    .sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (let j = 0; left > 0 && order.length; j = (j + 1) % order.length) {
    const at = order[j]!.i;
    if (clean[at]! > 0) {
      counts[at]! += 1;
      left -= 1;
    }
  }
  while (left < 0) {
    const biggest = counts.indexOf(Math.max(...counts));
    counts[biggest]! -= 1;
    left += 1;
  }
  return counts;
}

/* ---------------------------------------------------------------- status strip */

export type DashboardStatus = "ok" | "degraded" | "down" | "none";

export interface DashboardStatusSummary {
  ok: number;
  degraded: number;
  down: number;
  none: number;
  /** Periods that were not down over the periods with a status, 0 to 1; 1 when none has one. */
  up: number;
}

/** How many periods were in each state, and the share that was up (ok or degraded). */
export function dashboardStatusSummary(
  items: ReadonlyArray<{ status: DashboardStatus }>,
): DashboardStatusSummary {
  const counts = { ok: 0, degraded: 0, down: 0, none: 0 };
  for (const item of items) counts[item.status] += 1;
  const known = counts.ok + counts.degraded + counts.down;
  return { ...counts, up: known ? (counts.ok + counts.degraded) / known : 1 };
}

/* ---------------------------------------------------------------- bullet */

export interface DashboardBulletState {
  /** The end of the scale. */
  max: number;
  /** Where the value ends, 0 to 1. */
  value: number;
  /** Where the target sits, 0 to 1; `null` without one. */
  target: number | null;
  /** Where each band ends, 0 to 1, ascending. */
  bands: number[];
  /** The value over the target (1 is met); `null` without a target. */
  ofTarget: number | null;
}

/**
 * Where a value, its target and its bands sit on one scale. The scale ends at `max`, else at the
 * last band, else a fifth above the larger of value and target.
 */
export function dashboardBullet(
  value: number,
  { target, bands = [], max }: { target?: number; bands?: ReadonlyArray<number>; max?: number },
): DashboardBulletState {
  const sorted = [...bands].filter((b) => Number.isFinite(b) && b > 0).sort((a, b) => a - b);
  const top =
    max && max > 0
      ? max
      : (sorted[sorted.length - 1] ?? 0) >= Math.max(value, target ?? 0)
        ? sorted[sorted.length - 1]!
        : Math.max(value, target ?? 0, 0) * 1.2 || 1;
  const at = (n: number) => Math.min(1, Math.max(0, n / top));
  return {
    max: top,
    value: at(value),
    target: target === undefined ? null : at(target),
    bands: sorted.map(at),
    ofTarget: target ? value / target : null,
  };
}

/* ---------------------------------------------------------------- waterfall */

export interface DashboardWaterfallBar {
  label: string;
  /** A total stands on zero; a step floats from the running total before it. */
  kind: "total" | "up" | "down";
  /** The total, or the step's change (negative when down). */
  value: number;
  /** Where the bar starts and ends on the scale. */
  from: number;
  to: number;
}

/**
 * The bars of a waterfall: the start as a total, each step floating from the running total, and
 * the end as a total (`end: false` leaves it out). `min` and `max` hold zero and every bar end.
 */
export function dashboardWaterfall(
  start: { label: string; value: number },
  steps: ReadonlyArray<{ label: string; value: number }>,
  { end = "End", totals = [] }: { end?: string | false; totals?: ReadonlyArray<string> } = {},
): { bars: DashboardWaterfallBar[]; min: number; max: number; total: number } {
  const bars: DashboardWaterfallBar[] = [
    { label: start.label, kind: "total", value: start.value, from: 0, to: start.value },
  ];
  let running = start.value;
  for (const step of steps) {
    if (totals.includes(step.label)) {
      // A subtotal: the running total so far, standing on zero; its own value is ignored.
      bars.push({ label: step.label, kind: "total", value: running, from: 0, to: running });
      continue;
    }
    const v = Number.isFinite(step.value) ? step.value : 0;
    bars.push({
      label: step.label,
      kind: v < 0 ? "down" : "up",
      value: v,
      from: running,
      to: Number((running + v).toPrecision(12)),
    });
    running = Number((running + v).toPrecision(12));
  }
  if (end !== false) bars.push({ label: end, kind: "total", value: running, from: 0, to: running });
  const ends = bars.flatMap((b) => [b.from, b.to]);
  return { bars, min: Math.min(0, ...ends), max: Math.max(0, ...ends), total: running };
}

/* ---------------------------------------------------------------- distribution */

/** The round step nearest `raw`: 1, 2 or 5 times a power of ten. */
export function dashboardNiceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  // The nearest of 1, 2, 5 and 10 on a log scale (the cut-offs are their geometric means).
  return (unit < Math.SQRT2 ? 1 : unit < Math.sqrt(10) ? 2 : unit < Math.sqrt(50) ? 5 : 10) * power;
}

/** The value under which a share `p` (0 to 1) of `values` falls, interpolated; `NaN` when empty. */
export function dashboardQuantile(values: ReadonlyArray<number>, p: number): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return Number.NaN;
  const at = Math.min(1, Math.max(0, p)) * (sorted.length - 1);
  const lo = Math.floor(at);
  const hi = Math.ceil(at);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (at - lo);
}

export interface DashboardBin {
  /** Included. */
  from: number;
  /** Excluded, except for the last bin. */
  to: number;
  count: number;
}

/**
 * Counts of `values` in bins of a round width, about `bins` of them, from `min` (default: the
 * lowest value, rounded down) to `max` (default: the highest).
 */
export function dashboardHistogram(
  values: ReadonlyArray<number>,
  { bins = 20, min, max }: { bins?: number; min?: number; max?: number } = {},
): DashboardBin[] {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return [];
  const lo = min ?? Math.min(...clean);
  const hi = max ?? Math.max(...clean);
  const step = dashboardNiceStep((hi - lo || 1) / Math.max(1, bins));
  const first = Math.floor(lo / step) * step;
  const count = Math.max(1, Math.ceil((hi - first) / step + (hi === first ? 1 : 0)));
  const out = Array.from({ length: count }, (_, i) => ({
    from: first + i * step,
    to: first + (i + 1) * step,
    count: 0,
  }));
  for (const v of clean) {
    if (v < first || v > hi) continue;
    const i = Math.min(count - 1, Math.floor((v - first) / step));
    out[i]!.count += 1;
  }
  return out;
}

/* ---------------------------------------------------------------- shared scale */

/**
 * The ends of a scale that holds `values`, with a little room on each side (`pad`, a share of the
 * span); from zero with `zero`, and always holding it when values cross it.
 */
export function dashboardExtent(
  values: ReadonlyArray<number>,
  { zero = false, pad = 0.06 }: { zero?: boolean; pad?: number } = {},
): [number, number] {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return [0, 1];
  let lo = Math.min(...clean, ...(zero ? [0] : []));
  let hi = Math.max(...clean, ...(zero ? [0] : []));
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const room = (hi - lo) * pad;
  return [lo === 0 && zero ? 0 : lo - room, hi + room];
}

/**
 * Where a waterfall's scale should start. Zero, unless every level is above it and the changes are
 * small next to the totals (they move less than 40% of the top): then a round value under the
 * lowest level, so the changes can be seen. The totals are then cut, and the chart says so.
 */
export function dashboardWaterfallFloor(
  bars: ReadonlyArray<DashboardWaterfallBar>,
  max: number,
): number {
  const levels = bars.flatMap((b) => (b.kind === "total" ? [b.to] : [b.from, b.to]));
  const low = Math.min(...levels);
  if (!(low > 0) || !(max > 0)) return Math.min(0, low);
  const moves = max - low;
  if (moves / max > 0.4) return 0;
  const step = dashboardNiceStep(Math.max(moves, max * 0.01) / 4);
  return Math.max(0, Math.floor((low - Math.max(moves, max * 0.01) * 0.6) / step) * step);
}

/**
 * A change written with its sign, the minus a true minus: `+1,200`, `−300`. `zero` is how no change
 * is written (default the formatted 0).
 */
export function dashboardSigned(
  format: (value: number) => string,
  value: number,
  zero?: string,
): string {
  return value > 0 ? `+${format(value)}` : value < 0 ? `−${format(-value)}` : (zero ?? format(0));
}
