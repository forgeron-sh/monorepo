import { bayer8 } from "./pixels";

// `canvas[data-dither]`: a slow ember field quantised with an 8×8 Bayer dither, the texture of the
// lab landing pages' heroes, drawn on a 2D canvas at low resolution. `data-px` sets the size of a
// pixel. It animates only while visible and stays still under `prefers-reduced-motion`.

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function token(name: string, fallback: string): [number, number, number] {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return rgb(v.startsWith("#") ? v : fallback);
}

function init(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const px = Number(canvas.dataset.px ?? 4);
  const bg = token("--bg", "#0a0a0a");
  const line = token("--line-strong", "#2e2e2e");
  const accent = token("--accent", "#ff4f1f");
  let image: ImageData | null = null;
  let raf = 0;
  let visible = false;
  const start = performance.now();

  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth / px));
    const h = Math.max(1, Math.round(canvas.clientHeight / px));
    canvas.width = w;
    canvas.height = h;
    image = ctx.createImageData(w, h);
  };

  const frame = () => {
    if (!image) return;
    const t = reducedMotion ? 0 : (performance.now() - start) / 1000;
    const { width: w, height: h, data } = image;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const v = y / h;
        // Heat rising from the bottom right, stirred by two slow waves.
        const glow = Math.max(0, 1 - Math.hypot((u - 0.92) * 1.3, (v - 1.05) * 1.6));
        const wave = 0.5 + 0.5 * Math.sin(u * 9 + t * 0.6 + Math.sin(v * 5 - t * 0.4) * 1.6);
        const level = glow * 0.9 + wave * 0.18 * glow + (1 - v) * 0.04;
        const d = bayer8(x, y);
        const color = level > d + 0.45 ? accent : level > d * 0.9 ? line : bg;
        const i = (y * w + x) * 4;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  };

  const loop = () => {
    frame();
    if (visible && !reducedMotion) raf = requestAnimationFrame(() => setTimeout(loop, 80));
  };

  resize();
  frame();
  new ResizeObserver(() => {
    resize();
    frame();
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    cancelAnimationFrame(raf);
    if (visible) loop();
  }).observe(canvas);
}

for (const canvas of document.querySelectorAll<HTMLCanvasElement>("canvas[data-dither]"))
  init(canvas);
