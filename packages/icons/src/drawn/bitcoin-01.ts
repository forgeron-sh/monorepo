import type { PixelIcon } from "../types";

// Bitcoin sign in the full-grid ring of `circle`, in the secondary tone like `dollar-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bitcoin-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#.oooo...#",
    "#..oo.oo...#",
    "#..ooooo...#",
    "#..oo..oo..#",
    "#..oo..oo..#",
    ".#.ooooo..#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
