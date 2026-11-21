import type { PixelIcon } from "../types";

// The Coinbase mark: a thick C with a square counter, in the full-grid ring of `circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "coinbase",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..oooo..#",
    "#..oooooo..#",
    "#..oo......#",
    "#..oo......#",
    "#..oooooo..#",
    ".#..oooo..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
