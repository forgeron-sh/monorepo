import type { PixelIcon } from "../types";

// A left and a right chevron around three dots in the secondary tone: an expandable range.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chevrons-left-right-ellipsis",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...#...#",
    "..#.....#",
    ".#.......#",
    "#..o.o.o..#",
    ".#.......#",
    "..#.....#",
    "...#...#",
  ],
};

export default icon;
