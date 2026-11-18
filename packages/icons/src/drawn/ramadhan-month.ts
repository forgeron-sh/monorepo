import type { PixelIcon } from "../types";

// Ramadan month: the calendar of `calendar-01` with a crescent in the secondary tone in place of the day.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ramadhan-month",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    ".##########",
    ".#........#",
    ".##########",
    ".#...ooo..#",
    ".#..oo....#",
    ".#..o.....#",
    ".#..oo....#",
    ".#...ooo..#",
    ".##########",
  ],
};

export default icon;
