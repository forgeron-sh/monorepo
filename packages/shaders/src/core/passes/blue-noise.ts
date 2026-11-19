import type { FloatTable, PassMeta } from "../contract";

/**
 * Blue noise dither: the ordered pass with a 64×64 tileable mask instead of the Bayer matrix. The
 * mask is a void-and-cluster ranking (Ulichney 1993) of the 4096 cells, made once, on the CPU,
 * from a fixed seed: the same mask on every page and both sides. The threshold of a cell is
 * `(rank + 0.5) / 4096`, exact in float32, so the GPU (an `R32F` texture) and the CPU agree
 * exactly, as the ordered pass does.
 */

export const BLUE_NOISE_SIZE = 64;

let mask: Float32Array | undefined;

/**
 * The 64×64 mask, row by row: thresholds in `(0, 1)`, every one of `(k + 0.5) / 4096` once.
 * Void and cluster on a torus with a Gaussian of σ = 1.5 cells: initial points (one cell in ten)
 * relaxed until stable, ranked by removing the tightest cluster, then the rest ranked by filling
 * the largest void.
 */
export function blueNoiseMask(): Float32Array {
  if (mask) return mask;
  const N = BLUE_NOISE_SIZE;
  const area = N * N;
  const R = 6;
  const kernel: number[] = [];
  for (let dy = -R; dy <= R; dy++)
    for (let dx = -R; dx <= R; dx++) kernel.push(Math.exp(-(dx * dx + dy * dy) / (2 * 1.5 * 1.5)));
  const on = new Uint8Array(area);
  const energy = new Float64Array(area);
  const splat = (i: number, sign: number) => {
    const x = i % N;
    const y = (i - x) / N;
    let k = 0;
    for (let dy = -R; dy <= R; dy++) {
      const row = ((y + dy + N) % N) * N;
      for (let dx = -R; dx <= R; dx++) {
        const j = row + ((x + dx + N) % N);
        energy[j] = (energy[j] ?? 0) + sign * (kernel[k++] ?? 0);
      }
    }
  };
  /** The point (`want` 1) with the most energy, or the empty cell (`want` 0) with the least. */
  const extreme = (want: number) => {
    let best = -1;
    let value = want ? -Infinity : Infinity;
    for (let i = 0; i < area; i++) {
      if (on[i] !== want) continue;
      const e = energy[i] ?? 0;
      if (want ? e > value : e < value) {
        value = e;
        best = i;
      }
    }
    return best;
  };
  // A fixed seed (a linear congruential generator): the same mask everywhere.
  let seed = 0x9e3779b9;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const initial = Math.round(area / 10);
  for (let placed = 0; placed < initial;) {
    const i = Math.floor(rand() * area);
    if (on[i]) continue;
    on[i] = 1;
    splat(i, 1);
    placed++;
  }
  // Relax: move the tightest cluster to the largest void until it would land where it was.
  for (let guard = 0; guard < area; guard++) {
    const cluster = extreme(1);
    on[cluster] = 0;
    splat(cluster, -1);
    const voidAt = extreme(0);
    on[voidAt] = 1;
    splat(voidAt, 1);
    if (voidAt === cluster) break;
  }
  const rank = new Int32Array(area);
  const prototype = on.slice();
  const prototypeEnergy = energy.slice();
  for (let k = initial - 1; k >= 0; k--) {
    const cluster = extreme(1);
    on[cluster] = 0;
    splat(cluster, -1);
    rank[cluster] = k;
  }
  on.set(prototype);
  energy.set(prototypeEnergy);
  for (let k = initial; k < area; k++) {
    const voidAt = extreme(0);
    on[voidAt] = 1;
    splat(voidAt, 1);
    rank[voidAt] = k;
  }
  mask = new Float32Array(area);
  for (let i = 0; i < area; i++) mask[i] = ((rank[i] ?? 0) + 0.5) / area;
  return mask;
}

/** The mask as a float table, for the GPU side (an `R32F` texture). */
export const blueNoiseTable = (): FloatTable => ({
  width: BLUE_NOISE_SIZE,
  height: BLUE_NOISE_SIZE,
  data: blueNoiseMask(),
});

export interface BlueNoiseParams {
  /** Which row the mask starts on: the top (the CPU effects) or the bottom (the GPU fields). */
  origin: "top" | "bottom";
  /** `[offset, scale]`: tone k is the number of consecutive steps with `v > offset + t × scale`. */
  steps: readonly (readonly [number, number])[];
}

export const blueNoiseMeta: PassMeta = {
  type: "blue-noise",
  kind: "cell",
  usesCell: true,
  description: "Blue noise dither of the value into tone indices (a 64×64 void-and-cluster mask).",
  params: {
    origin: {
      type: "enum",
      values: ["top", "bottom"],
      default: "top",
      description: "Row the mask starts on.",
    },
    steps: {
      type: "steps",
      default: [[0, 1]],
      description:
        "[offset, scale] per tone above the background: tone k when the value passes k consecutive steps.",
    },
  },
};
