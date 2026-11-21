// A row of key figures, after the Dashboard prototype: glued cells, a mono label, the figure in
// mono with tabular digits, then how it moved (an arrow, a sign and a colour, never the colour
// alone) and, when given, its trend as a sparkline.

import { ArrowDownRight01Icon, ArrowUpRight01Icon, MinusSignIcon } from "@forgeron/icons";
import { createContext, useContext, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { TONE_VARS, useStateColors } from "./parts";
import { Sparkline } from "./sparkline";

export interface Kpi {
  /** Short, in capitals on screen: `Revenue`, `Open tickets`. */
  label: string;
  /** The figure, already written: `€48.2k`, `1,204`, `98.4%`. */
  value: ReactNode;
  /** How it moved since the period before, as a ratio: 0.12 reads +12%. */
  delta?: number;
  /** Which way is good news: `up` (default) for revenue, `down` for open tickets. */
  better?: "up" | "down";
  /** What the delta compares with, after it: `vs last week`. */
  hint?: ReactNode;
  /** The trend, oldest first: a sparkline in the cell's corner. */
  trend?: ReadonlyArray<number>;
}

export interface KpiRowProps extends HTMLAttributes<HTMLDListElement> {
  /** The figures; or give them as `KpiRowItem` children. */
  items?: ReadonlyArray<Kpi>;
  /** Writes a delta; default a signed percent, `+12%`. */
  formatDelta?: (delta: number) => string;
  /** The series in a `ChartContainer` config that colours the sparklines; default the first. */
  dataKey?: string;
  /** `KpiRowItem`s, in place of `items`. */
  children?: ReactNode;
}

const percent = (delta: number) => {
  const rounded = Math.round(delta * 1000) / 10;
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : "±"}${Math.abs(rounded)}%`;
};

function Delta({
  delta,
  better = "up",
  format,
}: {
  delta: number;
  better?: "up" | "down";
  format: (delta: number) => string;
}) {
  const way = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const tone = way === "flat" ? "flat" : way === better ? "good" : "bad";
  const icon =
    way === "up" ? ArrowUpRight01Icon : way === "down" ? ArrowDownRight01Icon : MinusSignIcon;
  return (
    <span className={cx("fg-kpi-delta", `fg-kpi-${tone}`)}>
      <Icon icon={icon} size={12} variant="mono" />
      <span className="fg-visually-hidden">{way === "flat" ? "unchanged" : way} </span>
      {format(delta)}
    </span>
  );
}

const KpiRowContext = createContext<{
  formatDelta: (delta: number) => string;
  dataKey?: string;
} | null>(null);

/**
 * Key figures side by side: label, figure, change and trend. Wraps to fit, cells stay glued. With
 * `items`, one cell each; with children, the root of `KpiRowItem`s.
 */
export function KpiRow({
  items,
  formatDelta = percent,
  dataKey,
  className,
  style,
  children,
  ...rest
}: KpiRowProps) {
  const colors = useStateColors(TONE_VARS);
  return (
    <KpiRowContext.Provider value={{ formatDelta, ...(dataKey ? { dataKey } : {}) }}>
      <dl className={cx("fg-kpis", className)} style={{ ...colors.style, ...style }} {...rest}>
        {children ?? items?.map((item) => <KpiRowItem key={item.label} {...item} />)}
      </dl>
    </KpiRowContext.Provider>
  );
}

export interface KpiRowItemProps
  extends Kpi, Omit<HTMLAttributes<HTMLDivElement>, "children" | keyof Kpi> {
  /** More under the figure: a link, a badge. */
  children?: ReactNode;
}

/** One cell of a `KpiRow`: label, figure, then how it moved and its trend. */
export function KpiRowItem({
  label,
  value,
  delta,
  better,
  hint,
  trend,
  className,
  children,
  ...rest
}: KpiRowItemProps) {
  const row = useContext(KpiRowContext);
  if (!row) throw new Error("KpiRowItem must be used within a <KpiRow />");
  return (
    <div className={cx("fg-kpi", className)} {...rest}>
      <dt className="fg-kpi-label">{label}</dt>
      <dd className="fg-kpi-value">{value}</dd>
      {delta !== undefined || hint || trend?.length ? (
        <dd className="fg-kpi-foot">
          <span className="fg-kpi-change">
            {delta !== undefined ? (
              <Delta delta={delta} better={better} format={row.formatDelta} />
            ) : null}
            {hint ? <span className="fg-kpi-hint">{hint}</span> : null}
          </span>
          {trend?.length ? (
            <Sparkline
              values={trend}
              width={64}
              height={16}
              dataKey={row.dataKey}
              className="fg-kpi-spark"
            />
          ) : null}
        </dd>
      ) : null}
      {children !== undefined ? <dd className="fg-kpi-more">{children}</dd> : null}
    </div>
  );
}
