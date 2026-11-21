import type { PixelIcon } from "../types";

// Clock of `clock-hour-1` reading two o'clock: the long hand up, the short hand towards two.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-hour-2",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o....#",
    ".#...o....#",
    ".#...ooo..#",
    ".#...o....#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
