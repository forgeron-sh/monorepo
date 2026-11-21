// A heatmap in steps: square cells, five levels of dither (empty, three patterns, solid), never a
// smooth ramp. A matrix (rows × columns) or a calendar (weeks of a period). A grid you can walk
// with the arrows; the cell under the cursor is read aloud and written above the plot.

import { useId, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent } from "react";
import { cx } from "../cx";
import { formatShort, MONTHS, parseIso } from "../dates";
import { useChartApi } from "./chart";
import { dashboardCalendarCells, dashboardHeatLevel } from "./model";
import { useSeries } from "./parts";

interface HeatmapBase extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  /** Writes a value. */
  format?: (value: number) => string;
  /** Matrix: the label of the row to stand out (the others fade). Calendar: a day, `YYYY-MM-DD`. */
  highlight?: string;
  /** What a value counts, in the readout: `activities`. */
  unit?: string;
  /** Side of a cell in px, even. Default 14. */
  cell?: number;
  /** The series in a `ChartContainer` config that colours the cells and names them in the tooltip. */
  dataKey?: string;
}

export interface HeatmapMatrixProps extends HeatmapBase {
  /** The rows, top to bottom: teams, weekdays. */
  rows: ReadonlyArray<string>;
  /** The columns, left to right: hours, weeks. */
  columns: ReadonlyArray<string>;
  /** `values[row][column]`. */
  values: ReadonlyArray<ReadonlyArray<number>>;
}

export interface HeatmapCalendarProps extends HeatmapBase {
  /** One value per day; the days that are missing count 0. */
  items: ReadonlyArray<{ date: string; value: number }>;
  /** First and last day of the period, `YYYY-MM-DD`. */
  from: string;
  to: string;
  /** The first row of the grid. Default `mon`. */
  weekStart?: "mon" | "sun";
}

export type HeatmapProps = HeatmapMatrixProps | HeatmapCalendarProps;

interface Cell {
  /** Where the cell is: `Support · 14:00`, `Nov 12`. */
  at: string;
  label: string;
  value: number;
  /** Day of a calendar cell. */
  date?: string;
}

interface Plot {
  rowLabels: string[];
  colLabels: string[];
  /** `cells[row][column]`; `null` where a calendar has no day. */
  cells: Array<Array<Cell | null>>;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function plotOf(props: HeatmapProps, format: (v: number) => string): Plot {
  if ("rows" in props) {
    return {
      rowLabels: [...props.rows],
      colLabels: [...props.columns],
      cells: props.rows.map((row, r) =>
        props.columns.map((col, c) => {
          const value = props.values[r]?.[c] ?? 0;
          return { at: `${row} · ${col}`, label: `${row} · ${col}: ${format(value)}`, value };
        }),
      ),
    };
  }
  const start = props.weekStart ?? "mon";
  const weeks = dashboardCalendarCells(props.from, props.to, start);
  const by = new Map(props.items.map((i) => [i.date, i.value]));
  const names = start === "mon" ? DAYS : ["Sun", ...DAYS.slice(0, 6)];
  let lastMonth = -1;
  const colLabels = weeks.map((week) => {
    const first = week.find((d) => d !== null);
    const month = first ? parseIso(first).getMonth() : -1;
    const text = month !== lastMonth && month >= 0 ? MONTHS[month]!.slice(0, 3) : "";
    lastMonth = month;
    return text;
  });
  return {
    rowLabels: names.map((n, i) => (i % 2 === 0 ? n : "")),
    colLabels,
    cells: names.map((_, r) =>
      weeks.map((week) => {
        const date = week[r];
        if (!date) return null;
        const value = by.get(date) ?? 0;
        return {
          at: formatShort(date),
          label: `${formatShort(date)}: ${format(value)}`,
          value,
          date,
        };
      }),
    ),
  };
}

/**
 * Cells in five dithered steps. Arrows walk the grid, Home and End jump along a row; every cell
 * has its label and value as text. The key below gives the scale in numbers.
 */
/** The props that are data, not attributes of the figure. */
const DATA_PROPS = ["rows", "columns", "values", "items", "from", "to", "weekStart"];

export function Heatmap(props: HeatmapProps) {
  const {
    title,
    format = String,
    highlight,
    unit = "",
    cell = 14,
    dataKey,
    className,
    style,
    ...others
  } = props;
  const rest: Record<string, unknown> = { ...others };
  for (const key of DATA_PROPS) delete rest[key];
  const id = useId();
  const chart = useChartApi();
  const series = useSeries(dataKey, { fallback: "var(--accent)", name: title });
  const matrix = "rows" in props;
  const plot = plotOf(props, format);
  const rowsCount = plot.cells.length;
  const colsCount = plot.cells[0]?.length ?? 0;
  const max = Math.max(0, ...plot.cells.flat().map((c) => c?.value ?? 0));
  const [active, setActive] = useState<[number, number] | null>(null);
  const first: [number, number] = (() => {
    for (let c = 0; c < colsCount; c += 1)
      for (let r = 0; r < rowsCount; r += 1) if (plot.cells[r]![c]) return [r, c];
    return [0, 0];
  })();
  const current = active ?? first;
  const here = plot.cells[current[0]]?.[current[1]] ?? null;
  const widest = Math.max(1, ...plot.colLabels.map((l) => l.length));
  const step = Math.max(1, Math.ceil((widest * 6.5) / (cell + 3)));
  const noun = unit ? ` ${unit}` : "";

  /** Reads cell `r`, `c`: in the header, and in the container's tooltip. */
  const read = (r: number, c: number, event?: PointerEvent<Element>) => {
    setActive([r, c]);
    const at = plot.cells[r]?.[c];
    chart?.report(
      at ? { label: at.at, payload: [series.line(`${format(at.value)}${noun}`, at)] } : null,
      event,
    );
  };
  const focusCell = (r: number, c: number) => {
    setActive([r, c]);
    const el = document.getElementById(`${id}-${r}-${c}`);
    el?.focus();
  };
  const walk = (dr: number, dc: number) => {
    let [r, c] = current;
    for (;;) {
      r += dr;
      c += dc;
      if (r < 0 || c < 0 || r >= rowsCount || c >= colsCount) return;
      if (plot.cells[r]![c]) return focusCell(r, c);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const r = current[0];
    if (event.key === "ArrowRight") walk(0, 1);
    else if (event.key === "ArrowLeft") walk(0, -1);
    else if (event.key === "ArrowDown") walk(1, 0);
    else if (event.key === "ArrowUp") walk(-1, 0);
    else if (event.key === "Home") {
      const to = plot.cells[r]!.findIndex(Boolean);
      if (to >= 0) focusCell(r, to);
    } else if (event.key === "End") {
      const row = plot.cells[r]!;
      for (let i = row.length - 1; i >= 0; i -= 1)
        if (row[i]) {
          focusCell(r, i);
          break;
        }
    } else return;
    event.preventDefault();
  };

  return (
    <figure
      className={cx("fg-dash-heat", className)}
      style={{ ["--fg-dash-cell" as string]: `${cell}px`, ...series.style, ...style }}
      {...(rest as HTMLAttributes<HTMLElement>)}
    >
      <div className="fg-dash-head">
        <figcaption className="fg-dash-title" id={`${id}-title`}>
          {title}
        </figcaption>
        {here ? (
          <output className="fg-dash-readout" aria-live="polite">
            {here.label}
            {noun}
          </output>
        ) : null}
      </div>
      <div className="fg-dash-heat-scroll">
        <div
          role="grid"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-hint`}
          className="fg-dash-heat-grid"
          onKeyDown={onKeyDown}
          onPointerLeave={chart ? () => chart.report(null) : undefined}
          onBlur={
            chart
              ? (event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                    chart.report(null);
                }
              : undefined
          }
        >
          {plot.cells.map((row, r) => {
            const dim = highlight !== undefined && matrix && plot.rowLabels[r] !== highlight;
            return (
              <div key={r} role="row" className={cx("fg-dash-heat-row", dim && "fg-dash-dim")}>
                <span role="rowheader" className="fg-dash-heat-rl">
                  {plot.rowLabels[r]}
                </span>
                {row.map((c, col) =>
                  c ? (
                    <div
                      key={col}
                      id={`${id}-${r}-${col}`}
                      role="gridcell"
                      tabIndex={current[0] === r && current[1] === col ? 0 : -1}
                      aria-label={`${c.label}${noun}`}
                      className={cx(
                        "fg-dash-hc",
                        `fg-dash-l${dashboardHeatLevel(c.value, max)}`,
                        c.date !== undefined && c.date === highlight && "fg-dash-hc-hi",
                      )}
                      onFocus={() => read(r, col)}
                      onPointerEnter={(event) => read(r, col, event)}
                    />
                  ) : (
                    <span key={col} role="presentation" className="fg-dash-hc fg-dash-hc-none" />
                  ),
                )}
              </div>
            );
          })}
          <div role="row" className="fg-dash-heat-row fg-dash-heat-axis" aria-hidden="true">
            <span className="fg-dash-heat-rl" />
            {plot.colLabels.map((label, i) => (
              <span key={i} className="fg-dash-hc fg-dash-xl">
                {!matrix || i % step === 0 ? label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="fg-visually-hidden" id={`${id}-hint`}>
        Arrow keys move between cells; Home and End jump to the ends of a row.
      </p>
      <div className="fg-dash-heat-key" aria-label="Scale">
        <span>0</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={cx("fg-dash-hc", `fg-dash-l${l}`)} aria-hidden="true" />
        ))}
        <span>{format(max)}</span>
      </div>
    </figure>
  );
}
