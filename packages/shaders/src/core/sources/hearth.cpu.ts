import type { CpuSource } from "../contract";
import { type HearthGrid, hearthFrame } from "./hearth";

export const hearthCpu: CpuSource<Record<string, never>> = {
  type: "hearth",
  cpu(frame, _p, ctx) {
    const grid = ctx.data?.grid as HearthGrid | undefined;
    const heat = (ctx.data?.heat as { x: number; y: number } | null | undefined) ?? null;
    if (!grid) return;
    const tones = hearthFrame(grid, ctx.time, heat);
    const { width: w, height: h, data } = frame;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        data[o] = x < grid.cols && y < grid.rows ? (tones[y * grid.cols + x] ?? 0) : 0;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
