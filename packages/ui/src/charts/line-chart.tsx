// A step line over time, in pixels: one chart pixel to two CSS pixels, a dithered area under it,
// the previous period dotted in grey. Drawn in an SVG of whole pixels (`crispEdges`), never smoothed.

import { useId, type HTMLAttributes } from "react";
import { cx } from "../cx";
import { MarkerKey, MarkerRules, markersAt, placeMarkers, type ChartMarker } from "./markers";
import { ChartAxis, ChartTable, useChartReader, useSeries } from "./parts";
import { dottedRow, PX, rect, stepPaths, useWidth } from "./scale";

export interface ChartPoint {
  /** Written under the axis and in the readout: `Nov 12`, `W46`. */
  label: string;
  value: number;
}

export interface LineChartProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  points: ReadonlyArray<ChartPoint>;
  /** The same points one period earlier, dotted in grey behind the line. */
  previous?: ReadonlyArray<number>;
  /** Formats a value in the readout, the top of the axis and the table read aloud. */
  format?: (value: number) => string;
  /** The height of the plot in px. */
  height?: number;
  /** The series in a `ChartContainer` config that colours the line and names it in the tooltip; default the first. */
  dataKey?: string;
  /** Events at points of the chart: a numbered flag and a rule over the point, a key under the axis. */
  markers?: ReadonlyArray<ChartMarker>;
}

/**
 * A step line over time, in pixels. Hover or the arrows read one point in the header; the values
 * are also a table for assistive technology. The axis starts at zero.
 */
export function LineChart({
  title,
  points,
  previous,
  format = String,
  height = 160,
  dataKey,
  markers,
  className,
  style,
  ...rest
}: LineChartProps) {
  const series = useSeries(dataKey, { first: true, fallback: "var(--accent)", name: title });
  const id = useId();
  const [plot, width] = useWidth<HTMLDivElement>(320);
  const reader = useChartReader(points.length, (at) => {
    const read = points[at];
    return read ? { label: read.label, payload: [series.line(format(read.value), read)] } : null;
  });
  const active = reader.active;
  const shown = active ?? points.length - 1;
  const point = points[shown];
  const placed = placeMarkers(
    markers,
    points.map((p) => p.label),
  );

  const values = points.map((p) => p.value);
  const max = Math.max(1, ...values, ...(previous ?? []));
  const cols = Math.max(1, Math.floor(width / PX));
  const rows = Math.max(8, Math.floor(height / PX));
  const { line, area } = stepPaths(values, cols, rows, 0, max, 6);
  const before = previous?.length ? stepPaths(previous, cols, rows, 0, max, 6).dots : "";
  const grid = [0.25, 0.5, 0.75].map((f) => dottedRow(Math.round(rows * f), cols, 3)).join("");
  const xOf = (i: number) => Math.round((i * cols) / Math.max(1, points.length));

  return (
    <figure className={cx("fg-line", className)} style={{ ...series.style, ...style }} {...rest}>
      <div className="fg-line-head">
        <figcaption className="fg-line-title" id={`${id}-title`}>
          {title}
        </figcaption>
        {point ? (
          <output className="fg-line-readout" aria-live="polite">
            <span className="fg-line-readout-label">{point.label}</span>
            <b>{format(point.value)}</b>
            {previous?.[shown] !== undefined ? (
              <span className="fg-line-readout-label">before {format(previous[shown]!)}</span>
            ) : null}
            {markersAt(placed, shown) ? (
              <span className="fg-mark-read">{markersAt(placed, shown)}</span>
            ) : null}
          </output>
        ) : null}
      </div>
      <div
        ref={plot}
        className="fg-line-plot"
        style={{ height: rows * PX }}
        tabIndex={points.length ? 0 : undefined}
        role="group"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-hint`}
        onKeyDown={reader.onKeyDown(shown)}
        onPointerMove={reader.onPointerMove}
        onPointerLeave={reader.leave}
        onBlur={reader.leave}
      >
        <span className="fg-line-max" aria-hidden="true">
          {format(max)}
        </span>
        <svg
          width={cols * PX}
          height={rows * PX}
          viewBox={`0 0 ${cols} ${rows}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <defs>
            <pattern id={`${id}-dots`} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="1" height="1" className="fg-line-ink-accent" />
              <rect x="2" y="2" width="1" height="1" className="fg-line-ink-accent" />
            </pattern>
          </defs>
          <path d={grid} className="fg-line-ink-grid" />
          {active !== null ? (
            <path
              d={rect(xOf(shown), 0, Math.max(1, xOf(shown + 1) - xOf(shown)), rows - 1)}
              className="fg-line-ink-hover"
            />
          ) : null}
          <path d={area} fill={`url(#${id}-dots)`} />
          {before ? <path d={before} className="fg-line-ink-before" /> : null}
          <path d={line} className="fg-line-ink-accent" />
          <path d={rect(0, rows - 1, cols, 1)} className="fg-line-ink-grid" />
        </svg>
        <MarkerRules placed={placed} count={points.length} active={active} />
      </div>
      <p className="fg-visually-hidden" id={`${id}-hint`}>
        Left and right arrows read one point.
      </p>
      <ChartAxis labels={points.map((p) => p.label)} />
      <MarkerKey placed={placed} title={title} />
      <ChartTable
        caption={title}
        columns={["Point", "Value", ...(previous?.length ? ["Before"] : [])]}
        rows={points.map((p, i) => ({
          key: `${p.label}-${i}`,
          head: p.label,
          cells: [
            format(p.value),
            ...(previous?.length ? [previous[i] === undefined ? "" : format(previous[i]!)] : []),
          ],
        }))}
      />
    </figure>
  );
}
