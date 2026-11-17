/**
 * Flat (side view) hero scenes, the prototypes compared in the hero switch. Each scene paints a
 * cell grid into two buffers, light (ink coverage, 0 to 1) and ember (accent, 0 to 1), and a 4×4
 * Bayer matrix thresholds them into four tokens: `--bg-sunk`, `--ink-dim`, `--ink`, `--accent`.
 * Pixels switch on or off whole; nothing blurs or fades. Scenes are pure functions of time, so a
 * frame never depends on the previous one.
 */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)]!;

/** Ink at a coverage, light added to what is there, or ember at a heat. */
type Paint = number | { add: number } | { ember: number };

function hash(x: number, y: number, seed = 0): number {
  let h =
    (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i, 0, seed) * (1 - u) + hash(i + 1, 0, seed) * u;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);

/** 3×5 capitals and figures (some glyphs narrower), drawn one cell per pixel. */
const FONT: Record<string, string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["##.", "..#", ".#.", "..#", "##."],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "##.", "..#", "##."],
  "6": [".##", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "##."],
  "!": ["#", "#", "#", ".", "#"],
  ".": [".", ".", ".", ".", "#"],
  ",": [".", ".", ".", "#", "#"],
  "'": ["#", "#", ".", ".", "."],
  "?": ["##.", "..#", ".#.", "...", ".#."],
  "-": ["...", "...", "###", "...", "..."],
  ">": ["#..", "##.", "###", "##.", "#.."],
  "~": ["#####", ".###.", "..#..", ".....", "....."],
  " ": ["..", "..", "..", "..", ".."],
};

/** The two buffers of a frame, and the shapes painted into them. */
export class Cells {
  readonly l: Float32Array;
  readonly a: Float32Array;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.l = new Float32Array(w * h);
    this.a = new Float32Array(w * h);
  }

  put(x: number, y: number, p: Paint): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (typeof p === "number") {
      this.l[i] = p;
      this.a[i] = 0;
    } else if ("add" in p) this.l[i] = clamp(this.l[i]! + p.add);
    else this.a[i] = Math.max(this.a[i]!, p.ember);
  }

  fill(fn: (x: number, y: number) => number): void {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        this.l[i] = fn(x, y);
        this.a[i] = 0;
      }
  }

  rect(x: number, y: number, w: number, h: number, p: Paint): void {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.round(x + w);
    const y1 = Math.round(y + h);
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.put(i, j, p);
  }

  /** A one-cell outline. */
  frame(x: number, y: number, w: number, h: number, p: Paint): void {
    this.rect(x, y, w, 1, p);
    this.rect(x, y + h - 1, w, 1, p);
    this.rect(x, y, 1, h, p);
    this.rect(x + w - 1, y, 1, h, p);
  }

  circle(cx: number, cy: number, r: number, p: Paint): void {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) this.put(x, y, p);
      }
  }

  /** A polygon from flat [x0, y0, x1, y1, …], filled by scanline (even-odd). */
  poly(pts: number[], p: Paint): void {
    const n = pts.length / 2;
    let lo = Infinity;
    let hi = -Infinity;
    for (let k = 0; k < n; k++) {
      lo = Math.min(lo, pts[k * 2 + 1]!);
      hi = Math.max(hi, pts[k * 2 + 1]!);
    }
    for (let y = Math.floor(lo); y <= hi; y++) {
      const sy = y + 0.5;
      const xs: number[] = [];
      for (let k = 0; k < n; k++) {
        const ax = pts[k * 2]!;
        const ay = pts[k * 2 + 1]!;
        const bx = pts[((k + 1) % n) * 2]!;
        const by = pts[((k + 1) % n) * 2 + 1]!;
        if (ay <= sy !== by <= sy) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((u, v) => u - v);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]!); x < Math.round(xs[k + 1]!); x++) this.put(x, y, p);
    }
  }

  /** A segment with round ends, `r` cells thick on each side. */
  capsule(x0: number, y0: number, x1: number, y1: number, r: number, p: Paint): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy || 1;
    for (let y = Math.floor(Math.min(y0, y1) - r); y <= Math.max(y0, y1) + r; y++)
      for (let x = Math.floor(Math.min(x0, x1) - r); x <= Math.max(x0, x1) + r; x++) {
        const k = clamp(((x + 0.5 - x0) * dx + (y + 0.5 - y0) * dy) / len2);
        const ex = x + 0.5 - (x0 + k * dx);
        const ey = y + 0.5 - (y0 + k * dy);
        if (ex * ex + ey * ey <= r * r) this.put(x, y, p);
      }
  }

  /** Ember (or added light) falling off from a centre: dithered, it reads as a pixel halo. */
  glow(cx: number, cy: number, r: number, heat: number, light = false): void {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(this.h - 1, cy + r); y++)
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(this.w - 1, cx + r); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
        if (d >= 1) continue;
        const v = heat * (1 - d) ** 1.6;
        this.put(x, y, light ? { add: v } : { ember: v });
      }
  }

  /** Capitals in the 3×5 face; returns the width in cells. `keep` drops cells for a dissolve. */
  text(
    s: string,
    x: number,
    y: number,
    p: Paint,
    keep?: (x: number, y: number) => boolean,
  ): number {
    let cx = Math.round(x);
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch] ?? FONT[" "]!;
      g.forEach((row, j) =>
        [...row].forEach((c, i) => {
          if (c === "#" && (!keep || keep(cx + i, y + j))) this.put(cx + i, Math.round(y) + j, p);
        }),
      );
      cx += g[0]!.length + 1;
    }
    return cx - Math.round(x) - 1;
  }
}

export const textWidth = (s: string) =>
  [...s.toUpperCase()].reduce((w, ch) => w + (FONT[ch] ?? FONT[" "]!)[0]!.length + 1, 0) - 1;

export type FlatScene = (c: Cells, t: number) => void;

// ---------------------------------------------------------------------------------------------
// 1. Vulcan: a forge interior after Velázquez. Ember only in the fire and the struck metal.
// ---------------------------------------------------------------------------------------------

const vulcan: FlatScene = (c, t) => {
  const { w: W, h: H } = c;
  const U = H / 100;
  const cx = W / 2;
  const gy = Math.round(H * 0.88);
  const hx = cx - 58 * U;
  const hy = gy - 12 * U;
  const bel = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 2.4);
  const flick = 0.75 + 0.2 * noise(t * 7, 3) + 0.15 * bel;
  const bh = Math.max(3, Math.round(5 * U));
  const bw = bh * 2;

  // Brick wall and floor, lit by the fire.
  c.fill((x, y) => {
    const dx = (x - hx) / (80 * U);
    const dy = (y - hy) / (60 * U);
    const fire = clamp(1 - Math.sqrt(dx * dx + dy * dy)) ** 1.4 * flick;
    if (y >= gy) return 0.06 + 0.3 * fire + (hash(x, y, 9) < 0.06 ? 0.1 : 0);
    const row = Math.floor(y / bh);
    const off = (row % 2) * bh;
    const mortar = y % bh === 0 || (x + off) % bw === 0;
    return mortar ? 0.01 + 0.06 * fire : 0.02 + 0.4 * fire;
  });

  // Window and its cold shaft of light, on the right.
  const wx = cx + 46 * U;
  const wy = 14 * U;
  const ww = 16 * U;
  const wh = 34 * U;
  c.poly([wx, wy, wx + ww, wy, wx + ww - 34 * U, gy + 4 * U, wx - 40 * U, gy + 4 * U], {
    add: 0.08,
  });
  c.rect(wx, wy, ww, wh, 0.9);
  c.circle(wx + ww / 2, wy, ww / 2, 0.9);
  c.rect(wx + ww / 2 - 0.5 * U, wy - ww / 2, Math.max(1, U), wh + ww / 2, 0.08);
  c.rect(wx, wy + wh * 0.45, ww, Math.max(1, U), 0.08);
  c.rect(wx - 2 * U, wy + wh, ww + 4 * U, 2 * U, 0.4);

  // Tools hung on the wall, between the window and the anvil.
  const tx = wx - 22 * U;
  c.rect(tx - 10 * U, 22 * U, 22 * U, Math.max(1, U), 0.26);
  for (let k = 0; k < 3; k++) {
    const px = tx - 7 * U + k * 8 * U;
    c.capsule(px, 23 * U, px, 36 * U, 0.7 * U, 0.3);
    if (k === 1) {
      c.capsule(px, 23 * U, px - 2 * U, 38 * U, 0.6 * U, 0.3);
      c.capsule(px, 23 * U, px + 2 * U, 38 * U, 0.6 * U, 0.3);
    } else c.rect(px - 2.5 * U, 33 * U, 5 * U, 3 * U, 0.34);
  }

  // The hearth: halo first, so the masonry in front stays dark.
  c.glow(hx, hy, 46 * U, 0.55 * flick);
  c.poly([hx - 22 * U, gy - 21 * U, hx + 22 * U, gy - 21 * U, hx + 11 * U, 0, hx - 11 * U, 0], 0.2);
  c.rect(hx - 24 * U, gy - 23 * U, 48 * U, 3 * U, 0.38);
  c.rect(hx - 20 * U, gy - 20 * U, 40 * U, 20 * U, 0.3);
  for (let y = gy - 20 * U; y < gy; y += bh) c.rect(hx - 20 * U, y, 40 * U, 1, 0.18);
  const ox = hx - 13 * U;
  const ow = 26 * U;
  const oy = gy - 17 * U;
  c.rect(ox, oy, ow, 11 * U, 0.02);
  for (let x = Math.floor(ox); x < ox + ow; x++) {
    const hgt = (4 + 6 * noise(x * 0.35 + t * 4, 1) * flick) * U;
    for (let y = oy + 11 * U - 1; y > oy + 11 * U - hgt && y >= oy; y--) {
      const k = (oy + 11 * U - y) / hgt;
      c.put(x, y, { ember: 1.05 - k * 0.75 });
    }
  }
  c.rect(hx - 20 * U, gy - 6 * U, 40 * U, 6 * U, 0.3);

  // Bellows and the helper working them, left of the hearth.
  const bx = hx - 34 * U;
  const lift = (1 - bel) * 6 * U;
  c.poly(
    [
      bx + 8 * U,
      gy - 14 * U,
      bx - 6 * U,
      gy - 18 * U - lift,
      bx - 8 * U,
      gy - 10 * U,
      bx + 8 * U,
      gy - 10 * U,
    ],
    0.36,
  );
  c.capsule(bx + 8 * U, gy - 12 * U, hx - 20 * U, gy - 10 * U, 0.8 * U, 0.3);
  c.rect(bx - 8 * U, gy - 10 * U, 16 * U, 10 * U, 0.24);
  const hx2 = bx - 16 * U;
  c.capsule(hx2, gy - 18 * U, hx2 - 3 * U, gy, 2 * U, 0.46);
  c.capsule(hx2, gy - 18 * U, hx2 + 3 * U, gy, 2 * U, 0.46);
  c.capsule(hx2, gy - 18 * U, hx2 + 2 * U, gy - 33 * U, 3.6 * U, 0.48);
  c.circle(hx2 + 3 * U, gy - 39 * U, 3.6 * U, 0.48);
  c.capsule(hx2 + 2 * U, gy - 31 * U, bx - 6 * U, gy - 19 * U - lift, 1.5 * U, 0.48);

  // Anvil, and the bar on it.
  const sx = cx + 12 * U;
  const ax = sx - 17 * U;
  c.poly(
    [
      ax - 16 * U,
      gy - 15 * U,
      ax - 8 * U,
      gy - 17 * U,
      ax + 10 * U,
      gy - 17 * U,
      ax + 10 * U,
      gy - 13 * U,
      ax + 4 * U,
      gy - 12 * U,
      ax + 4 * U,
      gy - 6 * U,
      ax + 9 * U,
      gy - 3 * U,
      ax + 9 * U,
      gy,
      ax - 7 * U,
      gy,
      ax - 7 * U,
      gy - 3 * U,
      ax - 2 * U,
      gy - 6 * U,
      ax - 2 * U,
      gy - 12 * U,
      ax - 9 * U,
      gy - 13 * U,
      ax - 14 * U,
      gy - 14 * U,
    ],
    0.52,
  );
  c.rect(ax - 8 * U, gy - 17 * U, 18 * U, Math.max(1, 0.8 * U), 0.8);

  const T = 1.5;
  const k = Math.floor(t / T);
  const p = (t % T) / T;
  const hit = 0.8;
  const sinceHit = (p >= hit ? p - hit : p + 1 - hit) * T;
  const heat = 1 - 0.3 * clamp(sinceHit / T);
  c.glow(ax + 1 * U, gy - 18 * U, 12 * U, 0.45 * heat);
  c.rect(ax - 6 * U, gy - 19 * U, 13 * U, 2 * U, { ember: heat });

  // The smith, facing the anvil.
  const body = 0.58;
  c.capsule(sx, gy - 22 * U, sx - 5 * U, gy, 2.4 * U, body);
  c.capsule(sx, gy - 22 * U, sx + 4 * U, gy, 2.4 * U, body);
  c.capsule(sx, gy - 22 * U, sx - 2 * U, gy - 36 * U, 4.4 * U, body);
  c.poly(
    [
      sx - 7 * U,
      gy - 30 * U,
      sx + 3 * U,
      gy - 30 * U,
      sx + 4 * U,
      gy - 12 * U,
      sx - 6 * U,
      gy - 12 * U,
    ],
    0.34,
  );
  c.circle(sx - 4 * U, gy - 44 * U, 4 * U, body);
  // Off arm holds the bar with tongs.
  c.capsule(sx - 3 * U, gy - 36 * U, ax + 9 * U, gy - 22 * U, 1.6 * U, body);
  c.capsule(ax + 9 * U, gy - 22 * U, ax + 3 * U, gy - 18.5 * U, 0.6 * U, 0.3);

  // Hammer arm: a slow raise over the head, a fast fall onto the bar.
  const down = 124;
  const up = 292;
  let deg = down;
  if (p < 0.6) deg = lerp(down, up, ease(p / 0.6));
  else if (p < 0.72) deg = up;
  else if (p < hit) deg = lerp(up, down, ((p - 0.72) / (hit - 0.72)) ** 2);
  const th = (deg * Math.PI) / 180;
  const shx = sx - 2 * U;
  const shy = gy - 37 * U;
  const ex = shx + Math.cos(th) * 14 * U;
  const ey = shy + Math.sin(th) * 14 * U;
  const hx3 = shx + Math.cos(th) * 21 * U;
  const hy3 = shy + Math.sin(th) * 21 * U;
  c.capsule(shx, shy, ex, ey, 1.8 * U, body);
  c.capsule(ex, ey, hx3, hy3, 0.7 * U, 0.4);
  const nx = -Math.sin(th);
  const ny = Math.cos(th);
  c.capsule(hx3 - nx * 3 * U, hy3 - ny * 3 * U, hx3 + nx * 3 * U, hy3 + ny * 3 * U, 1.6 * U, 0.62);

  // Sparks of this strike and the previous one, deterministic per strike.
  const ix = ax + 1 * U;
  const iy = gy - 19 * U;
  for (const [n, s] of [
    [k, (p - hit) * T],
    [k - 1, (p + 1 - hit) * T],
  ] as const) {
    if (s < 0 || s > 0.8) continue;
    if (s < 0.09) c.glow(ix, iy, 14 * U, 0.95);
    for (let i = 0; i < 22; i++) {
      const life = 0.25 + 0.5 * hash(n, i, 3);
      if (s > life) continue;
      const ang = -Math.PI / 2 + (hash(n, i, 1) - 0.5) * 2.8;
      const v = (35 + 65 * hash(n, i, 2)) * U;
      const x = ix + Math.cos(ang) * v * s;
      const y = iy + Math.sin(ang) * v * s + 0.5 * 140 * U * s * s;
      c.put(x, y, { ember: 1 });
      c.put(x - Math.cos(ang) * v * 0.02, y - Math.sin(ang) * v * 0.02, { ember: 0.7 });
    }
  }
};

// ---------------------------------------------------------------------------------------------
// 2. Workshop, 3 a.m.: a lit garage in the night; every deploy rises from the chimney as a star.
// ---------------------------------------------------------------------------------------------

const workshop: FlatScene = (c, t) => {
  const { w: W, h: H } = c;
  const U = H / 100;
  const cx = W / 2;
  const gy = Math.round(H * 0.74);

  // Sky, stars, mountains, hills, ground.
  const far = (x: number) =>
    gy - (16 + 16 * noise(x / (46 * U), 1) + 6 * noise(x / (13 * U), 2)) * U;
  const mid = (x: number) => gy - (4 + 9 * noise(x / (30 * U), 4)) * U;
  const tw = Math.floor(t * 3);
  c.fill((x, y) => {
    if (y >= gy) return 0.14 + (hash(x, y, 5) < 0.08 ? 0.14 : 0);
    if (y >= mid(x)) return 0.09;
    if (y >= far(x)) return 0.17;
    if (y < gy * 0.8 && hash(x, y, 7) < 0.0035) return hash(x, y, tw) < 0.2 ? 0.5 : 1;
    return 0.01 + 0.07 * (y / gy) ** 3;
  });

  // Moon, a crescent.
  const mx = cx + W * 0.3;
  const my = H * 0.17;
  c.glow(mx, my, 22 * U, 0.06, true);
  c.circle(mx, my, 7 * U, 0.95);
  c.circle(mx + 3 * U, my - 1.5 * U, 6.5 * U, 0.03);

  // Pines.
  for (const [dx, hh] of [
    [-96, 30],
    [-86, 22],
    [-76, 34],
    [58, 26],
    [70, 34],
    [84, 22],
    [130, 28],
    [-140, 26],
  ] as const) {
    const x = cx + dx * U;
    const base = gy + 2 * U;
    for (let k = 0; k < 3; k++) {
      const top = base - hh * U + k * hh * 0.22 * U;
      const half = (5 + k * 2.6) * U * (hh / 30);
      c.poly([x, top, x + half, top + hh * 0.42 * U, x - half, top + hh * 0.42 * U], 0.01);
    }
    c.rect(x - 0.8 * U, base - 4 * U, 1.6 * U, 4 * U, 0.01);
  }

  // The workshop.
  const hc = cx - 8 * U;
  const by = gy + 6 * U;
  const x0 = hc - 26 * U;
  const x1 = hc + 26 * U;
  const wallTop = by - 24 * U;
  const apex = by - 40 * U;

  // Light spilling out of the open door, then the house over it.
  const dx0 = x0 + 4 * U;
  const dw = 20 * U;
  for (let y = Math.floor(by); y < H; y++) {
    const k = (y - by) / (H - by + 1);
    const spread = k * 14 * U;
    for (let x = Math.floor(dx0 - spread); x < dx0 + dw + spread; x++)
      c.put(x, y, { ember: 0.5 * (1 - k) });
  }

  // Chimney, then the roof over its foot.
  const chx = hc + 13 * U;
  c.rect(chx, apex - 4 * U, 5 * U, 16 * U, 0.48);
  c.rect(chx - 1 * U, apex - 5 * U, 7 * U, 2 * U, 0.58);
  c.rect(x0, wallTop, x1 - x0, by - wallTop, 0.4);
  for (let x = Math.ceil(x0 + 3 * U); x < x1; x += Math.max(2, Math.round(3 * U)))
    c.rect(x, wallTop, 1, by - wallTop, 0.32);
  c.poly([x0 - 5 * U, wallTop + 1 * U, hc, apex, x1 + 5 * U, wallTop + 1 * U], 0.56);
  c.poly(
    [
      x0 - 5 * U,
      wallTop + 1 * U,
      hc,
      apex,
      hc,
      apex + Math.max(1, U),
      x0 - 5 * U,
      wallTop + 1 * U + Math.max(1, U),
    ],
    0.78,
  );

  // Roll-up door, half open on a lit inside.
  const dy0 = by - 17 * U;
  c.rect(dx0, dy0, dw, 17 * U, { ember: 0.8 });
  c.rect(dx0, dy0 + 8 * U, dw, 9 * U, 0.02);
  c.rect(dx0, dy0 + 8 * U, dw, 9 * U, { ember: 0.78 });
  c.rect(dx0 + 2 * U, by - 6 * U, 12 * U, 1.4 * U, 0.03);
  c.rect(dx0 + 3 * U, by - 5 * U, 1 * U, 5 * U, 0.03);
  c.rect(dx0 + 12 * U, by - 5 * U, 1 * U, 5 * U, 0.03);
  c.rect(dx0 + 5 * U, by - 9 * U, 3 * U, 3 * U, 0.03);
  c.rect(dx0, dy0, dw, 8 * U, 0.5);
  for (let y = dy0 + 2 * U; y < dy0 + 8 * U; y += Math.max(2, Math.round(2 * U)))
    c.rect(dx0, y, dw, 1, 0.36);

  // Window: someone at a screen.
  const wx = x0 + 30 * U;
  const wy = by - 18 * U;
  const bob = Math.floor(t * 1.5) % 4 === 0 ? 1 : 0;
  c.rect(wx, wy, 16 * U, 10 * U, { ember: 0.88 });
  c.rect(wx + 2 * U, wy + 8 * U - 3 * U, 9 * U, 5 * U, 0.03);
  c.circle(wx + 6.5 * U, wy + 3.8 * U + bob, 2.4 * U, 0.03);
  c.rect(wx + 11 * U, wy + 3 * U, 3.6 * U, 3 * U, Math.floor(t * 5) % 7 === 0 ? 0.6 : 0.95);
  c.rect(wx + 12.3 * U, wy + 6 * U, 1 * U, 2 * U, 0.03);
  c.frame(wx, wy, 16 * U, 10 * U, 0.6);
  c.rect(wx - 1 * U, wy + 10 * U, 18 * U, 1.2 * U, 0.6);

  // A cat in the door light.
  const kx = dx0 + 26 * U;
  const ky = by + 9 * U;
  c.circle(kx, ky, 2.6 * U, 0.02);
  c.circle(kx - 0.6 * U, ky - 3.6 * U, 1.7 * U, 0.02);
  c.poly(
    [kx - 2.2 * U, ky - 4.4 * U, kx - 1.6 * U, ky - 6.4 * U, kx - 0.8 * U, ky - 4.8 * U],
    0.02,
  );
  c.poly(
    [kx + 0.2 * U, ky - 4.8 * U, kx + 0.6 * U, ky - 6.4 * U, kx + 1.2 * U, ky - 4.4 * U],
    0.02,
  );
  const swish = Math.sin(t * 2.2) * 2.5 * U;
  c.capsule(kx + 2 * U, ky + 1.6 * U, kx + 5 * U, ky - 2 * U + swish * 0.4, 0.55 * U, 0.02);
  c.capsule(
    kx + 5 * U,
    ky - 2 * U + swish * 0.4,
    kx + 5.5 * U + swish * 0.3,
    ky - 4.5 * U + swish,
    0.55 * U,
    0.02,
  );

  // Pole and wire.
  const px = x1 + 24 * U;
  c.capsule(px, by + 4 * U, px, wallTop - 14 * U, 0.8 * U, 0.16);
  c.rect(px - 4 * U, wallTop - 12 * U, 8 * U, Math.max(1, 0.8 * U), 0.16);
  for (let k = 0; k <= 60; k++) {
    const q = k / 60;
    c.put(
      lerp(px - 4 * U, x1, q),
      lerp(wallTop - 11.5 * U, wallTop + 2 * U, q) + Math.sin(q * Math.PI) * 4 * U,
      0.22,
    );
  }

  // Smoke from the chimney.
  const ctop = apex - 5 * U;
  for (let i = 0; i < 6; i++) {
    const age = (t * 0.22 + i / 6) % 1;
    const sx = chx + 2.5 * U + age * 16 * U + Math.sin(age * 6 + i) * 2 * U;
    const sy = ctop - age * 34 * U;
    c.circle(sx, sy, (1.4 + age * 4.5) * U, { add: 0.22 * (1 - age) });
  }

  // Deploys: a spark leaves the chimney and becomes a star; ten a night, then dawn resets them.
  const P = 2.8;
  const N = 10;
  const night = Math.floor(t / (P * N));
  const j = Math.floor((t % (P * N)) / P);
  const s = t % P;
  const star = (n: number) => ({
    x: cx + (hash(night, n, 11) - 0.5) * Math.min(W, 260 * U),
    y: (0.08 + 0.42 * hash(night, n, 12)) * gy,
  });
  const plus = (x: number, y: number, p: Paint, arm: Paint) => {
    c.put(x, y, p);
    for (const [ox, oy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const)
      c.put(x + ox, y + oy, arm);
  };
  for (let m = 0; m < j; m++) {
    const { x, y } = star(m);
    plus(x, y, m === j - 1 && s < 1.2 ? { ember: 1 } : 1, 0.6);
  }
  const from = { x: chx + 2.5 * U, y: ctop };
  const to = star(j);
  if (s < 1.1) {
    for (let k = 0; k < 5; k++) {
      const q = ease(clamp((s - k * 0.03) / 1.1));
      const x = lerp(from.x, to.x, q) + Math.sin(q * Math.PI) * 10 * U * (to.x > from.x ? -1 : 1);
      const y = lerp(from.y, to.y, q);
      c.put(x, y, { ember: 1 - k * 0.18 });
    }
  } else if (s < 1.4) {
    const r = Math.round((s - 1.1) * 14);
    for (let k = -r; k <= r; k++) {
      c.put(to.x + k, to.y, { ember: 1 });
      c.put(to.x, to.y + k, { ember: 1 });
    }
  } else plus(to.x, to.y, { ember: 1 }, 0.6);
};

// ---------------------------------------------------------------------------------------------
// 3. A wild ERP appeared: a handheld battle screen; each forged tool knocks a module off the suite.
// ---------------------------------------------------------------------------------------------

interface Module {
  name: string;
  x: number;
  y: number;
}

const MODULES: Module[] = [
  { name: "ASSETS", x: -15, y: -33 },
  { name: "CRM", x: -47, y: -22 },
  { name: "STOCK", x: 17, y: -22 },
  { name: "SUPPORT", x: -47, y: -8 },
  { name: "BILLING", x: 17, y: -8 },
  { name: "HR", x: -37, y: 6 },
  { name: "PAYROLL", x: 7, y: 6 },
];
const HITS = ["CRM", "BILLING", "STOCK"];
const AFTER = ["IT'S SUPER EFFECTIVE!", "A CRITICAL HIT!", "THE SUITE FALLS APART!"];

const erp: FlatScene = (c, t) => {
  const { w: W, h: H } = c;
  const lw = Math.min(W, Math.round(H * 3.1));
  const lx = Math.floor((W - lw) / 2);
  const compact = lw < 300;
  c.fill((x, y) => (hash(x, y, 2) < 0.012 && y < H * 0.6 ? 0.18 : 0));

  const LOOP = 18.5;
  const lt = t % LOOP;
  const blink = Math.floor(t * 4) % 2 === 0;

  // Dialog.
  const dh = 21;
  const dy = H - dh - 3;
  const dx = lx + 6;
  const dwid = lw - 12;
  let lines: string[] = [];
  let menu = false;
  let swing = -1;
  let hitIndex = -1;
  let since = 0;
  const hp = (() => {
    let v = 1;
    for (let a = 0; a < 3; a++) {
      const at = 4.6 + a * 3.4 + 1.0;
      if (lt > at) v = lerp(v, 1 - (a + 1) / 3, clamp((lt - at) / 0.6));
    }
    return v;
  })();
  if (lt < 2.6) lines = ["A WILD ERP SUITE", "APPEARED!"];
  else if (lt < 4.6) {
    lines = ["WHAT WILL", "FORGERON DO?"];
    menu = true;
  } else if (lt < 4.6 + 3 * 3.4) {
    const a = Math.floor((lt - 4.6) / 3.4);
    const s = (lt - 4.6) % 3.4;
    hitIndex = a;
    since = s - 1.0;
    swing = s;
    lines = s < 1.4 ? ["FORGERON FORGED", `A ${HITS[a]} TOOL!`] : [AFTER[a]!];
  } else if (lt < 16.8) {
    lines = ["ERP SUITE", "FAINTED!"];
    hitIndex = 3;
    since = lt - (4.6 + 3 * 3.4);
  } else lines = ["LIGHT TOOLS WIN."];

  // Which modules are gone: every hit before this one, and this one once struck.
  const gone = new Set<string>();
  for (let a = 0; a < Math.min(hitIndex, 3); a++) gone.add(HITS[a]!);
  const falling = hitIndex >= 0 && hitIndex < 3 && since >= 0 ? HITS[hitIndex]! : null;
  const fainting = hitIndex === 3 ? clamp(since / 1.3) : 0;
  const absent = lt >= 16.8;

  // Enemy, sliding in from the right at the start of each loop.
  const slide = lt < 0.7 ? Math.round((1 - ease(lt / 0.7)) * lw * 0.45) : 0;
  const ex = lx + Math.round(lw * 0.64) + slide;
  const ey = Math.round(H * 0.42) + (Math.floor(t * 2.5) % 2);
  const sc = compact ? 0.5 : 1;
  const hidden = falling !== null && since < 0.5 && blink;
  const keep = (x: number, y: number) => bayer(x, y) >= fainting;

  for (let y = -3; y <= 3; y++)
    for (let x = -42; x <= 42; x++)
      if ((x / 42) ** 2 + (y / 3.5) ** 2 <= 1 && bayer(x, y) < 0.45)
        c.put(ex + x * sc, Math.round(H * 0.42) + 20 * sc + y, 0.35);

  const block = (m: Module, ox: number, oy: number, alpha: (x: number, y: number) => boolean) => {
    const bx = Math.round(ex + m.x * sc + ox);
    const by = Math.round(ey + m.y * sc + oy);
    const bw = Math.round(30 * sc);
    const bh = Math.round(11 * sc);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        if (!alpha(bx + x, by + y)) continue;
        const edge = x === 0 || y === 0 || x === bw - 1 || y === bh - 1;
        c.put(bx + x, by + y, edge ? 0.85 : 0.04);
      }
    if (!compact) c.text(m.name, bx + Math.round((bw - textWidth(m.name)) / 2), by + 3, 1, alpha);
  };

  if (!absent && !hidden) {
    for (const m of MODULES) {
      if (gone.has(m.name)) continue;
      if (m.name === falling) {
        const s = since;
        const drop = 0.5 * 160 * s * s;
        const fade = clamp((s - 0.2) / 0.8);
        block(m, (m.x < 0 ? -1 : 1) * s * 14, drop, (x, y) => bayer(x, y) >= fade);
        continue;
      }
      block(m, 0, 0, keep);
    }
    // The core, with its face.
    const cw = Math.round(34 * sc);
    const chh = Math.round(22 * sc);
    const cx0 = ex - Math.round(17 * sc);
    const cy0 = ey - Math.round(11 * sc);
    for (let y = 0; y < chh; y++)
      for (let x = 0; x < cw; x++) {
        if (!keep(cx0 + x, cy0 + y)) continue;
        const edge = x === 0 || y === 0 || x === cw - 1 || y === chh - 1;
        c.put(cx0 + x, cy0 + y, edge ? 0.95 : 0.55);
      }
    if (fainting < 0.5) {
      const e = sc;
      for (const side of [-1, 1]) {
        const eyx = ex + side * 8 * e - 3 * e;
        c.rect(eyx, ey - 5 * e, 6 * e, 4 * e, 1);
        c.rect(eyx + (side < 0 ? 3 : 1) * e, ey - 4 * e, 2 * e, 2 * e, { ember: 1 });
        for (let k = 0; k < 6 * e; k++)
          c.put(eyx + k, ey - 7 * e + (side < 0 ? k / (3 * e) : 2 - k / (3 * e)), 0);
      }
      c.rect(ex - 9 * e, ey + 3 * e, 18 * e, 5 * e, 0.02);
      for (let k = 0; k < 6; k++) {
        const tx = ex - 9 * e + k * 3 * e;
        c.poly([tx, ey + 3 * e, tx + 3 * e, ey + 3 * e, tx + 1.5 * e, ey + 5.5 * e], 1);
      }
    }
  }

  // Player: the smith from behind, hammer up.
  const px = lx + Math.round(lw * 0.24);
  const pb = dy - 2;
  for (let y = -3; y <= 3; y++)
    for (let x = -36; x <= 36; x++)
      if ((x / 36) ** 2 + (y / 3.5) ** 2 <= 1 && bayer(x, y) < 0.45)
        c.put(px + x * sc, pb - 2 + y, 0.35);
  const ps = compact ? 0.6 : 1;
  c.rect(px - 13 * ps, pb - 16 * ps, 26 * ps, 16 * ps, 0.55);
  c.circle(px - 13 * ps + 3 * ps, pb - 13 * ps, 3 * ps, 0.55);
  c.circle(px + 13 * ps - 3 * ps, pb - 13 * ps, 3 * ps, 0.55);
  c.rect(px - 5 * ps, pb - 16 * ps, 2 * ps, 16 * ps, 0.3);
  c.rect(px + 3 * ps, pb - 16 * ps, 2 * ps, 16 * ps, 0.3);
  c.circle(px, pb - 22 * ps, 7 * ps, 0.32);
  c.circle(px - 2 * ps, pb - 25 * ps, 2.5 * ps, 0.5);
  let deg = -60;
  if (swing >= 0 && swing < 0.5) deg = lerp(-60, -150, ease(swing / 0.5));
  else if (swing >= 0.5 && swing < 0.62) deg = lerp(-150, 10, (swing - 0.5) / 0.12);
  else if (swing >= 0.62 && swing < 1.2) deg = 10;
  const th = (deg * Math.PI) / 180;
  const sx = px + 11 * ps;
  const sy = pb - 14 * ps;
  const hx = sx + Math.cos(th) * 18 * ps;
  const hy = sy + Math.sin(th) * 18 * ps;
  c.capsule(sx, sy, sx + Math.cos(th) * 9 * ps, sy + Math.sin(th) * 9 * ps, 2.4 * ps, 0.55);
  c.capsule(sx + Math.cos(th) * 9 * ps, sy + Math.sin(th) * 9 * ps, hx, hy, 0.9 * ps, 0.42);
  c.capsule(
    hx + Math.sin(th) * 4 * ps,
    hy - Math.cos(th) * 4 * ps,
    hx - Math.sin(th) * 4 * ps,
    hy + Math.cos(th) * 4 * ps,
    2 * ps,
    0.8,
  );

  // The forged tool, flying to its module, and the hit.
  if (falling !== null || (hitIndex >= 0 && hitIndex < 3 && swing >= 0.6 && swing < 1.0)) {
    const target = MODULES.find((m) => m.name === HITS[hitIndex])!;
    const tx = ex + (target.x + 15) * sc;
    const ty = ey + (target.y + 5) * sc;
    if (swing >= 0.6 && swing < 1.0) {
      const q = (swing - 0.6) / 0.4;
      const fx = lerp(hx, tx, q);
      const fy = lerp(hy, ty, q) - Math.sin(q * Math.PI) * 18;
      const spin = Math.floor(q * 8) % 2;
      c.rect(fx - 1, fy - 3, 2, 6, { ember: 1 });
      c.rect(fx - 3, fy - 3 + spin * 4, 6, 2, { ember: 1 });
    }
    if (since >= 0 && since < 0.25) {
      const r = 3 + Math.round(since * 30);
      for (let k = -r; k <= r; k++) {
        c.put(tx + k, ty, { ember: 1 });
        c.put(tx, ty + k, { ember: 1 });
        c.put(tx + k * 0.7, ty + k * 0.7, { ember: 1 });
        c.put(tx + k * 0.7, ty - k * 0.7, { ember: 1 });
      }
    }
  }

  // Boxes: the enemy's top left, the player's above the dialog on the right.
  const bar = (x: number, y: number, len: number, v: number, p: Paint) => {
    c.text("HP", x, y, 1);
    c.frame(x + 9, y, len + 2, 5, 0.6);
    c.rect(x + 10, y + 1, Math.round(len * v), 3, p);
  };
  const ebx = lx + 8;
  if (!absent) {
    c.text("ERP SUITE", ebx, 6, 1);
    c.text("LV99", ebx + textWidth("ERP SUITE") + 6, 6, 0.6);
    bar(ebx, 14, compact ? 30 : 56, hp * (1 - fainting), { ember: 1 });
    c.rect(ebx, 22, compact ? 41 : 67, 1, 0.6);
  }
  const pbx = lx + lw - (compact ? 48 : 78);
  const pby = dy - 22;
  c.text("FORGERON", pbx, pby, 1);
  if (!compact) c.text("LV1", pbx + textWidth("FORGERON") + 6, pby, 0.6);
  bar(pbx, pby + 8, compact ? 30 : 56, 1, 1);
  c.rect(pbx + (compact ? 39 : 65), pby + 2, 1, 15, 0.6);

  // Dialog box, with the menu at its right and the next-line marker.
  c.rect(dx, dy, dwid, dh, 0.02);
  c.frame(dx, dy, dwid, dh, 1);
  c.frame(dx + 2, dy + 2, dwid - 4, dh - 4, 0.6);
  lines.forEach((ln, i) => c.text(ln, dx + 7, dy + 5 + i * 7, 1));
  if (menu) {
    const mx = dx + dwid - (compact ? 34 : 60);
    c.rect(mx - 6, dy, 1, dh, 1);
    if (blink) c.text(">", mx, dy + 5, { ember: 1 });
    c.text("FORGE", mx + 6, dy + 5, 1);
    c.text("RUN", mx + 6, dy + 12, 0.6);
  } else if (blink) c.text("~", dx + dwid - 12, dy + dh - 8, 1);
};

export const FLAT_SCENES: Readonly<Record<string, { draw: FlatScene; still: number }>> = {
  vulcan: { draw: vulcan, still: 1.2 },
  workshop: { draw: workshop, still: 19.5 },
  erp: { draw: erp, still: 9.2 },
};

// ---------------------------------------------------------------------------------------------
// Mounting: cells of 3 CSS pixels, 12 frames a second, paused off-screen, still under reduced motion.
// ---------------------------------------------------------------------------------------------

const CELL = 3;
const FPS = 12;

type Rgb = [number, number, number];

function parse(color: string): Rgb {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return [0, 0, 0];
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return [d[0]!, d[1]!, d[2]!];
}

export interface FlatCanvas {
  /** Draws a scene of `FLAT_SCENES`, or stops drawing with null. */
  show(scene: string | null): void;
}

export function mountFlat(el: HTMLCanvasElement): FlatCanvas {
  const ctx = el.getContext("2d");
  const off = document.createElement("canvas");
  const octx = off.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scene: string | null = null;
  let visible = true;
  let lastFrame = -1;
  let cells: Cells | null = null;
  let img: ImageData | null = null;
  let k = 1;
  const start = performance.now();
  const cache = new Map<string, Rgb>();
  const tone = (name: string, fallback: string): Rgb => {
    const v = getComputedStyle(el).getPropertyValue(name).trim() || fallback;
    let rgb = cache.get(v);
    if (!rgb) {
      rgb = parse(v);
      cache.set(v, rgb);
    }
    return rgb;
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    k = Math.max(1, Math.round(CELL * dpr));
    el.width = Math.round(el.clientWidth * dpr);
    el.height = Math.round(el.clientHeight * dpr);
    const w = Math.ceil(el.width / k);
    const h = Math.ceil(el.height / k);
    if (w < 1 || h < 1) return;
    cells = new Cells(w, h);
    off.width = w;
    off.height = h;
    img = octx?.createImageData(w, h) ?? null;
    lastFrame = -1;
  };

  const draw = (time: number) => {
    const s = scene ? FLAT_SCENES[scene] : undefined;
    if (!s || !cells || !img || !ctx || !octx) return;
    cells.l.fill(0);
    cells.a.fill(0);
    s.draw(cells, time);
    const bg = tone("--bg-sunk", "#050505");
    const dim = tone("--ink-dim", "#5e5e5e");
    const ink = tone("--ink", "#ededed");
    const ember = tone("--accent", "#ff4f1f");
    const tones = [bg, dim, ink];
    const { w, h, l, a } = cells;
    const d = img.data;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const th = bayer(x, y);
        const heat = a[i]!;
        let rgb: Rgb;
        if (heat > th) rgb = heat > 0.92 && (heat - 0.92) * 12 > th ? ink : ember;
        else {
          const v = clamp(l[i]!) * 2;
          const b = Math.floor(v);
          rgb = tones[Math.min(2, b + (v - b > th ? 1 : 0))]!;
        }
        d[i * 4] = rgb[0];
        d[i * 4 + 1] = rgb[1];
        d[i * 4 + 2] = rgb[2];
        d[i * 4 + 3] = 255;
      }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, w * k, h * k);
  };

  const tick = (now: number) => {
    requestAnimationFrame(tick);
    if (!scene || !visible || document.hidden) return;
    const s = FLAT_SCENES[scene];
    if (!s) return;
    if (still.matches) {
      if (lastFrame !== -2) draw(s.still);
      lastFrame = -2;
      return;
    }
    const frame = Math.floor(((now - start) / 1000) * FPS);
    if (frame === lastFrame) return;
    lastFrame = frame;
    draw(frame / FPS);
  };

  new ResizeObserver(resize).observe(el);
  new IntersectionObserver(([e]) => {
    visible = e?.isIntersecting ?? true;
  }).observe(el);
  resize();
  requestAnimationFrame(tick);

  return {
    show(name) {
      scene = name && FLAT_SCENES[name] ? name : null;
      lastFrame = -1;
    },
  };
}
