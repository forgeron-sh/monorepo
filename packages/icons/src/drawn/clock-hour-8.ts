import type { PixelIcon } from "../types";

// Clock of `clock-hour-1` reading eight o'clock: the long hand up, the short hand towards eight.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-hour-8",
  implemented: true,
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
    ".#...o....#",
    ".#.oo.....#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
