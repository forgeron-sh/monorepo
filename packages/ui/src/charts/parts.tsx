// Parts the dashboard charts share: the pixel patterns that tell series apart without colour, the
// legend, the swatch, the path of a ring drawn in whole pixels; and what every chart does inside a
// `ChartContainer` (its series' colour and name from the config, the reader that reports a point
// to the tooltip), the table read aloud and the axis under a plot.

import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { chartColor, useChartApi, type ChartHover, type ChartPayloadItem } from "./chart";
import { dashboardPatternOn, type DashboardRingCell } from "./model";

/** The class of series `k`: its colour and its fill pattern (six, then they start again). */
export const dashSeries = (k: number) => `fg-dash-s${((k % 6) + 6) % 6}`;

/** The class that fills an SVG path with the colour of series `k`. */
export const dashFill = (k: number) => `fg-dash-f${((k % 6) + 6) % 6}`;

/** The series that are not in ember: the grey patterns a highlight leaves to the others. */
const GREYS = [1, 2, 4, 5];

/**
 * The colour index of each item: the first is the lead (ember) by default; with `highlight`, that
 * one takes the lead and the others share the grey patterns, so it is the only one in ember.
 */
export function dashSeriesIndexes(labels: ReadonlyArray<string>, highlight?: string): number[] {
  if (highlight === undefined || !labels.includes(highlight)) return labels.map((_, i) => i);
  let next = 0;
  return labels.map((label) => (label === highlight ? 0 : GREYS[next++ % GREYS.length]!));
}

const rect = (x: number, y: number, w: number) => `M${x} ${y}h${w}v1h-${w}z`;

/** The pixels of a ring that are on for pattern `k`, as one path: runs of a row become one rectangle. */
export function dashRingPath(cells: ReadonlyArray<DashboardRingCell>, k: number): string {
  const on = cells
    .filter((c) => dashboardPatternOn(k, c.x, c.y))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  let d = "";
  for (let i = 0; i < on.length;) {
    const first = on[i]!;
    let run = 1;
    while (on[i + run] && on[i + run]!.y === first.y && on[i + run]!.x === first.x + run) run += 1;
    d += rect(first.x, first.y, run);
    i += run;
  }
  return d;
}

/** The little square of a legend: the pattern and colour of a series, never colour alone. */
function DashSwatch({ k, color, className }: { k: number; color?: string; className?: string }) {
  return (
    <span
      className={cx("fg-dash-swatch", dashSeries(k), className)}
      style={color ? ({ "--c": color } as CSSProperties) : undefined}
      aria-hidden="true"
    />
  );
}

const SERIES_COLORS = [
  "var(--accent)",
  "var(--ink)",
  "var(--ink-muted)",
  "var(--accent)",
  "var(--ink)",
  "var(--ink-dim)",
];

/** The colour of series `k` as a tooltip's mark shows it: the container's, else the default of its class. */
export function dashColor(k: number, key?: string): string {
  const n = ((k % 6) + 6) % 6;
  const own = `var(--fg-series-${n}, ${SERIES_COLORS[n]})`;
  return key ? chartColor(key, own) : own;
}

export interface DashLegendEntry {
  key: string;
  label: ReactNode;
  k: number;
  /** The value written after the label. */
  value?: ReactNode;
  /** The share written after the value. */
  share?: ReactNode;
  /** A colour over the series' own (the container's, by key); the pattern stays. */
  color?: string;
}

/** The key of a chart: swatch, name and numbers. Toggles when `onToggle` is given. */
export function DashLegend({
  entries,
  label,
  onToggle,
  onHover,
  off = [],
  pressedMeans = "shown",
  className,
}: {
  entries: ReadonlyArray<DashLegendEntry>;
  label: string;
  /** Makes each entry a button that turns its series on or off, or spotlights it. */
  onToggle?: (key: string) => void;
  /** Hears the key under the pointer (`null` when it leaves). */
  onHover?: (key: string | null, event?: PointerEvent<Element>) => void;
  /** Keys that are off (`shown`) or on (`spotlight`). */
  off?: ReadonlyArray<string>;
  pressedMeans?: "shown" | "spotlight";
  className?: string;
}) {
  return (
    <ul className={cx("fg-dash-legend", className)} aria-label={label}>
      {entries.map((entry) => {
        const marked = off.includes(entry.key);
        const pressed = pressedMeans === "shown" ? !marked : marked;
        const body = (
          <>
            <DashSwatch k={entry.k} color={entry.color} />
            <span className="fg-dash-legend-label">{entry.label}</span>
            {entry.value !== undefined ? (
              <span className="fg-dash-legend-value">{entry.value}</span>
            ) : null}
            {entry.share !== undefined ? (
              <span className="fg-dash-legend-share">{entry.share}</span>
            ) : null}
          </>
        );
        return (
          <li
            key={entry.key}
            className={cx(pressedMeans === "shown" && marked && "fg-dash-off")}
            onPointerMove={onHover ? (event) => onHover(entry.key, event) : undefined}
            onPointerLeave={onHover ? () => onHover(null) : undefined}
          >
            {onToggle ? (
              <button
                type="button"
                className="fg-dash-legend-item"
                aria-pressed={pressed}
                onClick={() => onToggle(entry.key)}
              >
                {body}
              </button>
            ) : (
              <span className="fg-dash-legend-item">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------------------------------------------------------- inside a ChartContainer */

/** The config's colour of `key`, or nothing when the container has no such series (or there is none). */
export function useConfigColor(): (key: string) => string | undefined {
  const chart = useChartApi();
  return (key) => (chart?.config[key] ? chartColor(key) : undefined);
}

/** The colour of an item of a sliced chart (Donut, Waffle, StackedBar) as an inline `--c`, when the config names it. */
export const colorStyle = (color: string | undefined, prop = "--c"): CSSProperties | undefined =>
  color ? ({ [prop]: color } as CSSProperties) : undefined;

/**
 * The colours of a chart whose colours carry states (a status strip, the tones of a change): each
 * key of `vars` the config names sets its CSS variable, `{ down: "--fg-strip-down" }`. Nothing
 * outside a container or for a key the config leaves out.
 */
export function useStateColors(vars: Readonly<Record<string, string>>): {
  style: CSSProperties | undefined;
  color: (key: string, fallback: string) => string;
} {
  const chart = useChartApi();
  const own = Object.keys(vars).filter((key) => chart?.config[key]);
  const style = own.length
    ? (Object.fromEntries(own.map((key) => [vars[key]!, chartColor(key)])) as CSSProperties)
    : undefined;
  return {
    style,
    color: (key, fallback) => (chart?.config[key] ? chartColor(key, fallback) : fallback),
  };
}

/** The config keys of the tones of a change, and the variables a chart's stylesheet reads them from. */
export const TONE_VARS: Readonly<Record<string, string>> = {
  good: "--fg-tone-good",
  bad: "--fg-tone-bad",
  flat: "--fg-tone-flat",
  warn: "--fg-tone-warn",
};

export interface SeriesOptions {
  /** With no `dataKey`, the first series of the config (a line); else no series (bars). */
  first?: boolean;
  /** The colour of the series outside a container, or when the config does not name it. */
  fallback: string;
  /** The name of the series when the config does not give one: the chart's title. */
  name: ReactNode;
  /** The CSS variable the chart's stylesheet reads its colour from. Default `--fg-chart-c`. */
  cssVar?: string;
}

/**
 * The series a chart draws, inside a `ChartContainer`: its key (the `dataKey`, or the config's
 * first), the colour and name the config gives it, the style that colours the chart, and a line of
 * the tooltip. Outside a container: the fallbacks, and no style, so nothing changes.
 */
export function useSeries(dataKey: string | undefined, options: SeriesOptions) {
  const chart = useChartApi();
  const key = dataKey ?? (options.first ? Object.keys(chart?.config ?? {})[0] : undefined);
  const own = key && chart?.config[key] ? key : undefined;
  const color = own ? chartColor(own, options.fallback) : options.fallback;
  const name = (own ? chart?.config[own]?.label : undefined) ?? options.name;
  const style = own ? colorStyle(chartColor(own), options.cssVar ?? "--fg-chart-c") : undefined;
  /** One line of the tooltip for this series. */
  const line = (value: ReactNode, payload?: unknown): ChartPayloadItem => ({
    dataKey: key ?? "value",
    name,
    value,
    color,
    payload,
  });
  return { chart, key, own, color, name, style, line };
}

/**
 * The pointer handlers of a mark that reports itself to the container's tooltip (a bar, a row, a
 * square); none outside a container.
 */
export function useReport() {
  const chart = useChartApi();
  return (read: () => ChartHover | null) =>
    chart
      ? {
          onPointerMove: (event: PointerEvent<Element>) => chart.report(read(), event),
          onPointerLeave: () => chart.report(null),
        }
      : {};
}

/**
 * The reader of a plot of `count` points (a line, columns, a strip): the point under the pointer,
 * or the one the arrows, Home and End move to, reported to the container's tooltip by `read`.
 */
export function useChartReader(count: number, read: (at: number) => ChartHover | null) {
  const chart = useChartApi();
  const [active, setActive] = useState<number | null>(null);
  const move = (next: number, event?: PointerEvent<Element>) => {
    if (count <= 0) return;
    const at = Math.max(0, Math.min(count - 1, next));
    setActive(at);
    chart?.report(read(at), event);
  };
  /**
   * The keys, moving from point `from` (default the one read); with no point, the right arrow reads
   * the first and the left arrow the last.
   */
  const onKeyDown = (from?: number | null) => (event: KeyboardEvent<HTMLElement>) => {
    const at = from === undefined ? active : from;
    if (event.key === "ArrowRight") move(at === null ? 0 : at + 1);
    else if (event.key === "ArrowLeft") move(at === null ? count - 1 : at - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(count - 1);
    else return;
    event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0) return;
    move(Math.floor(((event.clientX - box.left) / box.width) * count), event);
  };
  const leave = () => {
    setActive(null);
    chart?.report(null);
  };
  return { active, move, onKeyDown, onPointerMove, leave };
}

/* ---------------------------------------------------------------- text alternatives */

/** The first, middle and last labels under a plot (the table carries them all). */
export function ChartAxis({ labels }: { labels: ReadonlyArray<string> }) {
  if (!labels.length) return null;
  const middle = labels[Math.floor((labels.length - 1) / 2)];
  return (
    <div className="fg-line-axis" aria-hidden="true">
      <span>{labels[0]}</span>
      {labels.length > 2 && middle !== undefined ? <span>{middle}</span> : null}
      {labels.length > 1 ? <span>{labels[labels.length - 1]}</span> : null}
    </div>
  );
}

export interface ChartTableRow {
  key: string;
  /** The row's heading, then its cells. */
  head: ReactNode;
  cells: ReadonlyArray<ReactNode>;
}

/** The numbers of a chart as a table, for assistive technology only. */
export function ChartTable({
  caption,
  columns,
  rows,
}: {
  caption: ReactNode;
  /** The headings, the rows' own first. */
  columns: ReadonlyArray<ReactNode>;
  rows: ReadonlyArray<ChartTableRow>;
}) {
  return (
    <table className="fg-visually-hidden">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <th scope="row">{row.head}</th>
            {row.cells.map((c, i) => (
              <td key={i}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------------------------------------------------------------- slices of a whole */

/** The data of a sliced chart (Donut, Waffle): `items`, or rows read as shadcn's `Pie` reads them. */
export interface SliceData {
  /** One slice each. */
  items?: ReadonlyArray<{ label: string; value: number }>;
  /** Rows of any shape: `nameKey` names each slice (a key of the config), `dataKey` gives its value. */
  data?: ReadonlyArray<Readonly<Record<string, unknown>>>;
  /** The field of `data` that gives a slice's value. Default `value`. */
  dataKey?: string;
  /** The field of `data` that names a slice. Default `label`. */
  nameKey?: string;
}

/** The slices of `items`, or of `data` read through `dataKey` and `nameKey`. */
export function slicesFrom(source: SliceData): Array<{ label: string; value: number }> {
  if (source.items) return [...source.items];
  const valueKey = source.dataKey ?? "value";
  const labelKey = source.nameKey ?? "label";
  return (source.data ?? []).map((row) => ({
    label: String(row[labelKey] ?? ""),
    value: Number(row[valueKey] ?? 0) || 0,
  }));
}

/** The name of `key` in the container's config, else the key itself. */
export function useConfigName(): (key: string) => ReactNode {
  const chart = useChartApi();
  return (key) => chart?.config[key]?.label ?? key;
}
