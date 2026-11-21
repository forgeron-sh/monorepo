/**
 * The Forgeron media kit for X/Twitter: the banner (1500×500) and the avatar (400×400).
 *
 * Built only from what the landing uses: the `field` generator of `@forgeron/blueprint` (fractal
 * noise through an 8×8 ordered dither, cells with a one-pixel gap), the official anvil of
 * `@forgeron/ui` (`anvilPath(12)`), the pixel wordmark (`textSvg`) and the corner brackets of the
 * landing's cards. Orange is kept for the anvil alone.
 *
 *   bun docs/prototypes/twitter-banner/kit.ts
 */
import { writeFileSync } from "node:fs";
import { textSvg } from "../../../packages/font/src/index.ts";
import { anvilPath } from "../../../packages/ui/src/logo.tsx";
import { png } from "./png.ts";

type Rgb = readonly [number, number, number];
const hex = (h: string): Rgb =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as unknown as Rgb;
const BG = hex("#0a0a0a");
const LINE = hex("#2e2e2e"); // --line-strong
const DIM = hex("#5e5e5e"); // --ink-dim
const MUTED = hex("#8f8f8f"); // --ink-muted
const INK = hex("#ededed");
const ACCENT = hex("#ff4f1f");

class Picture {
  readonly px: Uint8Array;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.px = new Uint8Array(w * h * 3);
    this.rect(0, 0, w, h, BG);
  }
  rect(x: number, y: number, w: number, h: number, c: Rgb) {
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++)
        this.px.set(c, (j * this.w + i) * 3);
  }
  /** Cells of an SVG path made of `M x y h1v1h-1z` squares, `s` pixels each. */
  cells(d: string, x: number, y: number, s: number, c: Rgb) {
    for (const m of d.matchAll(/M(\d+) (\d+)h1/g))
      this.rect(x + Number(m[1]) * s, y + Number(m[2]) * s, s, s, c);
  }
  save(name: string) {
    const file = new URL(name, import.meta.url).pathname;
    writeFileSync(file, png(this.px, this.w, this.h));
    console.log(file);
  }
}

// --- The `field` generator, ported to the CPU (same formula; the noise is ours, not the GPU's). ---

const hash = (x: number, y: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const noise = (x: number, y: number) => {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(i, j) + (hash(i + 1, j) - hash(i, j)) * u;
  const b = hash(i, j + 1) + (hash(i + 1, j + 1) - hash(i, j + 1)) * u;
  return a + (b - a) * v;
};
const fbm = (x: number, y: number) => {
  let v = 0;
  let a = 0.5;
  for (let k = 0; k < 5; k++) {
    v += a * noise(x, y);
    x = x * 2.03 + 1.7;
    y = y * 2.03 + 9.2;
    a *= 0.5;
  }
  return v;
};
const BAYER8 = (() => {
  const m: number[] = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      let v = 0;
      for (let bit = 0; bit < 3; bit++) {
        const xb = (x >> bit) & 1;
        const yb = (y >> bit) & 1;
        v |= ((xb ^ yb) << (2 * (2 - bit) + 1)) | (yb << (2 * (2 - bit)));
      }
      m.push(v / 64);
    }
  return m;
})();
const bayer8 = (x: number, y: number) => BAYER8[(y & 7) * 8 + (x & 7)]!;

/**
 * The field over the whole picture: two dithered tones (line-strong, then ink-dim where the noise
 * peaks), cells of `cell` pixels with a one-pixel gap on the right and top as in the shader.
 */
function field(p: Picture, cell: number, scale: number, gain: number, seed: [number, number]) {
  const cw = Math.ceil(p.w / cell);
  const ch = Math.ceil(p.h / cell);
  const aspect = p.w / p.h;
  for (let cy = 0; cy < ch; cy++)
    for (let cx = 0; cx < cw; cx++) {
      const u = ((cx + 0.5) * cell) / p.w;
      const v = 1 - ((cy + 0.5) * cell) / p.h;
      const n = fbm(u * aspect * scale + seed[0], v * scale + seed[1]) * gain - 0.12;
      const t = bayer8(cx, cy);
      const tone = n > t + 0.32 ? DIM : n > t ? LINE : null;
      if (tone) p.rect(cx * cell, cy * cell + 1, cell - 1, cell - 1, tone);
    }
}

/** A card frame: a 1-pixel rule and bolder brackets on the four corners, as on the landing. */
function frame(
  p: Picture,
  x: number,
  y: number,
  w: number,
  h: number,
  o: { tick: number; weight: number },
) {
  p.rect(x, y, w, h, BG);
  p.rect(x, y, w, 1, LINE);
  p.rect(x, y + h - 1, w, 1, LINE);
  p.rect(x, y, 1, h, LINE);
  p.rect(x + w - 1, y, 1, h, LINE);
  const { tick: L, weight: k } = o;
  for (const [cx, cy, sx, sy] of [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ] as const) {
    p.rect(sx > 0 ? cx : cx - L, sy > 0 ? cy : cy - k, L, k, MUTED);
    p.rect(sx > 0 ? cx : cx - k, sy > 0 ? cy : cy - L, k, L, MUTED);
  }
}

const ANVIL = anvilPath(12);
const WORD = textSvg("FORGERON", { bold: true });
const WORD_W = Number(/viewBox="0 0 (\d+) /.exec(WORD)?.[1] ?? 55);
const WORD_D = /\sd="([^"]*)"/.exec(WORD)?.[1] ?? "";

// --- Banner: the field everywhere, the lockup in a framed card at the centre. ---
{
  const p = new Picture(1500, 500);
  field(p, 6, 2.6, 0.78, [3.1, 7.4]);
  const A = 6; // anvil cell, px: 72 px tall
  const S = 5; // wordmark cell: 35 px tall, half the anvil as in the navbar logo
  const gap = 28;
  const lockW = 12 * A + gap + WORD_W * S;
  const lockH = 12 * A;
  const padX = 48;
  const padY = 36;
  const fw = lockW + padX * 2;
  const fh = lockH + padY * 2;
  const fx = Math.round((p.w - fw) / 2);
  const fy = Math.round((p.h - fh) / 2);
  frame(p, fx, fy, fw, fh, { tick: 16, weight: 3 });
  const lx = fx + padX;
  const ly = fy + padY;
  p.cells(ANVIL, lx, ly, A, ACCENT);
  p.cells(WORD_D, lx + 12 * A + gap, ly + Math.round((lockH - 7 * S) / 2), S, INK);
  p.save("forgeron-banner.png");
}

// --- Plain banner: the field alone, nothing on it. ---
{
  const p = new Picture(1500, 500);
  field(p, 6, 2.6, 0.78, [3.1, 7.4]);
  p.save("forgeron-banner-field.png");
}

// --- Slogan banner: the hero title of the landing, in the pixel face, over the field. ---
{
  const p = new Picture(1500, 500);
  field(p, 6, 2.6, 0.78, [3.1, 7.4]);
  const S = 7; // one font pixel: 49 px a line
  const lines = ["FORGE YOUR", "INTERNAL TOOLS."].map((t) => {
    const svg = textSvg(t);
    return {
      w: Number(/viewBox="0 0 (\d+) /.exec(svg)?.[1] ?? 0),
      d: /\sd="([^"]*)"/.exec(svg)?.[1] ?? "",
    };
  });
  const lead = 7 + 4; // rows per line, gap included
  const blockW = Math.max(...lines.map((l) => l.w));
  const blockH = (lines.length * lead - 4) * S;
  const x0 = Math.round((p.w - blockW * S) / 2);
  const y0 = Math.round((p.h - blockH) / 2);
  // Keep the field off the letters: clear the block and a margin around it.
  p.rect(x0 - 3 * S, y0 - 3 * S, (blockW + 6) * S, blockH + 6 * S, BG);
  lines.forEach((l, k) => p.cells(l.d, x0, y0 + k * lead * S, S, INK));
  p.save("forgeron-banner-slogan.png");
}

// --- Avatar: the anvil over the field, centred for the round crop. ---
{
  const p = new Picture(400, 400);
  field(p, 6, 2.2, 0.8, [5.3, 1.9]);
  const A = 14; // 168 px: the corners stay well inside the round crop
  const o = Math.round((400 - 12 * A) / 2);
  // Keep the field off the anvil: a thin black margin that follows its outline.
  const M = 8;
  for (const m of ANVIL.matchAll(/M(\d+) (\d+)h1/g))
    p.rect(o + Number(m[1]) * A - M, o + Number(m[2]) * A - M, A + 2 * M, A + 2 * M, BG);
  p.cells(ANVIL, o, o, A, ACCENT);
  p.save("forgeron-avatar.png");
}
