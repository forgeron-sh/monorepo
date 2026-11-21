// The pure side of the event grid: minutes of a day, snapping, and the columns of overlapping
// events. Dates are `YYYY-MM-DD`, times `HH:mm`, neither with a zone. Nothing here touches the
// clock, React or the DOM.

const pad = (n: number) => String(n).padStart(2, "0");

const DAY_MINUTES = 1440;

/** `HH:mm` to minutes since midnight (`24:00` is 1440), or null for anything else. */
export function toMinutes(time: string | null | undefined): number | null {
  if (time === "24:00") return DAY_MINUTES;
  const hit = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");
  if (!hit) return null;
  const h = Number(hit[1]);
  const m = Number(hit[2]);
  return h < 24 && m < 60 ? h * 60 + m : null;
}

/** Minutes since midnight to `HH:mm`, kept between `00:00` and `24:00`. */
export function fromMinutes(total: number): string {
  const t = Math.max(0, Math.min(DAY_MINUTES, Math.round(total)));
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}

/** Minutes brought to the nearest step (15 by default); `floor` and `ceil` pick a side. */
export function snapMinutes(
  minutes: number,
  step = 15,
  mode: "round" | "floor" | "ceil" = "round",
): number {
  const s = Math.max(1, Math.floor(step));
  const f = mode === "floor" ? Math.floor : mode === "ceil" ? Math.ceil : Math.round;
  return f(minutes / s) * s;
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/* ------------------------------------------------------------------ overlap columns */

export interface Placed<T> {
  item: T;
  start: number;
  end: number;
  /** The column the item takes among those that overlap it, from 0. */
  column: number;
  /** How many columns the cluster of overlapping items needs. */
  columns: number;
}

/**
 * Lays out events of one day side by side: items that overlap, directly or through others, share
 * the width of their cluster; an item takes the first column that is free when it starts.
 */
export function layoutOverlaps<T>(
  items: ReadonlyArray<T>,
  range: (item: T) => { start: number; end: number },
): Placed<T>[] {
  const sorted = items
    .map((item) => {
      const r = range(item);
      return { item, start: r.start, end: Math.max(r.end, r.start + 1) };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let ends: number[] = [];
  let clusterEnd = -Infinity;
  const close = () => {
    for (const p of cluster) p.columns = ends.length;
    cluster = [];
    ends = [];
  };
  for (const s of sorted) {
    if (s.start >= clusterEnd) close();
    let column = ends.findIndex((e) => e <= s.start);
    if (column === -1) {
      column = ends.length;
      ends.push(s.end);
    } else ends[column] = s.end;
    const placed: Placed<T> = { ...s, column, columns: 1 };
    cluster.push(placed);
    out.push(placed);
    clusterEnd = Math.max(clusterEnd === -Infinity ? s.end : clusterEnd, s.end);
  }
  close();
  return out;
}
