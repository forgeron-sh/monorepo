// A history of states as a strip of cells, one per period (a day, an hour, a run): the shape of an
// uptime page. The worse the state, the taller and heavier its pixels: a low band when all is well, a
// checker when degraded, solid when down, so the strip reads without colour. Arrows walk it.

import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../cx";
import { MarkerKey, MarkerRules, markersAt, placeMarkers, type ChartMarker } from "./markers";
import { dashboardFormatPercent, dashboardStatusSummary, type DashboardStatus } from "./model";
import { ChartTable, useChartReader, useStateColors } from "./parts";

export interface StatusStripItem {
  /** Written in the readout and the table: `Nov 12`, `14:00`, `Run 482`. */
  label: string;
  status: DashboardStatus;
  /** What happened, in the readout: `Webhook timeouts, 14 min`. */
  note?: string;
}

export interface StatusStripProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children" | "summary"
> {
  /** Names the strip; also its caption. */
  title: string;
  /** Oldest first. */
  items: ReadonlyArray<StatusStripItem>;
  /** The words of the states. Default: Operational, Degraded, Down, No data. */
  labels?: Partial<Record<DashboardStatus, string>>;
  /** At the right of the title; default the share of periods up, `99.2% up`. */
  summary?: ReactNode;
  /** Under the strip, at each end: default the first and last labels. */
  from?: ReactNode;
  to?: ReactNode;
  /** Height of the strip in px. Default 32. */
  height?: number;
  /** Events at periods of the strip (a deploy, a migration): a numbered flag, a key under it. */
  markers?: ReadonlyArray<ChartMarker>;
}

/** In a `ChartContainer`, the config keys `ok`, `degraded`, `down` and `none` colour the states. */
const STATE_VARS: Record<DashboardStatus, string> = {
  ok: "--fg-strip-ok",
  degraded: "--fg-strip-degraded",
  down: "--fg-strip-down",
  none: "--fg-strip-none",
};

const WORDS: Record<DashboardStatus, string> = {
  ok: "Operational",
  degraded: "Degraded",
  down: "Down",
  none: "No data",
};

/** States over time as a strip of cells; the pointer or the arrows read one in the header. */
export function StatusStrip({
  title,
  items,
  labels,
  summary,
  from,
  to,
  height = 32,
  markers,
  className,
  style,
  ...rest
}: StatusStripProps) {
  const id = useId();
  const colors = useStateColors(STATE_VARS);
  const words = { ...WORDS, ...labels };
  const totals = dashboardStatusSummary(items);
  const reader = useChartReader(items.length, (at) => {
    const read = items[at];
    return read
      ? {
          label: read.label,
          payload: [
            {
              dataKey: read.status,
              name: words[read.status],
              value: read.note,
              color: colors.color(read.status, `var(--fg-strip-${read.status})`),
              payload: read,
            },
          ],
        }
      : null;
  });
  const active = reader.active;
  const item = active === null ? undefined : items[active];
  const placed = placeMarkers(
    markers,
    items.map((i) => i.label),
  );
  const states = (["ok", "degraded", "down"] as const).filter((s) => totals[s] > 0);

  return (
    <figure className={cx("fg-strip", className)} style={{ ...colors.style, ...style }} {...rest}>
      <div className="fg-line-head">
        <figcaption className="fg-line-title" id={`${id}-title`}>
          {title}
        </figcaption>
        <output className="fg-line-readout" aria-live="polite">
          {item ? (
            <>
              <span className="fg-line-readout-label">{item.label}</span>
              <b className={`fg-strip-word fg-strip-word-${item.status}`}>{words[item.status]}</b>
              {item.note ? <span className="fg-line-readout-label">{item.note}</span> : null}
              {active !== null && markersAt(placed, active) ? (
                <span className="fg-mark-read">{markersAt(placed, active)}</span>
              ) : null}
            </>
          ) : (
            (summary ?? (
              <b>{dashboardFormatPercent(totals.up, { digits: totals.up < 1 ? 1 : 0 })} up</b>
            ))
          )}
        </output>
      </div>
      <div className={cx("fg-strip-plot", placed.length > 0 && "fg-strip-flagged")}>
        <div
          className="fg-strip-cells"
          style={{ height, gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)` }}
          tabIndex={items.length ? 0 : undefined}
          role="group"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-hint`}
          onKeyDown={reader.onKeyDown(active ?? items.length)}
          onPointerMove={reader.onPointerMove}
          onPointerLeave={reader.leave}
          onBlur={reader.leave}
        >
          {items.map((it, i) => (
            <span
              key={`${it.label}-${i}`}
              className={cx(
                "fg-strip-cell",
                `fg-strip-${it.status}`,
                active === i && "fg-strip-active",
              )}
              aria-hidden="true"
            />
          ))}
        </div>
        <MarkerRules placed={placed} count={items.length} active={active} />
      </div>
      <p className="fg-visually-hidden" id={`${id}-hint`}>
        Left and right arrows read one period.
      </p>
      <div className="fg-strip-foot">
        <span>{from ?? items[0]?.label}</span>
        <ul className="fg-strip-key" aria-label={`${title}: key`}>
          {states.map((s) => (
            <li key={s}>
              <span className={cx("fg-strip-swatch", `fg-strip-${s}`)} aria-hidden="true" />
              {words[s]} <b>{totals[s]}</b>
            </li>
          ))}
        </ul>
        <span>{to ?? items[items.length - 1]?.label}</span>
      </div>
      <MarkerKey placed={placed} title={title} />
      <ChartTable
        caption={title}
        columns={["Period", "State", "Note"]}
        rows={items.map((it, i) => ({
          key: `${it.label}-${i}`,
          head: it.label,
          cells: [words[it.status], it.note ?? ""],
        }))}
      />
    </figure>
  );
}
