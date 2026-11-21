import type { PixelIcon } from "../types";

// Clock with a check badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-check",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...#....#",
    ".#...#....#",
    ".#.###",
    ".#",
    ".#........o",
    ".#.......o",
    "..#...o.o",
    "...##..o",
  ],
};

export default icon;
