import { BAYER_GLSL, bayer, type BayerSize, matrix } from "../bayer";
import { type PassDef, glslFloat } from "../contract";

export interface OrderedParams {
  matrix: BayerSize;
  /** Thresholds at `(m + 0.5) / n²` (the CPU effects) or `m / n²` (the site's field shader). */
  centered: boolean;
  /** Which row the matrix starts on: the top (CPU effects) or the bottom (GPU fields). */
  origin: "top" | "bottom";
  /** `[offset, scale]`: tone k is the number of consecutive steps with `v > offset + t × scale`. */
  steps: readonly (readonly [number, number])[];
}

/** The threshold of step `[o, s]`, written as the original shaders wrote it. */
function glslThreshold(o: number, s: number): string {
  if (o === 0 && s === 1) return "t";
  if (s === 1) return `${glslFloat(o)}+t`;
  if (o === 0) return `t*${glslFloat(s)}`;
  return `${glslFloat(o)}+t*${glslFloat(s)}`;
}

/**
 * Ordered dither: the value in `r` against the Bayer threshold of the cell becomes a tone index
 * (0 below the first step). Integer result: the CPU and the GPU agree exactly.
 */
export const orderedPass: PassDef<OrderedParams> = {
  type: "ordered",
  kind: "cell",
  usesCell: true,
  description: "Ordered (Bayer) dither of the value into tone indices.",
  params: {
    matrix: {
      type: "enum",
      values: [2, 4, 8],
      default: 8,
      description: "Side of the Bayer matrix.",
    },
    centered: {
      type: "boolean",
      default: true,
      description: "Thresholds at (m + 0.5) / n² instead of m / n².",
    },
    origin: {
      type: "enum",
      values: ["top", "bottom"],
      default: "top",
      description: "Row the matrix starts on.",
    },
    steps: {
      type: "steps",
      default: [[0, 1]],
      description:
        "[offset, scale] per tone above the background: tone k when the value passes k consecutive steps.",
    },
  },
  glsl(p) {
    const n = p.matrix;
    const at = p.origin === "top" ? "vec2(cell.x,uCells.y-1.-cell.y)" : "cell";
    const half = p.centered ? `+${glslFloat(0.5 / (n * n))}` : "";
    let test = "";
    for (let k = p.steps.length - 1; k >= 0; k--) {
      const [o, s] = p.steps[k] ?? [0, 1];
      test = `if(v>${glslThreshold(o, s)}){k=${glslFloat(k + 1)};${test}}`;
    }
    return {
      decl: [BAYER_GLSL],
      body: `{float t=bayer${n}(${at})${half};float v=c.r;float k=0.;${test}c=vec4(k,0.,0.,1.);}`,
    };
  },
  cpu(frame, p) {
    const { width: w, height: h, data } = frame;
    const n = p.matrix;
    const m = matrix(n);
    const steps = p.steps;
    for (let y = 0; y < h; y++) {
      const by = p.origin === "top" ? y : h - 1 - y;
      for (let x = 0; x < w; x++) {
        const t = p.centered
          ? bayer(x, by, n)
          : (m[(by & (n - 1)) * n + (x & (n - 1))] ?? 0) / (n * n);
        const o = (y * w + x) * 4;
        const v = data[o] ?? 0;
        let k = 0;
        while (k < steps.length) {
          const [off, scale] = steps[k] ?? [0, 1];
          if (!(v > off + t * scale)) break;
          k++;
        }
        data[o] = k;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
