// The maths of `Resizable`: a layout is the size of each panel, in percent (they sum to 100) or, in
// the px mode, in px (they sum to the measured space, the last panel taking what the others leave).
// A drag or a key moves a handle: the two panels around it exchange space, the others do not move.

export interface PanelLimits {
  min: number;
  max: number;
  collapsible: boolean;
  /** The size the panel has when collapsed. Default 0. */
  collapsedSize: number;
}

const EPS = 1e-6;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Whether a size is the collapsed size of a collapsible panel. */
export function isCollapsed(limits: PanelLimits, size: number): boolean {
  return limits.collapsible && Math.abs(size - limits.collapsedSize) < EPS;
}

/** A size brought inside the limits; a collapsible panel under half way to its minimum collapses. */
function clampPanel(limits: PanelLimits, size: number): number {
  if (limits.collapsible && size < limits.min) {
    return size <= (limits.collapsedSize + limits.min) / 2 ? limits.collapsedSize : limits.min;
  }
  if (isCollapsed(limits, size)) return size;
  return clamp(size, limits.min, limits.max);
}

/**
 * The first layout: the sizes that were asked for, the panels without one sharing what is left,
 * then fitted to `total`.
 */
export function initialLayout(
  sizes: ReadonlyArray<number | undefined>,
  limits: ReadonlyArray<PanelLimits>,
  total: number,
): number[] {
  const asked = sizes.reduce<number>((sum, size) => sum + (size ?? 0), 0);
  const free = sizes.filter((size) => size === undefined).length;
  const share = free > 0 ? Math.max(0, total - asked) / free : 0;
  return fitLayout(
    sizes.map((size) => size ?? share),
    limits,
    total,
  );
}

/** A layout that sums to `total` with every panel inside its limits, as near as it can be. */
export function fitLayout(
  layout: ReadonlyArray<number>,
  limits: ReadonlyArray<PanelLimits>,
  total: number,
): number[] {
  const sum = layout.reduce((a, b) => a + b, 0);
  const scale = sum > 0 && Math.abs(sum - total) > EPS ? total / sum : 1;
  const out = layout.map((size, i) => clampPanel(limits[i]!, size * scale));
  let rest = total - out.reduce((a, b) => a + b, 0);
  for (let pass = 0; pass < out.length && Math.abs(rest) > EPS; pass += 1) {
    for (let i = 0; i < out.length && Math.abs(rest) > EPS; i += 1) {
      const l = limits[i]!;
      if (isCollapsed(l, out[i]!)) continue;
      const room = rest > 0 ? l.max - out[i]! : l.min - out[i]!;
      const move = rest > 0 ? Math.min(rest, room) : Math.max(rest, room);
      out[i] = out[i]! + move;
      rest -= move;
    }
  }
  return out;
}

/**
 * The px mode: every panel but the last keeps its size (inside its limits), the last takes what is
 * left; when it would drop under its minimum the panels before it give way, from the end.
 */
export function fitRemainder(
  layout: ReadonlyArray<number>,
  limits: ReadonlyArray<PanelLimits>,
  total: number,
): number[] {
  const n = layout.length;
  if (n === 0) return [];
  const out = layout.map((size, i) => (i === n - 1 ? 0 : clampPanel(limits[i]!, size)));
  const others = () => out.reduce((a, b) => a + b, 0);
  let need = Math.max(0, limits[n - 1]!.min - (total - others()));
  for (let i = n - 2; i >= 0 && need > EPS; i -= 1) {
    const l = limits[i]!;
    const take = Math.min(need, Math.max(0, out[i]! - (isCollapsed(l, out[i]!) ? out[i]! : l.min)));
    out[i] = out[i]! - take;
    need -= take;
  }
  out[n - 1] = total - others();
  return out;
}

/** What the panel `i` (the one before handle `i`) can be: the bounds the pair leaves it. */
export function pairBounds(
  layout: ReadonlyArray<number>,
  limits: ReadonlyArray<PanelLimits>,
  i: number,
): { lo: number; hi: number } {
  const a = limits[i]!;
  const b = limits[i + 1]!;
  const s = layout[i]! + layout[i + 1]!;
  return { lo: Math.max(a.min, s - b.max), hi: Math.min(a.max, s - b.min) };
}

export interface ResizeOptions {
  /** A collapsible panel dragged under half way to its minimum collapses (and comes back above). */
  snap?: boolean;
  round?: (n: number) => number;
}

/**
 * Puts panel `i` at `target` (it may be `-Infinity` or `Infinity` for the limits), the panel after
 * it taking the difference. Returns the same array when nothing can move.
 */
export function resizePair(
  layout: ReadonlyArray<number>,
  limits: ReadonlyArray<PanelLimits>,
  i: number,
  target: number,
  { snap = false, round = (n) => n }: ResizeOptions = {},
): number[] {
  const a = limits[i];
  const b = limits[i + 1];
  if (!a || !b || layout[i] === undefined || layout[i + 1] === undefined) return [...layout];
  const s = layout[i]! + layout[i + 1]!;
  if (!Number.isFinite(s)) return [...layout];
  const { lo, hi } = pairBounds(layout, limits, i);
  if (lo > hi) return [...layout];
  let next: number;
  if (
    snap &&
    a.collapsible &&
    target <= a.collapsedSize + (lo - a.collapsedSize) / 2 &&
    s - a.collapsedSize <= b.max
  ) {
    next = a.collapsedSize;
  } else if (
    snap &&
    b.collapsible &&
    s - target <= b.collapsedSize + (s - hi - b.collapsedSize) / 2 &&
    s - b.collapsedSize <= a.max
  ) {
    next = s - b.collapsedSize;
  } else {
    next = round(clamp(target, lo, hi));
    next = clamp(next, lo, hi);
  }
  const out = [...layout];
  out[i] = next;
  out[i + 1] = s - next;
  return out;
}

const inRange = (l: PanelLimits, size: number) =>
  isCollapsed(l, size) || (size >= l.min - EPS && size <= l.max + EPS);

/**
 * Enter on handle `h`: expands the collapsed panel around it (back to the size it had, `memory`,
 * or its minimum), else collapses the first collapsible one. Returns `null` when there is nothing
 * to do.
 */
export function toggleCollapse(
  layout: ReadonlyArray<number>,
  limits: ReadonlyArray<PanelLimits>,
  h: number,
  memory: ReadonlyMap<number, number>,
): number[] | null {
  const s = layout[h]! + layout[h + 1]!;
  if (!Number.isFinite(s)) return null;
  const place = (p: number, size: number): number[] | null => {
    const first = p === h ? size : s - size;
    const out = [...layout];
    out[h] = first;
    out[h + 1] = s - first;
    return inRange(limits[h]!, first) && inRange(limits[h + 1]!, s - first) ? out : null;
  };
  for (const p of [h, h + 1]) {
    const l = limits[p]!;
    if (!isCollapsed(l, layout[p]!)) continue;
    return place(p, memory.get(p) ?? l.min) ?? place(p, l.min);
  }
  for (const p of [h, h + 1]) {
    if (limits[p]!.collapsible) return place(p, limits[p]!.collapsedSize);
  }
  return null;
}

/** Whether two layouts are the same, to the rounding noise; `skipLast` ignores the remainder panel. */
export function sameLayout(
  a: ReadonlyArray<number>,
  b: ReadonlyArray<number>,
  skipLast = false,
): boolean {
  if (a.length !== b.length) return false;
  const end = skipLast ? a.length - 1 : a.length;
  for (let i = 0; i < end; i += 1) if (Math.abs(a[i]! - b[i]!) > EPS) return false;
  return true;
}
