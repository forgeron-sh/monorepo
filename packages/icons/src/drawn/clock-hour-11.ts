import type { PixelIcon } from "../types";

// Clock of `clock-hour-1` reading eleven o'clock: the long hand up, the short hand towards eleven.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-hour-11",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o....#",
    ".#.o.o....#",
    ".#..oo....#",
    ".#...o....#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
