import { type PassDef, glslFloat } from "../contract";

export interface GridParams {
  /** Share of each cell left as a gap on its right and top edges. */
  gap: number;
  /** No gap below this many device pixels per cell. */
  min: number;
  /** The tone index the gap takes (0, the background). */
  tone: number;
}

/**
 * The pixel grid: a gap on the right and top edge of each cell, in output pixels (the last
 * stage). It writes a tone index, so it runs before the palette.
 */
export const gridPass: PassDef<GridParams> = {
  type: "grid",
  kind: "present",
  description: "A gap on the right and top edge of each cell, in output pixels.",
  params: {
    gap: { type: "number", default: 0.16, min: 0, max: 0.5, description: "Share of a cell." },
    min: {
      type: "number",
      default: 4,
      min: 0,
      description: "No gap below this many device pixels per cell.",
    },
    tone: { type: "number", default: 0, min: 0, integer: true, description: "Tone of the gap." },
  },
  glsl(p) {
    const edge = glslFloat(1 - p.gap);
    return {
      decl: [],
      body: `{vec2 f=fract(frag/uPx);if(uPx>=${glslFloat(p.min)}&&(f.x>${edge}||f.y>${edge}))c=vec4(${glslFloat(p.tone)},0.,0.,1.);}`,
    };
  },
  cpu(frame, p, ctx) {
    const { width: w, height: h, data } = frame;
    if (ctx.px < p.min) return;
    const edge = 1 - p.gap;
    for (let y = 0; y < h; y++) {
      // The GPU's fragment row, from the bottom.
      const fy = (h - 1 - y + 0.5) / ctx.px;
      const gy = fy - Math.floor(fy) > edge;
      for (let x = 0; x < w; x++) {
        const fx = (x + 0.5) / ctx.px;
        if (!gy && !(fx - Math.floor(fx) > edge)) continue;
        const o = (y * w + x) * 4;
        data[o] = p.tone;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
