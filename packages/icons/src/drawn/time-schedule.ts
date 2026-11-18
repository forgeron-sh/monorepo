import type { PixelIcon } from "../types";

// Clock with a play arrow badge in the secondary tone, lower right. Built on `clock-check`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-schedule",
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
    ".#.....o",
    ".#.....oo",
    ".#.....ooo",
    "..#....oo",
    "...##..o",
  ],
};

export default icon;
