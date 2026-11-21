import type { PixelIcon } from "../types";

// Sort Z to A: `arrow-down-a-z` with the letters swapped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-za",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o..####",
    "..o....#",
    "..o...#",
    "..o..####",
    "..o",
    "..o",
    "..o...##",
    "o.o.o#..#",
    ".ooo.####",
    "..o..#..#",
  ],
};

export default icon;
