import type { PixelIcon } from "../types";

// Calendar date: a calendar page showing the number one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-date-1",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    ".##########",
    ".##########",
    ".#........#",
    ".#..ooo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
