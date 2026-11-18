// A row of key figures, after the Dashboard prototype: glued cells, a mono label, the figure in
// mono with tabular digits, then how it moved (an arrow, a sign and a colour, never the colour
// alone) and, when given, its trend as a sparkline.

import { ArrowDownRight01Icon, ArrowUpRight01Icon, MinusSignIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Sparkline } from "./data-line-chart";

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

export interface KpiRowProps {
  items: ReadonlyArray<Kpi>;
  /** Writes a delta; default a signed percent, `+12%`. */
  formatDelta?: (delta: number) => string;
  className?: string;
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

/** Key figures side by side: label, figure, change and trend. Wraps to fit, cells stay glued. */
export function KpiRow({ items, formatDelta = percent, className }: KpiRowProps) {
  return (
    <dl className={cx("fg-kpis", className)}>
      {items.map((item) => (
        <div key={item.label} className="fg-kpi">
          <dt className="fg-kpi-label">{item.label}</dt>
          <dd className="fg-kpi-value">{item.value}</dd>
          {item.delta !== undefined || item.hint || item.trend?.length ? (
            <dd className="fg-kpi-foot">
              <span className="fg-kpi-change">
                {item.delta !== undefined ? (
                  <Delta delta={item.delta} better={item.better} format={formatDelta} />
                ) : null}
                {item.hint ? <span className="fg-kpi-hint">{item.hint}</span> : null}
              </span>
              {item.trend?.length ? (
                <Sparkline values={item.trend} width={64} height={16} className="fg-kpi-spark" />
              ) : null}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
