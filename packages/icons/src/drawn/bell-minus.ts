import type { PixelIcon } from "../types";

// Bell with a small minus in the secondary tone, top right like `bell-dot`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bell-minus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##.ooo",
    "....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".##########",
    "",
    ".....##",
  ],
};

export default icon;
