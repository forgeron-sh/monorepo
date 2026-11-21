import type { PixelIcon } from "../types";

// Calendar of `calendar-01` with a cross inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-x-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..o..o..#",
    ".##########",
  ],
};

export default icon;
