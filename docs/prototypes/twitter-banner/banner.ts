/**
 * Twitter/X banners in the lab language: a night over a mountain pass, painted into two cell
 * buffers (light and ember) and thresholded by a 4×4 Bayer matrix into four tokens, exactly like
 * `apps/site/src/illustrations/flat.ts`. Writes 1500×500 PNGs next to this file.
 *
 *   bun docs/prototypes/twitter-banner/banner.ts
 */
import { writeFileSync } from "node:fs";
import { png } from "./png.ts";
import { textSvg } from "../../../packages/font/src/index.ts";

const OUT_W = 1500;
const OUT_H = 500;
const CELL = 4;
const W = OUT_W / CELL;
const H = Math.ceil(OUT_H / CELL);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)]!;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (k: number) => k * k * (3 - 2 * k);

function hash(x: number, y: number, seed = 0): number {
  let h =
    (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 1D value noise, smooth, in [0, 1]. */
function noise(x: number, seed: number): number {
  const i = Math.floor(x);
  return lerp(hash(i, 0, seed), hash(i + 1, 0, seed), smooth(x - i));
}
function noise2(x: number, y: number, seed: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const u = smooth(x - i);
  const v = smooth(y - j);
  return lerp(
    lerp(hash(i, j, seed), hash(i + 1, j, seed), u),
    lerp(hash(i, j + 1, seed), hash(i + 1, j + 1, seed), u),
    v,
  );
}
const fbm2 = (x: number, y: number, seed: number) =>
  noise2(x, y, seed) * 0.55 +
  noise2(x * 2.1, y * 2.1, seed + 1) * 0.3 +
  noise2(x * 4.3, y * 4.3, seed + 2) * 0.15;
const fbm = (x: number, seed: number, oct = 4) => {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let o = 0; o < oct; o++) {
    v += a * noise(x * f, seed + o * 17);
    a *= 0.5;
    f *= 2.07;
  }
  return v;
};

// ---------------------------------------------------------------------------------------------
// Buffers
// ---------------------------------------------------------------------------------------------

const L = new Float32Array(W * H);
/** Solid cells that skip the dither: 0 none, 1 accent, 2 ink, 3 dim. */
const S = new Uint8Array(W * H);
const solid = (x: number, y: number, k: number) => {
  if (x >= 0 && y >= 0 && x < W && y < H) S[Math.floor(y) * W + Math.floor(x)] = k;
};
const A = new Float32Array(W * H);
const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
const set = (x: number, y: number, v: number) => {
  x = Math.floor(x);
  y = Math.floor(y);
  if (!inside(x, y)) return;
  L[y * W + x] = v;
  A[y * W + x] = 0;
};
const add = (x: number, y: number, v: number) => {
  x = Math.floor(x);
  y = Math.floor(y);
  if (inside(x, y)) L[y * W + x] = clamp(L[y * W + x]! + v);
};
const ember = (x: number, y: number, v: number) => {
  x = Math.floor(x);
  y = Math.floor(y);
  if (inside(x, y)) A[y * W + x] = Math.max(A[y * W + x]!, v);
};
const rect = (x: number, y: number, w: number, h: number, v: number) => {
  for (let j = Math.round(y); j < Math.round(y + h); j++)
    for (let i = Math.round(x); i < Math.round(x + w); i++) set(i, j, v);
};
const line = (x0: number, y0: number, x1: number, y1: number, v: number, dash = 0) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let k = 0; k <= n; k++) {
    if (dash && Math.floor(k / dash) % 2 === 1) continue;
    set(Math.round(lerp(x0, x1, k / n)), Math.round(lerp(y0, y1, k / n)), v);
  }
};
/** Ember (or light) falling off from a centre, stretched horizontally by `sx`. */
const glow = (cx: number, cy: number, r: number, heat: number, sx = 1, light = false) => {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r * sx); x <= cx + r * sx; x++) {
      const d = Math.hypot((x + 0.5 - cx) / sx, y + 0.5 - cy) / r;
      if (d >= 1) continue;
      const v = heat * (1 - d) ** 1.6;
      if (light) add(x, y, v);
      else ember(x, y, v);
    }
};

// ---------------------------------------------------------------------------------------------
// Pieces of landscape
// ---------------------------------------------------------------------------------------------

interface Range {
  ridge: (x: number) => number;
  fill: number;
  edge: number;
  snow?: number; // ridge height (y) above which peaks keep snow
  hatch?: boolean;
}

/** A mountain range: body, a one-cell crest, snow on the peaks, hatched faces under the moon. */
function range({ ridge, fill, edge, snow, hatch }: Range) {
  // Light per column from the averaged slope, so faces turn smoothly instead of striping.
  const light = (x: number) => {
    let s = 0;
    for (let k = -4; k <= 4; k++) s += ridge(x + k + 1) - ridge(x + k - 1);
    return clamp(0.5 + (s / 9) * 0.9);
  };
  for (let x = 0; x < W; x++) {
    const r = ridge(x);
    const top = Math.round(r);
    const lit = light(x);
    for (let y = Math.max(0, top); y < H; y++) {
      const d = y - r;
      let v = fill;
      if (hatch) {
        // Lit faces: diagonal hatching that thins out downwards, like a plate engraving.
        const k = clamp(1 - d / 30) * lit;
        if ((x - y + 400) % 4 === 0 && hash(x, y, 9) < k * 1.1) v = 0.5;
      }
      if (snow !== undefined && r < snow) {
        const depth = (snow - r) * 0.42 + 1 + fbm(x * 0.25, 5) * 4;
        // Couloirs: snow running further down in streaks.
        const streak = 0;
        if (d < depth + streak) {
          const fade = clamp((depth + streak - d) / 3);
          v = Math.max(v, lerp(0.22, 0.95, lit) * (streak && d > depth ? 0.7 : 1) * fade);
        }
      }
      set(x, y, v);
    }
    // Crest: join the step with the neighbours so the line has no holes.
    const a = Math.round(ridge(x - 1));
    for (let y = Math.min(top, a); y <= Math.max(top, a); y++) set(x, y, edge);
  }
}

/** A pine: black body in drooping tiers, outlined in dim, snow on the tips. */
function pine(cx: number, base: number, h: number, snowy = true) {
  const tiers = Math.max(3, Math.round(h / 5));
  const tierH = h / tiers;
  const rows: number[] = [];
  for (let y = 0; y < h; y++) {
    const t = Math.floor(y / tierH);
    const k = (y - t * tierH) / tierH;
    rows.push(Math.round((0.5 + (t / tiers) * 0.55 + k * 0.35) * h * 0.3));
  }
  rows.forEach((hw, y) => {
    const py = base - h + y;
    for (let x = -hw; x <= hw; x++) set(cx + x, py, 0);
    const prev = rows[y - 1] ?? -1;
    // Outline: the step out of each tier, and its ends.
    for (let x = prev + 1; x <= hw; x++) {
      set(cx + x, py, snowy && x === hw ? 0.8 : 0.5);
      set(cx - x, py, 0.5);
    }
    set(cx + hw, py, 0.5);
    set(cx - hw, py, 0.5);
  });
  set(cx, base - h - 1, 0.5);
  rect(cx, base, 1, 2, 0);
}

/** The forge in the pass: a shed, a lit door and windows, a chimney, smoke and sparks. */
function forge(cx: number, ground: number, heat = 1) {
  // Glow on the snow and the ground around.
  glow(cx, ground - 2, 22, 0.42 * heat, 1.6);
  rect(cx - 9, ground - 7, 19, 7, 0);
  // Roof, stepped.
  for (let k = 0; k < 4; k++) rect(cx - 11 + k, ground - 8 - k, 23 - 2 * k, 1, k === 3 ? 0.75 : 0);
  line(cx - 11, ground - 8, cx - 8, ground - 11, 0.75);
  line(cx + 11, ground - 8, cx + 8, ground - 11, 0.75);
  // Door and windows: ember.
  for (let y = ground - 5; y < ground; y++) for (let x = cx - 1; x <= cx + 1; x++) ember(x, y, 1);
  for (const wx of [cx - 6, cx + 5])
    for (let y = ground - 5; y < ground - 3; y++)
      for (let x = wx; x < wx + 2; x++) ember(x, y, 0.85);
  // Light spilling out of the door onto the ground.
  for (let k = 1; k < 7; k++)
    for (let x = -1 - k; x <= 1 + k; x++) ember(cx + x, ground + k - 1, 0.7 - k * 0.09);
  // Chimney.
  const chx = cx + 5;
  rect(chx, ground - 17, 3, 7, 0);
  set(chx - 1, ground - 17, 0.6);
  set(chx + 3, ground - 17, 0.6);
  ember(chx + 1, ground - 18, 1);
  // Smoke: a dithered plume leaning left with the wind.
  for (let s = 0; s < 70; s++) {
    const t = s / 70;
    const px = chx + 1 - s * 0.55 - Math.sin(s * 0.18) * 3;
    const py = ground - 19 - s * 0.62;
    const r = 1.5 + t * 7;
    for (let y = Math.floor(py - r); y <= py + r; y++)
      for (let x = Math.floor(px - r); x <= px + r; x++) {
        const d = Math.hypot(x - px, y - py) / r;
        if (d < 1) add(x, y, 0.035 * (1 - d) * (1 - t));
      }
  }
  // Sparks: single ember cells above the chimney.
  for (let k = 0; k < 16; k++) {
    const sx = chx + 1 + Math.round((hash(k, 1, 4) - 0.5) * 14);
    const sy = ground - 20 - Math.round(hash(k, 2, 4) * 20);
    ember(sx, sy, 0.6 + hash(k, 3, 4) * 0.4);
  }
}

/** Stars, the Milky Way and a crescent moon. */
function sky(opts: { moon?: [number, number]; band?: boolean; dense?: number }) {
  const dense = opts.dense ?? 1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // A faint diagonal band of dust: sparse dim cells, more stars inside.
      let band = 0;
      if (opts.band) {
        const u = (x - W * 0.2) * 0.32 + (y - H * 0.95) * 0.95;
        band = Math.exp(-((u / 11) ** 2)) * (0.4 + fbm(x * 0.06 + y * 0.03, 21) * 0.9);
        L[y * W + x] = Math.max(L[y * W + x]!, clamp(band * 0.16 * (0.3 + hash(x, y, 7))));
      }
      const p = hash(x, y, 1);
      if (p < 0.006 * dense * (1 + band * 4)) set(x, y, p < 0.0022 * dense ? 1 : 0.5);
    }
  // A few bright stars as small crosses.
  for (let k = 0; k < 18 * dense; k++) {
    const sx = Math.floor(hash(k, 5, 3) * W);
    const sy = Math.floor(hash(k, 6, 3) * H * 0.55);
    set(sx, sy, 1);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const)
      set(sx + dx, sy + dy, 0.55);
    if (k % 4 === 0)
      for (const d of [2, -2]) {
        set(sx + d, sy, 0.5);
        set(sx, sy + d, 0.5);
      }
  }
  if (opts.moon) {
    const [mx, my] = opts.moon;
    glow(mx, my, 34, 0.22, 1, true);
    const R = 9;
    for (let y = -R; y <= R; y++)
      for (let x = -R; x <= R; x++) {
        if (x * x + y * y > R * R) continue;
        const cut = (x + 5) ** 2 + (y - 3) ** 2 <= (R - 1) ** 2;
        set(mx + x, my + y, cut ? 0 : 1);
      }
  }
}

/** A road winding up to the pass, in dashes, with a lamp at each bend. */
function road(points: [number, number][], lamps = true) {
  for (let k = 0; k + 1 < points.length; k++) {
    const [x0, y0] = points[k]!;
    const [x1, y1] = points[k + 1]!;
    line(x0, y0, x1, y1, 0.5, 2);
  }
  if (lamps)
    for (const [x, y] of points.slice(1, -1)) {
      rect(x, y - 3, 1, 3, 0.5);
      ember(x, y - 4, 1);
      glow(x, y - 3, 5, 0.35);
    }
}

// ---------------------------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------------------------

const PASS_X = Math.round(W * 0.6);

/** Main range with a col at PASS_X: two massifs and a U between them. */
const mainRidge = (passY: number, peakL: number, peakR: number) => (x: number) => {
  const left = peakL + Math.abs(x - W * 0.34) * 0.42;
  const right = peakR + Math.abs(x - W * 0.82) * 0.5;
  const col = passY + ((x - PASS_X) / 26) ** 2 * 6;
  const base = Math.min(left, right, col);
  const jag = (fbm(x * 0.09, 3) - 0.5) * 12 + (fbm(x * 0.35, 4) - 0.5) * 3;
  const nearCol = clamp(1 - Math.abs(x - PASS_X) / 22);
  return Math.max(base, Math.min(left, right)) * 0 + base + jag * (1 - nearCol * 0.8);
};

const farRidge = (x: number) =>
  H * 0.5 + (fbm(x * 0.03, 30) - 0.5) * 40 + (fbm(x * 0.2, 31) - 0.5) * 6;

function clear() {
  L.fill(0);
  A.fill(0);
  S.fill(0);
}

const VARIANTS: Record<string, () => void> = {
  /** A: the forge alone in the pass, under the Milky Way. */
  col() {
    clear();
    sky({ moon: [Math.round(W * 0.88), 22], band: true });
    range({ ridge: farRidge, fill: 0.08, edge: 0.5 });
    const passY = Math.round(H * 0.6);
    glow(PASS_X, passY + 6, 40, 0.3, 2.6);
    const ridge = mainRidge(passY, H * 0.16, H * 0.24);
    range({ ridge, fill: 0, edge: 0.75, snow: H * 0.42, hatch: true });
    forge(PASS_X, Math.round(ridge(PASS_X)) + 1);
    // Foothills with pines, the road climbing between them.
    const hillL = (x: number) =>
      H * 0.82 - Math.max(0, (W * 0.45 - x) * 0.12) + (fbm(x * 0.06, 41) - 0.5) * 6;
    const hillR = (x: number) =>
      H * 0.86 - Math.max(0, (x - W * 0.72) * 0.16) + (fbm(x * 0.06, 42) - 0.5) * 6;
    const hill = (x: number) => Math.min(hillL(x), hillR(x));
    road([
      [PASS_X - 4, H - 1],
      [PASS_X + 22, H * 0.9],
      [PASS_X - 18, H * 0.8],
      [PASS_X + 14, H * 0.72],
      [PASS_X - 6, H * 0.665],
      [PASS_X - 1, ridge(PASS_X) + 1],
    ]);
    range({ ridge: hill, fill: 0, edge: 0.5 });
    for (let k = 0; k < 46; k++) {
      const x = Math.floor(hash(k, 1, 50) * W);
      if (Math.abs(x - PASS_X) < 30) continue;
      pine(x, Math.round(hill(x)) + 3, 8 + Math.floor(hash(k, 2, 50) * 14));
    }
  },

  /** B: the valley — moon on the left, a works lit at the foot of the pass. */
  vallee() {
    clear();
    sky({ moon: [Math.round(W * 0.14), 20], band: true, dense: 1.1 });
    range({ ridge: farRidge, fill: 0.08, edge: 0.5 });
    const passY = Math.round(H * 0.56);
    glow(PASS_X, passY + 2, 40, 0.35, 2.4);
    const ridge = mainRidge(passY, H * 0.2, H * 0.14);
    range({ ridge, fill: 0, edge: 0.75, snow: H * 0.42, hatch: true });
    const hill = (x: number) =>
      H * 0.84 + (fbm(x * 0.05, 43) - 0.5) * 10 - Math.max(0, x - W * 0.85) * 0.2;
    range({ ridge: hill, fill: 0, edge: 0.5 });
    const fx = Math.round(W * 0.7);
    forge(fx, Math.round(hill(fx)) + 1, 0.8);
  },

  /** C: the glow — the whole sky behind the pass catches the forge's light. */
  aube() {
    clear();
    sky({ band: false, dense: 1.3 });
    // Ember rising from behind the pass, falling off upwards.
    const passY = Math.round(H * 0.62);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const d = Math.hypot((x - PASS_X) / 2.6, (y - passY) * 1.3) / 70;
        if (d < 1) ember(x, y, 1.05 * (1 - d) ** 1.8);
      }
    range({ ridge: (x) => farRidge(x) + 6, fill: 0.08, edge: 0.5 });
    const ridge = mainRidge(passY, H * 0.12, H * 0.2);
    range({ ridge, fill: 0, edge: 0.75, snow: H * 0.42, hatch: true });
    // A silhouette walking up to the pass, with a hammer on the shoulder.
    const fx = PASS_X - 14;
    const fy = Math.round(ridge(fx)) - 1;
    rect(fx, fy - 6, 2, 4, 0.75); // body
    set(fx, fy - 7, 0.75);
    set(fx + 1, fy - 7, 0.75);
    set(fx, fy - 8, 0.75);
    set(fx + 1, fy - 8, 0.75); // head
    set(fx, fy - 2, 0.75);
    set(fx + 1, fy - 1, 0.75);
    set(fx - 1, fy - 1, 0.75); // legs
    line(fx + 2, fy - 6, fx + 4, fy - 9, 0.75); // handle
    rect(fx + 3, fy - 11, 3, 2, 0.75); // head of the hammer
    const hill = (x: number) => H * 0.84 + (fbm(x * 0.05, 44) - 0.5) * 12;
    range({ ridge: hill, fill: 0, edge: 0.5 });
    for (let k = 0; k < 50; k++) {
      const x = Math.floor(hash(k, 1, 70) * W);
      pine(x, Math.round(hill(x)) + 3, 8 + Math.floor(hash(k, 2, 70) * 14));
    }
  },
  /** D: the works — a foundry at night, a ladle pouring, stacks smoking into the stars. */
  usine() {
    clear();
    sky({ dense: 0.9 });
    const G = H - 14; // ground line

    // Far skyline in haze: blocks, a gasometer, a cooling tower.
    const far = (x: number) => {
      const b = Math.floor(x / 11);
      let top = G - 14 - Math.floor(hash(b, 0, 80) * 16);
      if (x > W * 0.08 && x < W * 0.16) top = Math.min(top, G - 34 + Math.abs(x - W * 0.12) * 0.3);
      return top;
    };
    for (let x = 0; x < W; x++)
      for (let y = far(x); y < G; y++) set(x, y, (x + y) % 3 === 0 ? 0.24 : 0.1);
    // Cooling tower: a waisted shape, hatched, with a slow plume.
    const ctx = Math.round(W * 0.82);
    for (let y = G - 46; y < G; y++) {
      const k = (y - (G - 46)) / 46;
      const hw = 9 + 5 * (2 * k - 1) ** 2 + k * 3;
      for (let x = -hw; x <= hw; x++)
        set(ctx + x, y, (x + y) % 4 === 0 || Math.abs(x) >= hw - 0.5 ? 0.45 : 0.08);
    }
    for (let s = 0; s < 80; s++) {
      const t = s / 80;
      const px = ctx - s * 0.9;
      const py = G - 50 - s * 0.35 - Math.sin(s * 0.12) * 3;
      const r = 6 + t * 10;
      for (let y = Math.floor(py - r); y <= py + r; y++)
        for (let x = Math.floor(px - r); x <= px + r; x++) {
          const d = Math.hypot(x - px, (y - py) * 1.3) / r;
          if (d < 1) add(x, y, 0.03 * (1 - d) * (1 - t * 0.7));
        }
    }

    // The foundry hall: saw-tooth roof, hatched wall, rows of lit windows.
    const hx0 = Math.round(W * 0.18);
    const hx1 = Math.round(W * 0.62);
    const roof = G - 30;
    rect(hx0, roof, hx1 - hx0, G - roof, 0);
    for (let x = hx0; x < hx1; x++) {
      const k = (x - hx0) % 14;
      const peak = roof - Math.round((k / 13) * 9);
      for (let y = peak; y < roof; y++) set(x, y, k === 13 ? 0.5 : 0);
      set(x, peak, 0.75);
      if (k === 13) for (let y = peak; y < roof; y++) ember(x - 1, y, 0.55); // north lights glowing
    }
    line(hx0, roof, hx0, G - 1, 0.5);
    line(hx1 - 1, roof, hx1 - 1, G - 1, 0.5);
    for (let x = hx0; x < hx1; x++)
      for (let y = roof; y < G; y++)
        if ((x - y + 400) % 5 === 0 && hash(x, y, 81) < 0.35) set(x, y, 0.42);
    for (let wx = hx0 + 4; wx < hx1 - 6; wx += 7)
      for (const wy of [roof + 5, roof + 13])
        for (let y = wy; y < wy + 4; y++)
          for (let x = wx; x < wx + 3; x++) if (hash(wx, wy, 82) < 0.8) solid(x, y, 1);
    // Great door, open, light spilling on the yard.
    const dx = Math.round((hx0 + hx1) / 2) - 8;
    for (let y = G - 14; y < G; y++)
      for (let x = dx; x < dx + 16; x++)
        solid(x, y, y < G - 12 || x < dx + 1 || x > dx + 14 ? 2 : 1);
    for (let k = 0; k < 12; k++)
      for (let x = dx - k * 2; x < dx + 16 + k * 2; x++) ember(x, G + k, 0.7 - k * 0.055);

    // Stacks, with ember mouths and long smoke.
    for (const [sx, sh, sw] of [
      [hx0 + 10, 62, 4],
      [hx0 + 24, 52, 3],
      [hx1 - 16, 70, 5],
    ] as const) {
      rect(sx, G - sh, sw, sh, 0);
      for (let y = G - sh; y < roof - 9; y++) {
        set(sx - 1, y, 0.5);
        set(sx + sw, y, 0.5);
      }
      for (let y = G - sh + 4; y < roof - 9; y += 8) rect(sx - 1, y, sw + 2, 1, 0.75);
      set(sx - 1, G - sh, 0.6);
      set(sx + sw, G - sh, 0.6);
      for (let x = sx; x < sx + sw; x++) ember(x, G - sh - 1, 1);
      glow(sx + sw / 2, G - sh - 2, 7, 0.45);
      for (let s = 0; s < 110; s++) {
        const t = s / 110;
        const px = sx + sw / 2 + s * 0.85;
        const py = G - sh - 3 - s * 0.28 - Math.sin(s * 0.1 + sx) * 3;
        const r = 1.5 + t * 9;
        for (let y = Math.floor(py - r); y <= py + r; y++)
          for (let x = Math.floor(px - r); x <= px + r; x++) {
            const d = Math.hypot(x - px, y - py) / r;
            if (d < 1) add(x, y, 0.045 * (1 - d) * (1 - t));
          }
      }
    }

    // Gantry crane over the yard on the right, a ladle tipping molten metal into a mould.
    const gx0 = hx1 + 8;
    const gx1 = Math.round(W * 0.77);
    const beam = G - 40;
    for (const lx of [gx0, gx1]) {
      line(lx, beam, lx, G - 1, 0.6);
      line(lx + 3, beam, lx + 3, G - 1, 0.6);
      for (let y = beam + 2; y + 4 < G; y += 5) line(lx, y, lx + 3, y + 4, 0.5);
      line(lx + 3, y, lx, y + 4, 0.5);
    }
    rect(gx0 - 2, beam - 3, gx1 - gx0 + 8, 1, 0.75);
    rect(gx0 - 2, beam, gx1 - gx0 + 8, 1, 0.75);
    for (let x = gx0; x < gx1 + 4; x += 4) line(x, beam - 2, x + 2, beam - 1, 0.5);
    const lx = Math.round((gx0 + gx1) / 2) - 2;
    line(lx, beam + 1, lx - 4, beam + 12, 0.5);
    line(lx, beam + 1, lx + 4, beam + 12, 0.5);
    // Ladle: tipped bucket.
    for (let y = 0; y < 8; y++) {
      const hw = 6 - Math.floor(y / 3);
      for (let x = -hw; x <= hw; x++)
        set(lx + x + Math.round(y * 0.4), beam + 12 + y, Math.abs(x) === hw ? 0.75 : 0);
    }
    for (let x = -5; x < 6; x++) ember(lx + x, beam + 12, 1);
    // Pour: a bright stream into the mould, sparks around.
    const px0 = lx - 7;
    for (let y = beam + 12; y < G - 4; y++) {
      ember(px0 + Math.round((y - beam - 12) * 0.08), y, 1);
      ember(px0 + 1 + Math.round((y - beam - 12) * 0.08), y, 0.9);
    }
    rect(px0 - 6, G - 4, 14, 4, 0);
    for (let x = px0 - 5; x < px0 + 7; x++) ember(x, G - 4, 1);
    glow(px0, G - 5, 14, 0.4, 1.4);
    for (let k = 0; k < 18; k++) {
      const a = hash(k, 1, 90) * Math.PI;
      const r = 3 + hash(k, 2, 90) * 16;
      ember(px0 + Math.cos(a) * r * 1.4, G - 5 - Math.sin(a) * r, 0.7 + hash(k, 3, 90) * 0.3);
    }

    // Ground, rails and a little engine pulling an ingot wagon.
    rect(0, G, W, H - G, 0);
    for (let x = 0; x < W; x++) set(x, G, 0.5);
    for (let x = 0; x < W; x++) {
      set(x, G + 7, 0.6);
      if (x % 4 === 0) rect(x, G + 8, 2, 1, 0.42);
    }
    const box = (x: number, y: number, w: number, h: number, v = 0.6) => {
      rect(x, y, w, h, 0);
      rect(x, y, w, 1, v);
      rect(x, y + h - 1, w, 1, v);
      rect(x, y, 1, h, v);
      rect(x + w - 1, y, 1, h, v);
    };
    const ex = Math.round(W * 0.84);
    const ry = G + 7; // rail
    box(ex, ry - 8, 22, 6); // boiler
    box(ex + 14, ry - 15, 9, 13); // cab
    rect(ex + 13, ry - 16, 11, 1, 0.75); // cab roof
    for (let y = ry - 13; y < ry - 10; y++) for (let x = ex + 17; x < ex + 21; x++) solid(x, y, 1); // cab window
    box(ex + 3, ry - 14, 4, 6); // funnel
    rect(ex + 2, ry - 15, 6, 1, 0.75);
    for (const wx of [ex + 4, ex + 11, ex + 18]) {
      rect(wx - 2, ry - 2, 5, 2, 0);
      rect(wx - 2, ry - 2, 5, 1, 0.6);
      set(wx, ry - 1, 0.6);
    }
    ember(ex - 1, ry - 6, 1); // lamp
    glow(ex - 1, ry - 6, 6, 0.4);
    // Wagon of ingots, glowing.
    box(ex - 22, ry - 6, 18, 4);
    for (let x = ex - 20; x < ex - 6; x++) if ((x - ex) % 5 !== 0) solid(x, ry - 7, 1);
    for (const wx of [ex - 18, ex - 8]) {
      rect(wx - 1, ry - 2, 3, 1, 0.6);
      set(wx, ry - 1, 0.6);
    }
    rect(ex - 4, ry - 4, 4, 1, 0.6);
    // Puffs from the funnel.
    for (let s = 0; s < 36; s++) {
      const px = ex + 5 + s * 1.1;
      const py = ry - 17 - s * 0.35 - Math.sin(s * 0.4) * 1.5;
      const r = 1.2 + s * 0.16;
      for (let y = Math.floor(py - r); y <= py + r; y++)
        for (let x = Math.floor(px - r); x <= px + r; x++)
          if (Math.hypot(x - px, y - py) < r) add(x, y, 0.055 * (1 - s / 36));
    }
  },

  /** E: the Forgeron account — the anvil and the wordmark, sparks rising, hatched rails. */
  forgeron() {
    clear();
    // A sparse dust field, denser low down where the heat is.
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = hash(x, y, 101);
        if (p < 0.004 + (y / H) * 0.004) set(x, y, p < 0.0015 ? 0.9 : 0.5);
      }
    // Heat rising from the bottom edge, in a broad dithered ember.
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (y >= H - 10) continue;
        const k = (y - H * 0.6) / (H * 0.32);
        if (k <= 0) continue;
        const n = fbm2(x * 0.045, y * 0.09 - x * 0.004, 102);
        ember(x, y, clamp(k * (n - 0.4) * 2.2));
      }
    // Hatched rails across the top and bottom, closed by a line on each side, as on the site.
    const rail = (y0: number, h: number) => {
      for (let x = 0; x < W; x++) {
        set(x, y0, 0.5);
        set(x, y0 + h - 1, 0.5);
        for (let y = y0 + 1; y < y0 + h - 1; y++) set(x, y, (x - y + 400) % 4 === 0 ? 0.5 : 0);
      }
    };
    rail(4, 6);
    rail(H - 10, 6);

    // Lockup: anvil (14-cell grid × 2) then the wordmark (7 rows × 2), centred.
    const N = 14;
    const SC = 2;
    const insideAnvil = (x: number, y: number) => {
      if (x < 0 || y < 0 || x > 132 || y > 132) return false;
      if (x * x + (y - 67) ** 2 < 33 * 33) return false;
      if (y < 100) {
        const edge = y <= 50.494 ? 132 - y : 102 - Math.sqrt(Math.max(0, 29 * 29 - (y - 71) ** 2));
        if (x > edge) return false;
      }
      return true;
    };
    const anvil: boolean[][] = [];
    for (let gy = 0; gy < N; gy++) {
      const row: boolean[] = [];
      for (let gx = 0; gx < N; gx++) {
        let hits = 0;
        const cell = 132 / N;
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 4; j++)
            if (insideAnvil(gx * cell + ((i + 0.5) * cell) / 4, gy * cell + ((j + 0.5) * cell) / 4))
              hits++;
        row.push(hits >= 8);
      }
      anvil.push(row);
    }
    const svg = textSvg("FORGERON", { bold: true });
    const [, , tw, th] = (/viewBox="([^"]*)"/.exec(svg)?.[1] ?? "0 0 0 0").split(" ").map(Number);
    const word = [...svg.matchAll(/M(\d+) (\d+)h1/g)].map(
      (m) => [Number(m[1]), Number(m[2])] as const,
    );
    const gap = 8;
    const total = N * SC + gap + tw! * SC;
    const x0 = Math.round((W - total) / 2);
    const ay = Math.round(H / 2 - (N * SC) / 2);
    const wy = ay + Math.round((N * SC - th! * SC) / 2);
    // A dark plate behind the lockup so the heat and dust stay off the letters.
    for (let y = ay - 6; y < ay + N * SC + 6; y++)
      for (let x = x0 - 10; x < x0 + total + 10; x++) {
        L[y * W + x] = 0;
        A[y * W + x] = 0;
      }
    anvil.forEach((row, gy) =>
      row.forEach((on, gx) => {
        if (on)
          for (let j = 0; j < SC; j++)
            for (let i = 0; i < SC; i++) solid(x0 + gx * SC + i, ay + gy * SC + j, 1);
      }),
    );
    const tx = x0 + N * SC + gap;
    for (const [cx, cy] of word)
      for (let j = 0; j < SC; j++)
        for (let i = 0; i < SC; i++) solid(tx + cx * SC + i, wy + cy * SC + j, 2);
    // Sparks rising from the anvil's face.
    for (let k = 0; k < 26; k++) {
      const sx = x0 + 6 + Math.round((hash(k, 1, 103) - 0.3) * 40);
      const sy = ay - 8 - Math.round(hash(k, 2, 103) ** 1.5 * 24);
      if (sy > 10) ember(sx, sy, 0.65 + hash(k, 3, 103) * 0.35);
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Rendering and PNG
// ---------------------------------------------------------------------------------------------

type Rgb = [number, number, number];
const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
const BG = hex("#050505");
const DIM = hex("#5e5e5e");
const INK = hex("#ededed");
const EMBER = hex("#ff4f1f");

function render(): Uint8Array {
  const px = new Uint8Array(OUT_W * OUT_H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const th = bayer(x, y);
      const heat = A[i]!;
      let rgb: Rgb;
      if (S[i]) rgb = [EMBER, INK, DIM][S[i]! - 1]!;
      else if (heat > th) rgb = heat > 0.92 && (heat - 0.92) * 12 > th ? INK : EMBER;
      else {
        const v = clamp(L[i]!) * 2;
        const b = Math.floor(v);
        rgb = [BG, DIM, INK][Math.min(2, b + (v - b > th ? 1 : 0))]!;
      }
      for (let dy = 0; dy < CELL; dy++)
        for (let dx = 0; dx < CELL; dx++) {
          const oy = y * CELL + dy;
          const ox = x * CELL + dx;
          if (oy >= OUT_H || ox >= OUT_W) continue;
          px.set(rgb, (oy * OUT_W + ox) * 3);
        }
    }
  return px;
}

const only = process.argv[2];
for (const [name, paint] of Object.entries(VARIANTS)) {
  if (only && only !== name) continue;
  paint();
  const file = new URL(`banner-${name}.png`, import.meta.url).pathname;
  writeFileSync(file, png(render(), OUT_W, OUT_H));
  console.log(file);
}
