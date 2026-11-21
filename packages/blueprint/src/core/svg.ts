import { SLOT_NAMES } from "./frame";
import { cssColor } from "./palette";
import { render, type RenderOptions, type Rendered } from "./render";
import type { SceneSource } from "./types";

/**
 * Drawn side of one pixel, in CSS pixels, under a grid: whole pixels so that the SVG and the
 * canvas leave the same gaps (never less than one pixel drawn).
 */
export function gridCell(pixel: number, gap: number): number {
  return gap > 0 ? Math.max(1, Math.floor(pixel * (1 - gap))) : pixel;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A rendered frame as static SVG: one path per palette slot, `fill` as `var(--token, fallback)`
 * so the picture follows the theme without JavaScript. The viewBox is the raster: one unit per
 * pixel, scaled by CSS. Without a grid, runs of a row merge into one rectangle; with a grid, each
 * pixel is a square smaller than its cell.
 */
export function toSvg(rendered: Rendered, options: { title?: string } = {}): string {
  const { frame, plan } = rendered;
  const { width, height, color } = frame;
  const size = gridCell(plan.pixel, plan.gap) / plan.pixel;
  const paths: string[][] = SLOT_NAMES.map(() => []);
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const c = color[y * width + x] ?? 0;
      if (c === 0) {
        x++;
        continue;
      }
      const bucket = paths[c - 1];
      if (size < 1) {
        bucket?.push(`M${x} ${y}h${size}v${size}h-${size}z`);
        x++;
        continue;
      }
      let run = 1;
      while (x + run < width && color[y * width + x + run] === c) run++;
      bucket?.push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  const title = options.title ? `<title>${escape(options.title)}</title>` : "";
  const aria = options.title ? 'role="img"' : 'aria-hidden="true"';
  const body = SLOT_NAMES.map((name, i) => {
    const d = paths[i]?.join("") ?? "";
    return d ? `<path fill="${escape(cssColor(plan.colors[name]))}" d="${d}"/>` : "";
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" ${aria}>${title}${body}</svg>`;
}

/** Renders a source and returns its static SVG: for the build and server rendering. */
export function renderSvg(
  source: SceneSource,
  options: RenderOptions & { title?: string },
): string {
  return toSvg(render(source, options), { title: options.title });
}
