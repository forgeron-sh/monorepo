// A donut in pixels: a ring drawn in whole pixels, each slice filled with its own pattern, a key
// that names every slice with its value and share. Never an anti-aliased arc.

import { useId, useMemo, useState, type ReactNode } from "react";
import { cx } from "../cx";
import { dashboardFormatPercent, dashboardPercent, dashboardRing } from "./dashboard-model";
import { DASH_PX, DashLegend, dashFill, dashRingPath, dashSeriesIndexes } from "./dashboard-parts";

export interface DonutItem {
  label: string;
  value: number;
}

export interface DonutProps {
  /** Names the chart; also its caption. */
  title: string;
  items: ReadonlyArray<DonutItem>;
  /** Writes a value. */
  format?: (value: number) => string;
  /** The label of the slice drawn in ember; the others share the greys. */
  highlight?: string;
  /** Width of the ring in px. Default 160. */
  size?: number;
  /** Thickness of the ring in chart pixels (two px each). Default 12. */
  thickness?: number;
  /** In the hole: the total by default. */
  center?: ReactNode;
  className?: string;
}

/**
 * Slices of a whole. The key beside the ring gives each slice its swatch, value and share; a
 * button in the key spotlights its slice. A table carries the same numbers for assistive
 * technology.
 */
export function Donut({
  title,
  items,
  format = String,
  highlight,
  size = 160,
  thickness = 12,
  center,
  className,
}: DonutProps) {
  const id = useId();
  const [spot, setSpot] = useState<string | null>(null);
  const diameter = Math.max(16, Math.round(size / DASH_PX));
  const cells = useMemo(
    () => dashboardRing(diameter, Math.min(thickness, diameter / 2)),
    [diameter, thickness],
  );
  const shown = items.filter((i) => i.value > 0);
  const total = items.reduce((sum, i) => sum + Math.max(0, i.value), 0);
  const ks = dashSeriesIndexes(
    items.map((i) => i.label),
    highlight,
  );
  const paths = useMemo(() => {
    const shares = items.map((item) => dashboardPercent(Math.max(0, item.value), total));
    return items.map((item, i) => {
      const from = shares.slice(0, i).reduce((sum, n) => sum + n, 0);
      const to = from + shares[i]!;
      const own = cells.filter((c) => c.t >= from && c.t < to);
      return { item, k: ks[i]!, d: dashRingPath(own, ks[i]!) };
    });
  }, [items, cells, total, ks]);
  return (
    <figure className={cx("fg-dash-donut", className)}>
      <figcaption className="fg-dash-title" id={`${id}-title`}>
        {title}
      </figcaption>
      <div className="fg-dash-donut-body">
        <div
          className="fg-dash-ring"
          style={{ width: diameter * DASH_PX, height: diameter * DASH_PX }}
        >
          <svg
            width={diameter * DASH_PX}
            height={diameter * DASH_PX}
            viewBox={`0 0 ${diameter} ${diameter}`}
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            {paths.map(({ item, k, d }) => (
              <path
                key={item.label}
                d={d}
                className={cx(dashFill(k), spot !== null && spot !== item.label && "fg-dash-dim")}
              />
            ))}
          </svg>
          <span className="fg-dash-ring-center">
            {center ?? (
              <>
                <b>{format(total)}</b>
                <small>Total</small>
              </>
            )}
          </span>
        </div>
        <DashLegend
          label={`${title}: key`}
          entries={items.map((item, i) => ({
            key: item.label,
            label: item.label,
            k: ks[i]!,
            value: format(item.value),
            share: dashboardFormatPercent(dashboardPercent(item.value, total)),
          }))}
          off={spot === null ? [] : [spot]}
          pressedMeans="spotlight"
          onToggle={(key) => setSpot((current) => (current === key ? null : key))}
        />
      </div>
      <table className="fg-visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Slice</th>
            <th scope="col">Value</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {(shown.length ? items : []).map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{format(item.value)}</td>
              <td>{dashboardFormatPercent(dashboardPercent(item.value, total))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
