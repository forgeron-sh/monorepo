// A waterfall: how a starting figure becomes the final one, step by step. Totals stand on zero,
// each step floats from the running total, a dotted rule carries the level to the next bar. A
// rise is scan lines, a fall is a checker, and every step writes its signed change above it.

import { useId, type HTMLAttributes } from "react";
import { cx } from "../cx";
import {
  dashboardSigned,
  dashboardWaterfall,
  dashboardWaterfallFloor,
  type DashboardWaterfallBar,
} from "./model";
import { ChartTable, TONE_VARS, useChartReader, useStateColors } from "./parts";

export interface WaterfallStep {
  label: string;
  /** The change: positive adds, negative takes away. Ignored for a label listed in `totals`. */
  value: number;
}

export interface WaterfallProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  /** Where it starts: `{ label: "Oct MRR", value: 48200 }`. */
  start: { label: string; value: number };
  /** The changes, in order. */
  steps: ReadonlyArray<WaterfallStep>;
  /** The label of the final total; `false` leaves it out. Default `End`. */
  end?: string | false;
  /** Labels of `steps` that are subtotals: the running total so far, standing on zero. */
  totals?: ReadonlyArray<string>;
  /** Writes a value. */
  format?: (value: number) => string;
  /** Which way is good news: `down` for costs, so a rise is drawn as the bad tone. Default `up`. */
  better?: "up" | "down";
  /** Height of the plot in px. Default 200. */
  height?: number;
  /**
   * The scale starts at zero even when the changes are small next to the totals. Default false:
   * then it starts under the lowest level, and the totals carry a break mark at their foot.
   */
  zero?: boolean;
}

const signed = (format: (v: number) => string, v: number) => dashboardSigned(format, v);

/** In a `ChartContainer`, the config keys `good`, `bad` and `total` colour the bars. */
const VARS = { ...TONE_VARS, total: "--fg-tone-total" };

/** From a start to an end through its changes; the pointer or the arrows read one bar. */
export function Waterfall({
  title,
  start,
  steps,
  end = "End",
  totals,
  format = String,
  better = "up",
  height = 200,
  zero = false,
  className,
  style,
  ...rest
}: WaterfallProps) {
  const id = useId();
  const colors = useStateColors(VARS);
  const { bars, min, max, total } = dashboardWaterfall(start, steps, { end, totals });
  const floor = zero ? min : dashboardWaterfallFloor(bars, max);
  const span = max - floor || 1;
  const pct = (v: number) => ((max - Math.max(floor, v)) / span) * 100;
  const word = (b: DashboardWaterfallBar) =>
    b.kind === "total" ? format(b.value) : signed(format, b.value);
  const tone = (b: DashboardWaterfallBar) =>
    b.kind === "total" ? "total" : b.kind === better ? "good" : "bad";

  const reader = useChartReader(bars.length, (at) => {
    const b = bars[at];
    if (!b) return null;
    const t = tone(b);
    return {
      label: b.label,
      payload: [
        {
          dataKey: b.kind,
          name: b.kind === "total" ? "Total" : "Change",
          value: word(b),
          color: colors.color(
            t,
            t === "good" ? "var(--success)" : t === "bad" ? "var(--danger)" : "var(--ink-muted)",
          ),
          payload: b,
        },
        ...(b.kind !== "total"
          ? [{ dataKey: "running", name: "Running total", value: format(b.to) }]
          : []),
      ],
    };
  });
  const active = reader.active;
  const bar = active === null ? undefined : bars[active];

  return (
    <figure className={cx("fg-fall", className)} style={{ ...colors.style, ...style }} {...rest}>
      <div className="fg-line-head">
        <figcaption className="fg-line-title" id={`${id}-title`}>
          {title}
        </figcaption>
        <output className="fg-line-readout" aria-live="polite">
          {bar ? (
            <>
              <span className="fg-line-readout-label">{bar.label}</span>
              <b>{word(bar)}</b>
              {bar.kind !== "total" ? (
                <span className="fg-line-readout-label">→ {format(bar.to)}</span>
              ) : null}
            </>
          ) : (
            <>
              <span className="fg-line-readout-label">
                {start.label} → {end === false ? "now" : end}
              </span>
              <b>{signed(format, Number((total - start.value).toPrecision(12)))}</b>
            </>
          )}
        </output>
      </div>
      <div
        className="fg-fall-plot"
        style={{ height, gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}
        tabIndex={bars.length ? 0 : undefined}
        role="group"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-hint`}
        onKeyDown={reader.onKeyDown()}
        onPointerLeave={reader.leave}
        onBlur={reader.leave}
      >
        <span
          className="fg-fall-zero"
          style={{ top: `${pct(Math.max(0, floor))}%` }}
          aria-hidden="true"
        />
        {bars.map((b, i) => {
          const top = pct(Math.max(b.from, b.to));
          const size = pct(Math.min(b.from, b.to)) - top;
          const cut = Math.min(b.from, b.to) < floor;
          return (
            <div
              key={`${b.label}-${i}`}
              className={cx("fg-fall-col", active === i && "fg-fall-on")}
              onPointerMove={(event) => reader.move(i, event)}
              aria-hidden="true"
            >
              <span
                className={cx(
                  "fg-fall-bar",
                  `fg-fall-${b.kind}`,
                  `fg-fall-${tone(b)}`,
                  cut && "fg-fall-cut",
                )}
                style={{ top: `${top}%`, height: `max(2px, ${size}%)` }}
              />
              <span className="fg-fall-value" style={{ top: `${top}%` }}>
                {word(b)}
              </span>
              {i < bars.length - 1 ? (
                <span className="fg-fall-link" style={{ top: `${pct(b.to)}%` }} />
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="fg-visually-hidden" id={`${id}-hint`}>
        Left and right arrows read one bar.
      </p>
      <div
        className="fg-fall-axis"
        style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {bars.map((b, i) => (
          <span key={`${b.label}-${i}`} className={cx(b.kind === "total" && "fg-fall-axis-total")}>
            {b.label}
          </span>
        ))}
      </div>
      {floor > 0 ? (
        <p className="fg-fall-note" aria-hidden="true">
          Scale from {format(floor)}: the totals are cut.
        </p>
      ) : null}
      <ChartTable
        caption={`${title}${floor > 0 ? `, scale from ${format(floor)}` : ""}`}
        columns={["Step", "Change", "Total"]}
        rows={bars.map((b, i) => ({
          key: `${b.label}-${i}`,
          head: b.label,
          cells: [b.kind === "total" ? "" : word(b), format(b.to)],
        }))}
      />
    </figure>
  );
}
