// Columns over time, in pixels: each column a solid cap on scan lines (the BarChart's fill, stood
// up), the previous period as a dotted cap over each column, a target as a dotted rule. The column
// read by the pointer or the arrows lights up and is written in the header.

import { useId, type HTMLAttributes } from "react";
import { cx } from "../cx";
import type { ChartPoint } from "./line-chart";
import { MarkerKey, MarkerRules, markersAt, placeMarkers, type ChartMarker } from "./markers";
import { ChartAxis, ChartTable, useChartReader, useSeries } from "./parts";
import { dottedRow, PX, rect, useWidth } from "./scale";

export interface ColumnChartProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  /** One column each, oldest first. */
  points: ReadonlyArray<ChartPoint>;
  /** The same points one period earlier: a dotted cap over each column. */
  previous?: ReadonlyArray<number>;
  /** A value every column is measured against: a dotted rule across the plot. */
  target?: number;
  /** Writes a value in the readout, the axis and the table read aloud. */
  format?: (value: number) => string;
  /** The label of the column drawn in ember (this week); default: none, every column in ink. */
  highlight?: string;
  /** The height of the plot in px. Default 160. */
  height?: number;
  /** The series in a `ChartContainer` config that colours the columns and names them in the tooltip. */
  dataKey?: string;
  /** Events at points of the chart: a numbered flag and a rule over the point, a key under the axis. */
  markers?: ReadonlyArray<ChartMarker>;
}

/** The pixel geometry of the columns, shared by the drawing and the tests. */
export function columnLayout(
  values: ReadonlyArray<number>,
  cols: number,
  rows: number,
  max: number,
  top = 6,
) {
  const n = Math.max(1, values.length);
  const usable = rows - 1 - top;
  const heightOf = (v: number) =>
    max > 0 ? Math.round((Math.max(0, Math.min(v, max)) / max) * usable) : 0;
  return values.map((v, i) => {
    const x0 = Math.round((i * cols) / n);
    const x1 = Math.round(((i + 1) * cols) / n);
    const slot = x1 - x0;
    // A gap of a quarter of the slot, at least one pixel when there is room for one.
    const gap = slot > 2 ? Math.max(1, Math.round(slot / 4)) : 0;
    const x = x0 + Math.floor(gap / 2);
    return { x, w: Math.max(1, slot - gap), h: heightOf(v), slot: { x: x0, w: slot } };
  });
}

/** The scan-line fill of a column: its cap row, then one row in two down to the baseline. */
function columnPath(x: number, w: number, h: number, rows: number) {
  if (h <= 0) return "";
  const capY = rows - 1 - h;
  let d = rect(x, capY, w, 1);
  for (let y = capY + 2; y < rows - 1; y += 2) d += rect(x, y, w, 1);
  return d;
}

/**
 * Columns over time, from zero: hover or the arrows read one column in the header; the values are
 * also a table for assistive technology.
 */
export function ColumnChart({
  title,
  points,
  previous,
  target,
  format = String,
  highlight,
  height = 160,
  dataKey,
  markers,
  className,
  style,
  ...rest
}: ColumnChartProps) {
  const series = useSeries(dataKey, { fallback: "var(--ink-muted)", name: title });
  const id = useId();
  const [plot, width] = useWidth<HTMLDivElement>(320);
  const reader = useChartReader(points.length, (at) => {
    const read = points[at];
    if (!read) return null;
    return {
      label: read.label,
      payload: [
        series.line(format(read.value), read),
        ...(previous?.[at] !== undefined
          ? [
              {
                dataKey: "previous",
                name: "Before",
                value: format(previous[at]!),
                color: "var(--ink-dim)",
              },
            ]
          : []),
      ],
    };
  });
  const active = reader.active;
  const lead = highlight === undefined ? -1 : points.findIndex((p) => p.label === highlight);
  const shown = active ?? (lead >= 0 ? lead : points.length - 1);
  const point = points[shown];
  const placed = placeMarkers(
    markers,
    points.map((p) => p.label),
  );

  const values = points.map((p) => p.value);
  const max = Math.max(1, ...values, ...(previous ?? []), target ?? 0);
  const cols = Math.max(1, Math.floor(width / PX));
  const rows = Math.max(8, Math.floor(height / PX));
  const top = 6;
  const layout = columnLayout(values, cols, rows, max, top);
  const before = previous?.length ? columnLayout(previous, cols, rows, max, top) : [];
  const targetY =
    target === undefined ? null : rows - 1 - Math.round((target / max) * (rows - 1 - top));

  // With a previous period, each slot pairs a dithered ghost (before) with the column (now).
  const paired = before.length > 0;
  let ink = "";
  let lit = "";
  let ghosts = "";
  layout.forEach((c, i) => {
    const ghostW = paired && c.w >= 3 ? Math.max(1, Math.round(c.w * 0.4)) : 0;
    const x = c.x + (ghostW ? ghostW + 1 : 0);
    const w = c.w - (ghostW ? ghostW + 1 : 0);
    const d = columnPath(x, w, c.h, rows);
    if (i === lead || i === active) lit += d;
    else ink += d;
    const g = before[i];
    if (g && g.h > 0) {
      const gx = c.x;
      const gw = ghostW || c.w;
      const capY = rows - 1 - g.h;
      ghosts += rect(gx, capY, gw, 1);
      for (let y = capY + 1; y < rows - 1; y += 1) {
        for (let px = gx + ((y + capY) % 2); px < gx + gw; px += 2) ghosts += rect(px, y, 1, 1);
      }
    }
  });

  return (
    <figure className={cx("fg-cols", className)} style={{ ...series.style, ...style }} {...rest}>
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
          <path
            d={[0.25, 0.5, 0.75].map((f) => dottedRow(Math.round(rows * f), cols, 3)).join("")}
            className="fg-line-ink-grid"
          />
          {active !== null && layout[active] ? (
            <path
              d={rect(layout[active]!.slot.x, 0, layout[active]!.slot.w, rows - 1)}
              className="fg-line-ink-hover"
            />
          ) : null}
          <path d={ink} className="fg-cols-ink" />
          <path d={lit} className="fg-cols-lit" />
          {ghosts ? <path d={ghosts} className="fg-line-ink-before" /> : null}
          {targetY !== null ? (
            <path d={dottedRow(targetY, cols, 2)} className="fg-cols-target" />
          ) : null}
          <path d={rect(0, rows - 1, cols, 1)} className="fg-line-ink-grid" />
        </svg>
        <MarkerRules placed={placed} count={points.length} active={active} />
      </div>
      <p className="fg-visually-hidden" id={`${id}-hint`}>
        Left and right arrows read one column.
      </p>
      <ChartAxis labels={points.map((p) => p.label)} />
      <MarkerKey placed={placed} title={title} />
      {target !== undefined || paired ? (
        <ul className="fg-cols-key" aria-hidden="true">
          <li>
            <span className="fg-cols-swatch fg-cols-swatch-now" />
            Now
          </li>
          {paired ? (
            <li>
              <span className="fg-cols-swatch fg-cols-swatch-before" />
              Before
            </li>
          ) : null}
          {target !== undefined ? (
            <li>
              <span className="fg-cols-swatch fg-cols-swatch-target" />
              Target <b>{format(target)}</b>
            </li>
          ) : null}
        </ul>
      ) : null}
      <ChartTable
        caption={`${title}${target !== undefined ? `, target ${format(target)}` : ""}`}
        columns={["Column", "Value", ...(previous?.length ? ["Before"] : [])]}
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
