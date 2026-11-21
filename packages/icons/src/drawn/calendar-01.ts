import type { PixelIcon } from "../types";

// Calendar: two rings, a header line, one day marked in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-01",
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
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
