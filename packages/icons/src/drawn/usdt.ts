import type { PixelIcon } from "../types";

// The Tether mark: a T whose stem crosses a wide bar, in the full-grid ring of `bitcoin-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "usdt",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#..oooo..#",
    ".#...oo...#",
    "#..oooooo..#",
    "#.o..oo..o.#",
    "#..oooooo..#",
    "#....oo....#",
    ".#...oo...#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
