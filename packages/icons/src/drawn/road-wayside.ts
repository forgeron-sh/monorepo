import type { PixelIcon } from "../types";

// Wayside: a road in perspective with a signpost beside it, the sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "road-wayside",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......ooooo",
    "..#..#.o...o",
    "..#..#.ooooo",
    ".#....#..#",
    ".#....#..#",
    "#......#.#",
    "#......#.#",
    "#......#.#",
    ".........#",
  ],
};

export default icon;
