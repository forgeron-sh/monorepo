/**
 * The one ordered-dither matrix of the lab language. `B(2n)` is built from `B(n)`:
 * `[4B, 4B + 2; 4B + 3, 4B + 1]`, starting from `B(1) = [0]`. The 4×4 and 8×8 tables the sites
 * carried (engine.ts, pixel.ts, the GLSL `bayer8`) are exactly `matrix(4)` and `matrix(8)`.
 */

export type BayerSize = 2 | 4 | 8;

const cache = new Map<number, Uint8Array>();

export function matrix(n: BayerSize): Uint8Array {
  const hit = cache.get(n);
  if (hit) return hit;
  let size = 1;
  let m = new Uint8Array([0]);
  while (size < n) {
    const next = new Uint8Array(size * 2 * size * 2);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const b = 4 * (m[y * size + x] ?? 0);
        const row = size * 2;
        next[y * row + x] = b;
        next[y * row + x + size] = b + 2;
        next[(y + size) * row + x] = b + 3;
        next[(y + size) * row + x + size] = b + 1;
      }
    }
    m = next;
    size *= 2;
  }
  cache.set(n, m);
  return m;
}

/** Threshold of the pixel `(x, y)` in `[0, 1)`: a tone above it is drawn. */
export function bayer(x: number, y: number, n: BayerSize = 4): number {
  const m = matrix(n);
  return ((m[(y & (n - 1)) * n + (x & (n - 1))] ?? 0) + 0.5) / (n * n);
}
