// A histogram: how values spread, as contiguous pixel columns of round-width bins, with quantiles
// (p50, p95 by default) as labelled rules. A threshold can paint the tail in ember: the requests
// over the objective, the runs over their budget. Hover or the arrows read one bin.

import { useId, type HTMLAttributes } from "react";
import { cx } from "../cx";
import { dashboardHistogram, dashboardQuantile } from "./model";
import { ChartTable, useChartReader, useSeries } from "./parts";
import { dottedRow, PX, rect, useWidth } from "./scale";

export interface HistogramMark {
  /** The share of values under it, 0 to 1: 0.95 for p95. */
  p: number;
  /** Written by the rule: `p95`. */
  label: string;
}

export interface HistogramProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  /** The raw values: one per request, per run, per deal. */
  values: ReadonlyArray<number>;
  /** About how many bins; their width is rounded to 1, 2 or 5 times a power of ten. Default 20. */
  bins?: number;
  /** The ends of the range counted; values outside are left out. Default the lowest and highest. */
  min?: number;
  max?: number;
  /** Writes a value of the measure (`124 ms`). */
  format?: (value: number) => string;
  /** What one value is, in the readout: `requests`. Default `values`. */
  unit?: string;
  /** Quantiles drawn as rules. Default p50 and p95; `[]` for none. */
  marks?: ReadonlyArray<HistogramMark>;
  /** Bins from this value up are drawn in ember: the tail past an objective. */
  threshold?: number;
  /** Height of the plot in px. Default 140. */
  height?: number;
  /** The series in a `ChartContainer` config that colours the bins and names them in the tooltip. */
  dataKey?: string;
}

const DEFAULT_MARKS: ReadonlyArray<HistogramMark> = [
  { p: 0.5, label: "p50" },
  { p: 0.95, label: "p95" },
];

/** The spread of values as bins, with quantile rules; the pointer or the arrows read one bin. */
export function Histogram({
  title,
  values,
  bins: about = 20,
  min,
  max,
  format = String,
  unit = "values",
  marks = DEFAULT_MARKS,
  threshold,
  height = 140,
  dataKey,
  className,
  style,
  ...rest
}: HistogramProps) {
  const id = useId();
  const series = useSeries(dataKey, { fallback: "var(--ink-muted)", name: unit });
  const [plot, width] = useWidth<HTMLDivElement>(320);
  const bins = dashboardHistogram(values, { bins: about, min, max });
  const first = bins[0]?.from ?? 0;
  const last = bins[bins.length - 1]?.to ?? 1;
  const peak = Math.max(1, ...bins.map((b) => b.count));
  const cols = Math.max(1, Math.floor(width / PX));
  const rows = Math.max(8, Math.floor(height / PX));
  const top = 4;
  const n = Math.max(1, bins.length);
  const xOf = (v: number) => Math.round(((v - first) / (last - first || 1)) * cols);
  const inRange = values.filter((v) => Number.isFinite(v) && v >= first && v <= last).length;
  const share = (count: number) => (inRange ? Math.round((count / inRange) * 100) : 0);
  const reader = useChartReader(bins.length, (at) => {
    const b = bins[at];
    return b
      ? {
          label: `${format(b.from)} – ${format(b.to)}`,
          payload: [
            { ...series.line(`${b.count} · ${share(b.count)}%`, b), dataKey: dataKey ?? "count" },
          ],
        }
      : null;
  });
  const active = reader.active;

  let ink = "";
  let tail = "";
  let lit = "";
  bins.forEach((b, i) => {
    const x0 = Math.round((i * cols) / n);
    const x1 = Math.round(((i + 1) * cols) / n);
    const w = x1 - x0 >= 3 ? x1 - x0 - 1 : Math.max(1, x1 - x0);
    const h = b.count > 0 ? Math.max(1, Math.round((b.count / peak) * (rows - 1 - top))) : 0;
    if (h <= 0) return;
    const capY = rows - 1 - h;
    let d = rect(x0, capY, w, 1);
    for (let y = capY + 2; y < rows - 1; y += 2) d += rect(x0, y, w, 1);
    if (i === active) lit += d;
    else if (threshold !== undefined && b.from >= threshold) tail += d;
    else ink += d;
  });
  const quantiles = marks
    .map((m) => ({ ...m, value: dashboardQuantile(values, m.p) }))
    .filter((m) => Number.isFinite(m.value));
  const bin = active === null ? undefined : bins[active];

  return (
    <figure className={cx("fg-hist", className)} style={{ ...series.style, ...style }} {...rest}>
      <div className="fg-line-head">
        <figcaption className="fg-line-title" id={`${id}-title`}>
          {title}
        </figcaption>
        <output className="fg-line-readout" aria-live="polite">
          {bin ? (
            <>
              <span className="fg-line-readout-label">
                {format(bin.from)} – {format(bin.to)}
              </span>
              <b>{bin.count}</b>
              <span className="fg-line-readout-label">
                {unit}, {share(bin.count)}%
              </span>
            </>
          ) : (
            <>
              <b>{inRange}</b>
              <span className="fg-line-readout-label">{unit}</span>
            </>
          )}
        </output>
      </div>
      <div
        ref={plot}
        className="fg-line-plot fg-hist-plot"
        style={{ height: rows * PX }}
        tabIndex={bins.length ? 0 : undefined}
        role="group"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-hint`}
        onKeyDown={reader.onKeyDown()}
        onPointerMove={reader.onPointerMove}
        onPointerLeave={reader.leave}
        onBlur={reader.leave}
      >
        <svg
          width={cols * PX}
          height={rows * PX}
          viewBox={`0 0 ${cols} ${rows}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <path
            d={[0.25, 0.5, 0.75].map((f) => dottedRow(Math.round(rows * f), cols, 3)).join("")}
            className="fg-line-ink-grid"
          />
          <path d={ink} className="fg-hist-ink" />
          <path d={tail} className="fg-hist-tail" />
          <path d={lit} className="fg-hist-lit" />
          {threshold !== undefined && threshold > first && threshold < last ? (
            <path
              d={Array.from({ length: Math.ceil((rows - 1) / 2) }, (_, k) =>
                rect(xOf(threshold), k * 2, 1, 1),
              ).join("")}
              className="fg-hist-tail"
            />
          ) : null}
          <path d={rect(0, rows - 1, cols, 1)} className="fg-line-ink-grid" />
        </svg>
        {quantiles.map((q, i) => (
          <span
            key={q.label}
            className="fg-hist-mark"
            style={{ left: `${((q.value - first) / (last - first || 1)) * 100}%`, top: i * 16 }}
            aria-hidden="true"
          >
            <span className="fg-hist-mark-label">
              {q.label} <b>{format(Math.round(q.value * 100) / 100)}</b>
            </span>
          </span>
        ))}
      </div>
      <p className="fg-visually-hidden" id={`${id}-hint`}>
        Left and right arrows read one bin.
      </p>
      {bins.length ? (
        <div className="fg-line-axis" aria-hidden="true">
          <span>{format(first)}</span>
          {bins.length > 2 ? <span>{format(bins[Math.floor(bins.length / 2)]!.from)}</span> : null}
          <span>{format(last)}</span>
        </div>
      ) : null}
      {quantiles.length || threshold !== undefined ? (
        <p className="fg-hist-summary">
          {quantiles.map((q) => (
            <span key={q.label}>
              {q.label} <b>{format(Math.round(q.value * 100) / 100)}</b>
            </span>
          ))}
          {threshold !== undefined ? (
            <span className="fg-hist-over">
              over {format(threshold)}{" "}
              <b>{share(values.filter((v) => v >= threshold && v <= last).length)}%</b>
            </span>
          ) : null}
        </p>
      ) : null}
      <ChartTable
        caption={title}
        columns={["From", "To", "Count"]}
        rows={bins.map((b) => ({
          key: String(b.from),
          head: format(b.from),
          cells: [format(b.to), b.count],
        }))}
      />
    </figure>
  );
}
