import type { PixelIcon } from "../types";

// Cooling tower with a cloud of steam.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "nuclear-power",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oo.oo",
    "...oooooo",
    "",
    "..########",
    "..#......#",
    "...#....#",
    "...#....#",
    "...#....#",
    "..#......#",
    ".#........#",
    "############",
  ],
};

export default icon;
