import type { PixelIcon } from "../types";

// Clock with an arrow-down badge, the cut clock of `clock-plus`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-arrow-down",
  implemented: true,
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
    ".#......o",
    ".#......o",
    ".#....o.o.o",
    "..#....ooo",
    "...##...o",
  ],
};

export default icon;
