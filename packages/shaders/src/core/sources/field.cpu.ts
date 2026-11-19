import type { CpuSource } from "../contract";
import { FIELD_MODES, type FieldParams } from "./field";

// The GLSL built-ins, in float64.
const fract = (x: number) => x - Math.floor(x);

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const mix = (a: number, b: number, t: number) => a * (1 - t) + b * t;

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

const hash = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

function noise(px: number, py: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return mix(
    mix(hash(ix, iy), hash(ix + 1, iy), ux),
    mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), ux),
    uy,
  );
}

function fbm(px: number, py: number): number {
  let v = 0;
  let a = 0.5;
  let x = px;
  let y = py;
  for (let i = 0; i < 5; i++) {
    v += a * noise(x, y);
    x = x * 2.03 + 1.7;
    y = y * 2.03 + 9.2;
    a *= 0.5;
  }
  return v;
}

const LIGHT = /* @__PURE__ */ (() => {
  const l = Math.hypot(-0.5, 0.7, 0.6);
  return [-0.5 / l, 0.7 / l, 0.6 / l] as const;
})();

/** The value of a field at cell `(cx, cy)` (row 0 at the bottom), the shader's math in float64. */
export function fieldValue(
  mode: number,
  cx: number,
  cy: number,
  px: number,
  res: readonly [number, number],
  time: number,
  mouse: readonly [number, number],
): number {
  const ux = ((cx + 0.5) * px) / res[0];
  const uy = ((cy + 0.5) * px) / res[1];
  const aspect = res[0] / res[1];
  const p0 = ux * aspect;
  const p1 = uy;
  if (mode < 0.5) {
    const q0 = p0 * 2.4;
    const q1 = p1 * 2.4 - time * 0.09;
    const inner = fbm(q0 * 1.4, q1 * 1.4 + time * 0.06);
    const n = fbm(q0 + inner, q1 + inner);
    const heat = smoothstep(0.72, 0, uy) ** 1.6;
    const m = Math.hypot((mouse[0] - ux) * aspect, mouse[1] - uy);
    return n * heat * 1.7 - 0.08 + 0.5 * smoothstep(0.25, 0, m) * n * smoothstep(0.9, 0.3, uy);
  }
  if (mode < 1.5) {
    const d0 = (p0 - aspect * 0.5) / 0.92;
    const d1 = (p1 + 0.08) / 0.92;
    const r2 = d0 * d0 + d1 * d1;
    if (r2 >= 1) return 0;
    const z = Math.sqrt(1 - r2);
    const l = clamp(d0 * LIGHT[0] + d1 * LIGHT[1] + z * LIGHT[2], 0, 1);
    const lon = Math.atan2(d0, z) + time * 0.08;
    const tex = fbm(lon * 3, d1 * 5);
    return l * (0.15 + 1.05 * tex) * smoothstep(1, 0.9, r2) + 0.25 * smoothstep(0.9, 1, r2);
  }
  if (mode < 2.5) {
    const band = Math.floor(cy / 5);
    const edge =
      0.18 + 0.22 * noise(band * 0.83, time * 0.12) + 0.08 * Math.sin(band * 0.4 + time * 0.2);
    const x = ux - edge;
    return x < 0 ? 0 : 1 - smoothstep(0, 0.85 - edge * 0.4, x);
  }
  return fbm(p0 * 2.6 + time * 0.02, p1 * 2.6 - time * 0.015) * 0.6 - 0.12;
}

/** The float64 port (static outputs). */
export const fieldCpu: CpuSource<FieldParams> = {
  type: "field",
  cpu(frame, p, ctx) {
    const { width: w, height: h, data } = frame;
    const mode = FIELD_MODES[p.mode] ?? 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        data[o] = fieldValue(mode, x, h - 1 - y, ctx.px, ctx.res, ctx.time, ctx.mouse);
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
