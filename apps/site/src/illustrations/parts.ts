/**
 * Mechanical parts for the isometric scenes, as Blueprint blocks: wheels in any plane, arms
 * solved by two-link inverse kinematics, fans, racks, cable trays with packets, crank pistons and
 * pendulums. Every part is a pure function of its inputs and pushes its blocks into `out`.
 */
import type { Block, Ink, Vec3 } from "@forgeron/blueprint";

export type Out = Block[];

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);

export const X: Vec3 = [1, 0, 0];
export const Y: Vec3 = [0, 1, 0];
export const Z: Vec3 = [0, 0, 1];

export function seg(out: Out, a: Vec3, b: Vec3, ink: Ink = "ink", dash = 0): void {
  out.push(dash ? { kind: "line", a, b, ink, dash } : { kind: "line", a, b, ink });
}

export function dot(out: Out, at: Vec3, ink: Ink = "ink", size = 2): void {
  out.push({ kind: "dot", at, ink, size });
}

export function polyline(out: Out, pts: readonly Vec3[], ink: Ink = "ink", dash = 0): void {
  for (let k = 0; k + 1 < pts.length; k++) seg(out, pts[k]!, pts[k + 1]!, ink, dash);
}

export interface WheelOptions {
  teeth?: number;
  spokes?: number;
  hub?: number;
  ink?: Ink;
  /** Teeth length, in units. */
  tooth?: number;
}

/** A wheel of radius `r` in the plane spanned by `e1` and `e2`, turned by `angle`. */
export function wheel(
  out: Out,
  c: Vec3,
  r: number,
  e1: Vec3,
  e2: Vec3,
  angle: number,
  o: WheelOptions = {},
): void {
  const P = (rad: number, a: number) =>
    add(c, add(mul(e1, Math.cos(a) * rad), mul(e2, Math.sin(a) * rad)));
  const ink = o.ink ?? "ink";
  const n = Math.max(14, Math.round(r * 7));
  for (let k = 0; k < n; k++)
    seg(out, P(r, (k / n) * Math.PI * 2), P(r, ((k + 1) / n) * Math.PI * 2), ink);
  for (let k = 0; k < (o.teeth ?? 0); k++) {
    const a = angle + (k / o.teeth!) * Math.PI * 2;
    seg(out, P(r, a), P(r + (o.tooth ?? 0.5), a), ink);
  }
  for (let k = 0; k < (o.spokes ?? 0); k++) {
    const a = angle + (k / o.spokes!) * Math.PI * 2;
    seg(out, P(o.hub ?? 0.3, a), P(r, a), "dim");
  }
  if (o.hub)
    for (let k = 0; k < 8; k++)
      seg(out, P(o.hub, (k / 8) * Math.PI * 2), P(o.hub, ((k + 1) / 8) * Math.PI * 2), "dim");
}

/** A point on the wheel's rim at `angle`. */
export const rim = (c: Vec3, r: number, e1: Vec3, e2: Vec3, angle: number): Vec3 =>
  add(c, add(mul(e1, Math.cos(angle) * r), mul(e2, Math.sin(angle) * r)));

export function box(
  out: Out,
  at: Vec3,
  size: Vec3,
  extra: Partial<Extract<Block, { kind: "box" }>> = {},
): void {
  out.push({ kind: "box", at, size, ...extra });
}

/** A box centred on `c` in x and y, standing on `c[2]`. */
export function block(
  out: Out,
  c: Vec3,
  size: Vec3,
  extra: Partial<Extract<Block, { kind: "box" }>> = {},
): void {
  box(out, [c[0] - size[0] / 2, c[1] - size[1] / 2, c[2]], size, extra);
}

/**
 * A two-link arm on a turret at `base`, reaching for `target`: the elbow bends up. Returns the
 * wrist, which is `target` when it is in reach.
 */
export function arm(
  out: Out,
  base: Vec3,
  target: Vec3,
  l1: number,
  l2: number,
  ink: Ink = "ink",
): Vec3 {
  block(out, base, [2.4, 2.4, 1.2], { plate: true });
  const sh: Vec3 = [base[0], base[1], base[2] + 2.4];
  block(out, [base[0], base[1], base[2] + 1.2], [1.2, 1.2, 1.2]);
  const d = sub(target, sh);
  const dist = Math.min(len(d), l1 + l2 - 0.01);
  const dir = mul(d, 1 / (len(d) || 1));
  const wrist = add(sh, mul(dir, dist));
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // Up vector perpendicular to the reach, in the vertical plane that contains it.
  const horiz = Math.hypot(dir[0], dir[1]) || 1;
  const up: Vec3 = [(-dir[0] * dir[2]) / horiz, (-dir[1] * dir[2]) / horiz, horiz];
  const elbow = add(add(sh, mul(dir, a)), mul(up, h));
  seg(out, sh, elbow, ink);
  seg(out, elbow, wrist, ink);
  seg(out, [sh[0] + 0.3, sh[1], sh[2]], [elbow[0] + 0.3, elbow[1], elbow[2]], "dim");
  dot(out, sh, ink, 3);
  dot(out, elbow, ink, 3);
  seg(out, wrist, [wrist[0], wrist[1], wrist[2] - 0.8], ink);
  seg(
    out,
    [wrist[0] - 0.5, wrist[1], wrist[2] - 0.8],
    [wrist[0] + 0.5, wrist[1], wrist[2] - 0.8],
    ink,
  );
  return wrist;
}

/** A ceiling or floor fan: housing ring and four blades, turning in the horizontal plane. */
export function fan(out: Out, c: Vec3, r: number, angle: number): void {
  wheel(out, c, r, X, Y, 0, { ink: "dim" });
  for (let k = 0; k < 4; k++) seg(out, c, rim(c, r * 0.85, X, Y, angle + (k * Math.PI) / 2));
}

/** A server rack with status lights; `seed` varies its height and blink pattern. */
export function rack(
  out: Out,
  x: number,
  y: number,
  t: number,
  seed: number,
  ink: Ink = "accent",
): number {
  const h = 7 + ((seed * 7) % 5);
  box(out, [x - 1.4, y - 1.4, 0], [2.8, 2.8, h], { floors: 1, tone: [0.04, 0.1, 0.22], layer: -1 });
  for (let l = 0; l < 4; l++) {
    const on = Math.floor(t * 2 + seed * 3 + l * 5) % 7 < 2;
    dot(out, [x + 1.4, y + (l % 2 ? 0.6 : -0.6), 1.5 + l * 1.6], on ? ink : "dim", 1);
  }
  return h;
}

/** A cable tray from `a` to `b` with `n` packets riding it at `speed` units per second. */
export function tray(
  out: Out,
  a: Vec3,
  b: Vec3,
  t: number,
  speed: number,
  n: number,
  ink: Ink = "ink",
): void {
  const d = sub(b, a);
  const L = len(d);
  const side: Vec3 = Math.abs(d[0]) > Math.abs(d[1]) ? [0, 0.5, 0] : [0.5, 0, 0];
  seg(out, add(a, side), add(b, side), "dim");
  seg(out, sub(a, side), sub(b, side), "dim");
  for (let k = 0; k < n; k++) {
    const s = (t * speed + (k * L) / n) % L;
    dot(out, add(a, mul(d, s / L)), ink, 2);
  }
}

/**
 * A crank and piston: the crank turns in the vertical plane through `c` along `axis` (X or Y), the
 * piston slides in a cylinder above it.
 */
export function piston(out: Out, c: Vec3, axis: Vec3, angle: number, r = 1.2, rod = 4): void {
  const e1: Vec3 = axis === X ? Y : X;
  wheel(out, c, r + 0.3, e1, Z, angle, { spokes: 2, ink: "dim" });
  const pin = rim(c, r, e1, Z, angle);
  const off = pin[0] - c[0] + pin[1] - c[1];
  const lift = pin[2] + Math.sqrt(Math.max(0, rod * rod - off * off));
  const head: Vec3 = [c[0], c[1], lift];
  seg(out, pin, head);
  dot(out, pin, "ink", 2);
  block(out, head, [1.4, 1.4, 1.2]);
  box(out, [c[0] - 0.9, c[1] - 0.9, c[2] + rod - r - 0.2], [1.8, 1.8, 2 * r + 2.6], {
    ghost: true,
  });
}

/** A pendulum hung at `pivot`, swinging by `angle` in the plane of `e` (X or Y) and Z. */
export function pendulum(
  out: Out,
  pivot: Vec3,
  length: number,
  e: Vec3,
  angle: number,
  ink: Ink = "ink",
): Vec3 {
  const bob = add(pivot, add(mul(e, Math.sin(angle) * length), mul(Z, -Math.cos(angle) * length)));
  seg(out, pivot, bob, "dim");
  block(out, [bob[0], bob[1], bob[2] - 0.5], [1, 1, 1], ink === "accent" ? { accent: true } : {});
  return bob;
}

/** The point at distance `s` along a polyline, and the index of its segment. */
export function along(pts: readonly Vec3[], s: number): Vec3 {
  let rest = s;
  for (let k = 0; k + 1 < pts.length; k++) {
    const d = sub(pts[k + 1]!, pts[k]!);
    const l = len(d);
    if (rest <= l) return add(pts[k]!, mul(d, rest / (l || 1)));
    rest -= l;
  }
  return pts[pts.length - 1]!;
}

export const pathLength = (pts: readonly Vec3[]) => {
  let L = 0;
  for (let k = 0; k + 1 < pts.length; k++) L += len(sub(pts[k + 1]!, pts[k]!));
  return L;
};

/** Smoothstep-like easing with zero velocity at both ends. */
export const glide = (k: number) => {
  const q = Math.min(1, Math.max(0, k));
  return q * q * q * (q * (q * 6 - 15) + 10);
};

export const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => add(a, mul(sub(b, a), k));
