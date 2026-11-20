// A gauge in pixels: a half ring, filled up to the value, a mark at the target, and the state said
// in words (Behind, Close, On target) beside the figure, so tone is never the only signal.

import { useId, useMemo, type HTMLAttributes } from "react";
import { cx } from "../cx";
import {
  dashboardFormatPercent,
  dashboardGaugeState,
  dashboardGaugeThresholds,
  dashboardRing,
  type GaugeThreshold,
} from "./model";
import { TONE_VARS, useReport, useSeries, useStateColors } from "./parts";
import { PX } from "./scale";

export interface GaugeProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the gauge. */
  title: string;
  /** Where it stands now. */
  value: number;
  /** What it should reach. */
  target: number;
  /** The scale, from `min` (default 0) to `max` (default a quarter above the larger of value and target). */
  min?: number;
  max?: number;
  /**
   * The states, from the value at which each starts. Default: under 70% of the target "Behind", up
   * to the target "Close", then "On target".
   */
  thresholds?: ReadonlyArray<GaugeThreshold>;
  /** Writes a value. */
  format?: (value: number) => string;
  /** Width in px. Default 200. */
  size?: number;
  /** Thickness of the arc in chart pixels. Default 10. */
  thickness?: number;
  /**
   * The series in a `ChartContainer` config that colours the arc and names it in the tooltip. Without
   * it, the config keys `good`, `warn` and `bad` colour the states; the state is a word either way.
   */
  dataKey?: string;
}

const TONES = { good: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" } as const;

/** A value against a target on a half ring; the state is a word, the target a mark, the figures text. */
export function Gauge({
  title,
  value,
  target,
  min = 0,
  max,
  thresholds,
  format = String,
  size = 200,
  thickness = 10,
  dataKey,
  className,
  style,
  ...rest
}: GaugeProps) {
  const id = useId();
  const colors = useStateColors(TONE_VARS);
  const report = useReport();
  const steps = thresholds ?? dashboardGaugeThresholds(target);
  const state = dashboardGaugeState(value, {
    target,
    min,
    thresholds: steps,
    ...(max !== undefined ? { max } : {}),
  });
  const width = Math.max(32, Math.round(size / PX));
  const cells = useMemo(
    () => dashboardRing(width, Math.min(thickness, width / 2), "half"),
    [width, thickness],
  );
  const height = Math.floor(width / 2) + 1;
  const arc = Math.PI * (width / 2 - thickness / 2);
  const tick = 1.5 / Math.max(1, arc);
  const dots = (d: string, x: number, y: number) => `${d}M${x} ${y}h1v1h-1z`;
  let track = "";
  let fill = "";
  let mark = "";
  for (const c of cells) {
    if (Math.abs(c.t - state.targetAt) <= tick) mark = dots(mark, c.x, c.y);
    else if (c.t <= state.fraction) fill = dots(fill, c.x, c.y);
    else if ((c.x + c.y) % 2 === 1) track = dots(track, c.x, c.y);
  }
  const series = useSeries(dataKey, {
    fallback: colors.color(state.tone, TONES[state.tone]),
    name: title,
  });
  const text = `${format(value)} of ${format(target)}, ${dashboardFormatPercent(state.ofTarget)} of the target: ${state.label}`;
  const ordered = [...steps].sort((a, b) => a.at - b.at);
  return (
    <figure
      className={cx("fg-dash-gauge", className)}
      style={{ ...colors.style, ...style }}
      {...rest}
    >
      <figcaption className="fg-dash-title" id={`${id}-title`}>
        {title}
      </figcaption>
      <div
        className="fg-dash-gauge-body"
        role="meter"
        aria-labelledby={`${id}-title`}
        aria-valuemin={min}
        aria-valuemax={max ?? Math.max(target, value) * 1.25}
        aria-valuenow={value}
        aria-valuetext={text}
        style={{ width: width * PX }}
        {...report(() => ({
          label: title,
          payload: [
            series.line(`${format(value)} · ${state.label}`, { value, target }),
            { dataKey: "target", name: "Target", value: format(target), color: "var(--ink)" },
          ],
        }))}
      >
        <svg
          width={width * PX}
          height={height * PX}
          viewBox={`0 0 ${width} ${height}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <path d={track} className="fg-dash-gauge-track" />
          <path
            d={fill}
            className={cx("fg-dash-gauge-fill", `fg-dash-tone-${state.tone}`)}
            style={series.own ? { fill: series.color } : undefined}
          />
          <path d={mark} className="fg-dash-gauge-mark" />
        </svg>
        <span className="fg-dash-gauge-read">
          <b>{format(value)}</b>
          <small>
            of {format(target)} · {dashboardFormatPercent(state.ofTarget)}
          </small>
          <span className={cx("fg-dash-state", `fg-dash-tone-${state.tone}`)}>{state.label}</span>
        </span>
      </div>
      <ul className="fg-dash-gauge-steps" aria-label={`${title}: states`}>
        {ordered.map((step, i) => {
          const next = ordered[i + 1];
          const range = Number.isFinite(step.at)
            ? next
              ? `${format(step.at)} to ${format(next.at)}`
              : `${format(step.at)} and over`
            : next
              ? `under ${format(next.at)}`
              : "any";
          return (
            <li
              key={`${step.label}-${i}`}
              aria-current={step.label === state.label ? "true" : undefined}
              className={cx(step.label === state.label && "fg-dash-current")}
            >
              <span>{step.label}</span>
              <span className="fg-dash-legend-value">{range}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
