// Annotations on a chart over time: a numbered flag over a point and a dotted rule down the plot,
// and a key under the axis that says what happened. What explains a peak or a dip ("v2.3
// deployed", "Odoo unreachable") stays next to it, in words.

import type { CSSProperties } from "react";

/** Something that happened at a point of a chart over time. */
export interface ChartMarker {
  /** The label of the point it belongs to: `W46`, `Nov 12`. */
  at: string;
  /** What happened, short: `v2.3 deployed`. */
  label: string;
}

/** The markers that land on a point, with their number (1-based, in the order given) and slot. */
export function placeMarkers(
  markers: ReadonlyArray<ChartMarker> | undefined,
  labels: ReadonlyArray<string>,
): Array<ChartMarker & { n: number; index: number }> {
  if (!markers?.length) return [];
  return markers
    .map((m, i) => ({ ...m, n: i + 1, index: labels.indexOf(m.at) }))
    .filter((m) => m.index >= 0);
}

/** The labels of the markers on point `index`, joined: for a readout. */
export const markersAt = (
  placed: ReadonlyArray<{ index: number; label: string }>,
  index: number,
): string =>
  placed
    .filter((m) => m.index === index)
    .map((m) => m.label)
    .join(" · ");

/** The flags and rules, over a plot of `count` slots (its parent is `position: relative`). */
export function MarkerRules({
  placed,
  count,
  active,
}: {
  placed: ReadonlyArray<{ n: number; index: number; label: string }>;
  count: number;
  /** The slot read now: its flags light up. */
  active?: number | null;
}) {
  if (!placed.length) return null;
  return (
    <>
      {placed.map((m) => (
        <span
          key={m.n}
          className={`fg-mark${active === m.index ? " fg-mark-on" : ""}`}
          style={
            { "--fg-mark-x": `${((m.index + 0.5) / Math.max(1, count)) * 100}%` } as CSSProperties
          }
          aria-hidden="true"
        >
          <span className="fg-mark-tag">{m.n}</span>
        </span>
      ))}
    </>
  );
}

/** The key of the markers: number, point and what happened. */
export function MarkerKey({
  placed,
  title,
}: {
  placed: ReadonlyArray<{ n: number; at: string; label: string }>;
  title: string;
}) {
  if (!placed.length) return null;
  return (
    <ol className="fg-mark-key" aria-label={`${title}: events`}>
      {placed.map((m) => (
        <li key={m.n}>
          <span className="fg-mark-tag" aria-hidden="true">
            {m.n}
          </span>
          <span className="fg-mark-at">{m.at}</span>
          {m.label}
        </li>
      ))}
    </ol>
  );
}
