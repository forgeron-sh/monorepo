import type { PixelIcon } from "../types";

// Router: two antennas of different heights, a box, one light in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "router",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    ".##########",
    ".#........#",
    ".#.oo.....#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
