import { bayer } from "@forgeron/blueprint";
import { cx } from "./cx";
import { PixelText } from "./pixel-text";

/**
 * The anvil of the logo (viewBox 132): a square with a half-disc bite on the left and a teardrop
 * cut-out towards the top-right corner.
 */
function insideAnvil(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x > 132 || y > 132) return false;
  if (x * x + (y - 67) ** 2 < 33 * 33) return false;
  if (y < 100) {
    const edge = y <= 50.494 ? 132 - y : 102 - Math.sqrt(Math.max(0, 29 * 29 - (y - 71) ** 2));
    if (x > edge) return false;
  }
  return true;
}

/** Share of a grid cell covered by the anvil, sampled 4×4. */
function coverage(cx: number, cy: number, cell: number): number {
  let hits = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (insideAnvil(cx * cell + ((i + 0.5) * cell) / 4, cy * cell + ((j + 0.5) * cell) / 4))
        hits++;
    }
  }
  return hits / 16;
}

export type AnvilMode = "solid" | "dither" | "fade";

/**
 * Path data of the anvil on an `n`×`n` grid (viewBox `0 0 n n`). `solid`: plain pixels; `dither`:
 * the body in an ordered dither with a solid outline; `fade`: solid on the left, dissolving right.
 */
export function anvilPath(n: number, mode: AnvilMode = "solid"): string {
  const cell = 132 / n;
  const on: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) row.push(coverage(x, y, cell) >= 0.5);
    on.push(row);
  }
  const at = (x: number, y: number) => on[y]?.[x] ?? false;
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!at(x, y)) continue;
      if (mode === "dither") {
        const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
        if (!edge && bayer(x, y, 8) > 0.25 + 0.5 * (y / n)) continue;
      }
      if (mode === "fade" && bayer(x, y, 8) > 1.15 - (x / n) * 0.95) continue;
      d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

export interface LogoProps {
  /** `symbol`: the anvil alone; `horizontal`: the anvil and the "forgeron" wordmark. */
  variant?: "symbol" | "horizontal";
  /** Height of the anvil in px; the wordmark is half as tall. */
  size?: number;
  className?: string;
}

/** The pixel logo, in `currentColor` (`ink` by default): the anvil on a 12-pixel grid and the pixel wordmark. */
export function Logo({ variant = "horizontal", size = 22, className }: LogoProps) {
  const word = Math.round(size * 0.5);
  return (
    <span className={cx("fg-logo", className)} role="img" aria-label="Forgeron">
      <span className="fg-logo-mark" style={{ width: size, height: size }}>
        <svg viewBox="0 0 12 12" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
          <path d={anvilPath(12)} />
        </svg>
      </span>
      {variant === "horizontal" ? (
        <span className="fg-logo-word" style={{ height: word, width: Math.round(word * (47 / 7)) }}>
          <PixelText text="forgeron" />
        </span>
      ) : null}
    </span>
  );
}
