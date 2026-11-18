import type { PixelIcon } from "../types";

// The Digg wordmark in pixels, 16×16: the blocky lowercase "digg" of the logo, square bowls with
// a tall stem on the d, the dotted i, and the two g with their slot at the baseline and the bar
// of the descender. The mark is only a wordmark and its letters are what make it; on 12×12 the
// four letters and their gaps need 13 columns, so it takes the brand-mark grid of 16.
// 16×16: 16 × 10 pixels (1.6:1, the logo is 1.67:1). Drawn on 2026-11-18.
// Rasterised from the reference `simple-icons:digg` (Iconify, 2026-11-18), then redrawn by hand:
// walls one pixel, counters two pixels wide so the bowls stay open, gaps of one pixel between the
// letters. Monotone. Digg and the Digg logo are trademarks of Digg, Inc., used here only to refer
// to Digg.
const icon: PixelIcon = {
  name: "digg",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...#.#",
    "...#.#",
    "...#",
    "####.#.####.####",
    "#..#.#.#..#.#..#",
    "#..#.#.#..#.#..#",
    "#..#.#.#..#.#..#",
    "####.#.####.####",
    "..........#....#",
    ".......####.####",
  ],
};

export default icon;
