import type { PixelIcon } from "../types";

// Clock of `clock-01` with an exclamation-mark badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-alert",
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
    ".#......o",
    "..#",
    "...##...o",
  ],
};

export default icon;
