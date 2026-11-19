// The burn of forgeron.sh's opening story (apps/site/src/pages/index.astro, `paintBurn` and
// `paintReveal`), copied here as a looping demo: the site drives it from the scroll and the hero's
// clip, which only that page has. Two fronts on one canvas laid over a picture:
//
// - `close`: a rectangle of fire closes from the whole frame onto a band; outside it the page;
//   across its edge a two-ring fringe dithered by the 4×4 Bayer matrix in 4 px cells (outer ring
//   5 cells of 16 left, inner 11), and embers along the line: white hot, ember, red, sparks;
// - `open`: the picture spreads from the centre through the same fringe, behind a lobed front
//   whose lobes drift, with specks in white and greys only.
//
// The fringe's cells are a `bayer-mask` preset of @forgeron/shaders (`bayerMaskPath`): the cells
// of the 4×4 Bayer tile eaten at a level, 4 px each, written at build time (lib/shaders.ts) and
// passed in as `fringe`.

/** Fixed phases of the open front's lobes (the site draws them at random on each load). */
const LOBES = [1.3, 4.1, 2.7, 5.9];
const P = 4;

export interface BurnOptions {
  mode: "close" | "open";
  /** SVG paths of the fringe's eaten cells, by level (5 and 11). */
  fringe: Readonly<Record<number, string>>;
  /** One run of the front, then a short hold, in milliseconds. */
  period?: number;
  /** A still frame half-way through. */
  still?: boolean;
}

const rnd = (a: number, b: number, c: number) => {
  let h =
    (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (q: number) => q * q * (3 - 2 * q);

export function mountBurn(
  canvas: HTMLCanvasElement,
  options: BurnOptions,
): { destroy(): void } | null {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const ctx: CanvasRenderingContext2D = context;
  const css = getComputedStyle(canvas);
  const tone = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const bg = tone("--bg", "#0a0a0a");
  const period = options.period ?? 4200;
  const reduced = options.still ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The fringe: a 16 px tile where the cells at or above `level` are painted in the background.
  const patterns = new Map<number, CanvasPattern | null>();
  const eaten = (level: number) => {
    const known = patterns.get(level);
    if (known !== undefined) return known;
    const tile = document.createElement("canvas");
    tile.width = tile.height = 16;
    const t2 = tile.getContext("2d");
    if (!t2) return null;
    t2.fillStyle = bg;
    // Whole 4 px squares: the path fills exactly the pixels `fillRect` did.
    t2.fill(new Path2D(options.fringe[level] ?? ""));
    const pattern = ctx.createPattern(tile, "repeat");
    patterns.set(level, pattern);
    return pattern;
  };

  const ring = (l: number, t: number, r: number, b: number, o: number, F: number) => {
    ctx.fillRect(l + o, t + o, r - l - 2 * o, F);
    ctx.fillRect(l + o, b - o - F, r - l - 2 * o, F);
    ctx.fillRect(l + o, t + o + F, F, Math.max(0, b - t - 2 * o - 2 * F));
    ctx.fillRect(r - o - F, t + o + F, F, Math.max(0, b - t - 2 * o - 2 * F));
  };

  function paintClose(k: number, now: number, W: number, H: number) {
    const band = Math.round(H * 0.34);
    const target = { l: 0, t: Math.round((H - band) / 2), r: W, b: Math.round((H + band) / 2) };
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * k);
    const l = lerp(0, target.l);
    const t = lerp(0, target.t);
    const r = lerp(W, target.r);
    const b = lerp(H, target.b);
    // Outside the front: the page.
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, t);
    ctx.fillRect(0, b, W, H - b);
    ctx.fillRect(0, t, l, b - t);
    ctx.fillRect(r, t, W - r, b - t);
    if (k <= 0 || k >= 1) return;
    const outer = eaten(5);
    const inner = eaten(11);
    if (outer) {
      ctx.fillStyle = outer;
      ring(l, t, r, b, 0, 16);
    }
    if (inner) {
      ctx.fillStyle = inner;
      ring(l, t, r, b, 16, 16);
    }
    const colours = [
      tone("--ink", "#ededed"),
      tone("--accent", "#ff4f1f"),
      tone("--danger", "#ff6b81"),
    ];
    // A slow tick: each ember keeps its place for a while, so the edge glows rather than fizzes.
    const tick = Math.floor(now / 180);
    // Catches over the first fifth of the close, dies down over the second half.
    const life = smooth(clamp((1 - k) / 0.5)) * smooth(clamp(k / 0.2));
    const edges: [number, number, number, number, number, number][] = [
      [l, t, r - l, 1, 0, -1],
      [l, b, r - l, 1, 0, 1],
      [l, t, b - t, 0, -1, 0],
      [r, t, b - t, 0, 1, 0],
    ];
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    for (const [x0, y0, len, ax, nx, ny] of edges) {
      for (let u = 0; u < len; u += P) {
        const n = Math.sin(u * 0.05 + now * 0.0012) * 3 + Math.sin(u * 0.017 - now * 0.0006) * 5;
        const bx = x0 + (ax ? u : 0);
        const by = y0 + (ax ? 0 : u);
        for (let d = -2; d < 5; d++) {
          if (rnd(u + x0 + y0, d, tick) > (0.5 - d * 0.07) * life) continue;
          const off = 24 - n - d * P;
          paths[d < 0 ? 0 : d < 2 ? 1 : 2]?.rect(
            Math.round((bx - nx * off) / P) * P,
            Math.round((by - ny * off) / P) * P,
            P,
            P,
          );
        }
        if (rnd(u + x0, y0 + 7, tick) < 0.025 * life) {
          const fly = 6 + rnd(u, 3, tick) * 40;
          paths[1 + Math.floor(rnd(u, 5, tick) * 2)]?.rect(
            Math.round((bx + nx * fly) / P) * P,
            Math.round((by + ny * fly) / P) * P,
            P - 1,
            P - 1,
          );
        }
      }
    }
    paths.forEach((path, i) => {
      ctx.fillStyle = colours[i] ?? "#fff";
      ctx.fill(path);
    });
  }

  const AMP = 0.18;
  const SIDES = 144;
  const lobe = (th: number, now: number) =>
    (Math.sin(th * 3 + (LOBES[0] ?? 0) + now * 0.0004) * 0.55 +
      Math.sin(th * 5 + (LOBES[1] ?? 0) - now * 0.0007) * 0.3 +
      Math.sin(th * 9 + (LOBES[2] ?? 0) + now * 0.001) * 0.2 +
      Math.sin(th * 17 + (LOBES[3] ?? 0)) * 0.1) /
    1.15;
  const outline = (path: Path2D, cx: number, cy: number, R: number, now: number, inset = 0) => {
    for (let i = 0; i < SIDES; i++) {
      const th = (i / SIDES) * Math.PI * 2;
      const r = Math.max(0, R * (1 + AMP * lobe(th, now)) - inset);
      const x = cx + Math.cos(th) * r;
      const y = cy + Math.sin(th) * r;
      if (i) path.lineTo(x, y);
      else path.moveTo(x, y);
    }
    path.closePath();
  };

  function paintOpen(k: number, now: number, W: number, H: number) {
    const cx = W / 2;
    const cy = H / 2;
    const reach = Math.hypot(W, H) / 2 / (1 - AMP) + 48;
    const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
    const R = e * reach;
    // The fringe widens as the front nears the edges: 12 px a ring at the centre, 24 by the edge.
    const Wr = Math.round((12 + 12 * e) / P) * P;
    // Outside the front: the page.
    const outside = new Path2D();
    outside.rect(0, 0, W, H);
    outline(outside, cx, cy, R, now);
    ctx.fillStyle = bg;
    ctx.fill(outside, "evenodd");
    if (k >= 1) return;
    const band = (i0: number, i1: number) => {
      const path = new Path2D();
      outline(path, cx, cy, R, now, i0);
      outline(path, cx, cy, R, now, i1);
      return path;
    };
    const outer = eaten(5);
    const inner = eaten(11);
    if (outer) {
      ctx.fillStyle = outer;
      ctx.fill(band(0, Wr), "evenodd");
    }
    if (inner) {
      ctx.fillStyle = inner;
      ctx.fill(band(Wr, 2 * Wr), "evenodd");
    }
    const greys = [
      tone("--ink", "#ededed"),
      tone("--ink-muted", "#a0a0a0"),
      tone("--ink-dim", "#5a5a5a"),
    ];
    const tick = Math.floor(now / 120);
    const life = smooth(clamp((1 - k) / 0.35));
    const spread = Wr / 16;
    const steps = Math.max(24, Math.ceil((Math.PI * 2 * R * (1 + AMP)) / P));
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    for (let i = 0; i < steps; i++) {
      const th = (i / steps) * Math.PI * 2;
      const nx = Math.cos(th);
      const ny = Math.sin(th);
      const edge = R * (1 + AMP * lobe(th, now));
      const n =
        (Math.sin(th * 9 + now * 0.002) * 3 + Math.sin(th * 23 - now * 0.0011) * 4) * spread;
      for (let d = -2; d < 5; d++) {
        if (rnd(i, d, tick) > (0.5 - d * 0.07) * life) continue;
        const rr = edge - Wr * 1.5 + n - d * P * spread;
        paths[d < 0 ? 0 : d < 2 ? 1 : 2]?.rect(
          Math.round((cx + nx * rr) / P) * P,
          Math.round((cy + ny * rr) / P) * P,
          P,
          P,
        );
      }
      if (rnd(i, 7, tick) < 0.03 * life) {
        const fly = (6 + rnd(i, 3, tick) * 40) * spread;
        paths[1 + Math.floor(rnd(i, 5, tick) * 2)]?.rect(
          Math.round((cx + nx * (edge + fly)) / P) * P,
          Math.round((cy + ny * (edge + fly)) / P) * P,
          P - 1,
          P - 1,
        );
      }
    }
    paths.forEach((path, i) => {
      ctx.fillStyle = greys[i] ?? "#fff";
      ctx.fill(path);
    });
  }

  let raf = 0;
  let visible = false;
  const start = performance.now();
  const paint = (now: number) => {
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    // A run of the front, a hold on the result, then again.
    const hold = 900;
    const phase = reduced ? period / 2 : (now - start) % (period + hold);
    const k = clamp(phase / period);
    if (options.mode === "close") paintClose(k, now, W, H);
    else paintOpen(k, now, W, H);
  };
  const loop = (now: number) => {
    paint(now);
    if (visible) raf = requestAnimationFrame(loop);
  };
  paint(start);
  const sized = new ResizeObserver(() => paint(performance.now()));
  sized.observe(canvas);
  const seen = new IntersectionObserver(([entry]) => {
    const on = entry?.isIntersecting ?? false;
    if (on && !visible && !reduced) {
      visible = true;
      raf = requestAnimationFrame(loop);
    } else if (!on) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  });
  seen.observe(canvas);
  return {
    destroy() {
      visible = false;
      cancelAnimationFrame(raf);
      sized.disconnect();
      seen.disconnect();
    },
  };
}
