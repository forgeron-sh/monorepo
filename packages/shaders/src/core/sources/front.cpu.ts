import type { CpuSource } from "../contract";
import { type FrontParams, lobeAt } from "./front";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (q: number) => q * q * (3 - 2 * q);
const round = (v: number) => Math.floor(v + 0.5);

export const frontCpu: CpuSource<FrontParams> = {
  type: "front",
  cpu(frame, p, ctx) {
    const { width: W, height: H, data } = frame;
    const pr = p.driven
      ? (ctx.progress ?? 0)
      : p.cycle > 0
        ? clamp((ctx.time % (p.cycle + p.hold)) / p.cycle)
        : p.progress;
    // The frame closes as its progress grows, the lobed ring opens: the other direction is the
    // same front backwards.
    const forward = p.shape === "rect" ? "close" : "open";
    const k = p.direction === forward ? pr : 1 - pr;
    const R = p.ring;

    // Geometry shared by every cell.
    const left = round(k * p.left * W);
    const right = round(W + (p.right * W - W) * k);
    const top = round(k * p.top * H);
    const bottom = round(H + (p.bottom * H - H) * k);
    const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
    const rr = p.shape === "rect" ? R : Math.max(1, round(R + p.grow * e));
    const radius = (e * (Math.hypot(W, H) / 2 + 3 * rr + 12)) / (1 - p.amp);
    const outside = p.outside === "page" ? 0 : 1;
    const life =
      p.shape === "rect"
        ? smooth(clamp((1 - k) / 0.5)) * smooth(clamp(k / 0.2))
        : smooth(clamp((1 - k) / 0.35));
    const t = ctx.time;

    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        let g: number;
        if (p.shape === "rect") {
          g = Math.min(Math.min(px - left, right - px), Math.min(py - top, bottom - py));
        } else {
          const dx = px - W / 2;
          const dy = py - H / 2;
          const th = Math.atan2(dy, dx);
          const lobe = lobeAt(th, t);
          g = radius * (1 + p.amp * lobe) - Math.hypot(dx, dy);
        }
        let v: number;
        let a = life;
        if (k <= 0) {
          v = p.shape === "rect" ? 1 : outside;
          g = p.shape === "rect" ? 999 : g;
          a = 0;
        } else if (k >= 1) {
          v = g >= 0 ? 1 : outside;
          a = 0;
        } else {
          v = g < 0 ? outside : g < rr ? 5 / 16 : g < 2 * rr ? 11 / 16 : 1;
        }
        const o = (y * W + x) * 4;
        data[o] = v;
        data[o + 1] = g;
        data[o + 2] = a;
        data[o + 3] = 1;
      }
  },
};
