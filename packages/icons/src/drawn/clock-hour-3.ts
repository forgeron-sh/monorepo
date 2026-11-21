import type { PixelIcon } from "../types";

// Clock of `clock-hour-1` reading three o'clock: the long hand up, the short hand towards three.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-hour-3",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o....#",
    ".#...o....#",
    ".#...o....#",
    ".#...ooo..#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
