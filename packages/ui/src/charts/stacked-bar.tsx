// Stacked bars, horizontal or vertical: each row split into the series that make it up, every
// series with its own pixel pattern and a key that turns it on or off. Totals are text; the whole
// is also a table.
//
// Two shapes under one name, as the Donut: with no children, `StackedBar` draws its key above its
// bars; with children, it is the root of the parts (`StackedBarKey`, `StackedBarBars`), placed
// where you like. The table read aloud is always there.

import { createContext, useContext, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../cx";
import { useChartApi } from "./chart";
import { dashboardStack, type DashboardStackRow } from "./model";
import {
  ChartTable,
  colorStyle,
  DashLegend,
  dashColor,
  dashSeries,
  useConfigColor,
  useReport,
} from "./parts";

export interface StackedBarSeries {
  /** Key of the value in each item. */
  key: string;
  label: string;
}

export interface StackedBarItem {
  label: string;
  /** One value per series key. */
  values: Readonly<Record<string, number>>;
}

export interface StackedBarProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Names the chart; also its caption. */
  title: string;
  /** The series, in stacking order; in a `ChartContainer`, default the keys of its config. */
  series?: ReadonlyArray<StackedBarSeries>;
  /** The bars, in order. */
  items: ReadonlyArray<StackedBarItem>;
  /** `horizontal` (default): one bar per row. `vertical`: columns. */
  orientation?: "horizontal" | "vertical";
  /** Every bar as long as the plot, showing shares instead of amounts. */
  normalize?: boolean;
  /** Writes a value. */
  format?: (value: number) => string;
  /** The label of the bar to stand out. */
  highlight?: string;
  /** Height of the plot of a vertical chart, in px. Default 160. */
  height?: number;
  /** The parts: `StackedBarKey`, `StackedBarBars`, laid out as you like. */
  children?: ReactNode;
}

interface StackedBarApi {
  title: string;
  series: ReadonlyArray<StackedBarSeries>;
  rows: ReadonlyArray<DashboardStackRow>;
  hidden: ReadonlyArray<string>;
  toggle: (key: string) => void;
  vertical: boolean;
  height: number;
  highlight?: string;
  format: (value: number) => string;
}

const StackedBarContext = createContext<StackedBarApi | null>(null);

function useStackedBar(part: string): StackedBarApi {
  const api = useContext(StackedBarContext);
  if (!api) throw new Error(`${part} must be used within a <StackedBar />`);
  return api;
}

/** Bars split into series; the key toggles a series, titles and the table give every figure. */
export function StackedBar({
  title,
  series: given,
  items,
  orientation = "horizontal",
  normalize = false,
  format = String,
  highlight,
  height = 160,
  className,
  children,
  ...rest
}: StackedBarProps) {
  const chart = useChartApi();
  const series: ReadonlyArray<StackedBarSeries> =
    given ??
    Object.entries(chart?.config ?? {}).map(([key, entry]) => ({
      key,
      label: typeof entry.label === "string" ? entry.label : key,
    }));
  const [hidden, setHidden] = useState<string[]>([]);
  const rows = dashboardStack(items, series, { hidden, normalize });
  const shown = series.filter((s) => !hidden.includes(s.key));
  const vertical = orientation === "vertical";
  const toggle = (key: string) =>
    setHidden((now) =>
      now.includes(key)
        ? now.filter((k) => k !== key)
        : now.length + 1 >= series.length
          ? now
          : [...now, key],
    );
  const api: StackedBarApi = {
    title,
    series,
    rows,
    hidden,
    toggle,
    vertical,
    height,
    format,
    ...(highlight !== undefined ? { highlight } : {}),
  };
  return (
    <StackedBarContext.Provider value={api}>
      <figure className={cx("fg-dash-stack", vertical && "fg-dash-stack-v", className)} {...rest}>
        <figcaption className="fg-dash-title">{title}</figcaption>
        {children ?? (
          <>
            <StackedBarKey />
            <StackedBarBars />
          </>
        )}
        <ChartTable
          caption={title}
          columns={["Bar", ...shown.map((s) => s.label), "Total"]}
          rows={rows.map((row) => ({
            key: row.label,
            head: row.label,
            cells: [...row.segments.map((seg) => format(seg.value)), format(row.total)],
          }))}
        />
      </figure>
    </StackedBarContext.Provider>
  );
}

export interface StackedBarKeyProps {
  className?: string;
}

/** The key: a swatch (pattern and colour) and the name of each series; a button turns it on or off. */
export function StackedBarKey({ className }: StackedBarKeyProps) {
  const bar = useStackedBar("StackedBarKey");
  const configColor = useConfigColor();
  return (
    <DashLegend
      label={`${bar.title}: series`}
      className={className}
      entries={bar.series.map((s, i) => ({
        key: s.key,
        label: s.label,
        k: i,
        color: configColor(s.key),
      }))}
      off={bar.hidden}
      onToggle={bar.toggle}
    />
  );
}

export interface StackedBarBarsProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  /** Height of the plot of a vertical chart in px, over the root's `height`. */
  height?: number;
}

/** The bars: each split into its series, its label before and its total after. */
export function StackedBarBars({ height, className, style, ...rest }: StackedBarBarsProps) {
  const bar = useStackedBar("StackedBarBars");
  const configColor = useConfigColor();
  const report = useReport();
  const { series, format, vertical } = bar;
  const tall = height ?? bar.height;
  const indexOf = (key: string) => series.findIndex((s) => s.key === key);
  return (
    <ul
      className={cx("fg-dash-stack-list", className)}
      style={{ ...(vertical ? { height: tall + 36 } : {}), ...style }}
      {...rest}
    >
      {bar.rows.map((row) => (
        <li
          key={row.label}
          className={cx("fg-dash-stack-row", row.label === bar.highlight && "fg-dash-hi")}
          {...report(() => ({
            label: row.label,
            payload: row.segments.map((seg) => {
              const at = indexOf(seg.key);
              return {
                dataKey: seg.key,
                name: series[at]?.label ?? seg.key,
                value: format(seg.value),
                color: dashColor(at, seg.key),
                payload: seg,
              };
            }),
          }))}
        >
          <span className="fg-dash-stack-label">{row.label}</span>
          <span
            className="fg-dash-stack-track"
            style={vertical ? { height: tall } : undefined}
            aria-hidden="true"
          >
            {row.segments.map((seg) =>
              seg.value > 0 ? (
                <span
                  key={seg.key}
                  className={cx("fg-dash-seg", dashSeries(indexOf(seg.key)))}
                  style={{
                    [vertical ? "height" : "width"]: `${seg.share * 100}%`,
                    ...colorStyle(configColor(seg.key)),
                  }}
                  title={`${row.label}, ${series[indexOf(seg.key)]?.label}: ${format(seg.value)}`}
                />
              ) : null,
            )}
          </span>
          <span className="fg-dash-stack-total">{format(row.total)}</span>
        </li>
      ))}
    </ul>
  );
}
