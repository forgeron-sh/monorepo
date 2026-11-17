import type { PixelIcon } from "../types";

// Sort 0 to 1: the down arrow of `arrow-down-a-z`, 0 above 1.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-0-1",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o...##",
    "..o..#..#",
    "..o..#..#",
    "..o...##",
    "..o",
    "..o",
    "..o...##",
    "o.o.o..#",
    ".ooo...#",
    "..o...###",
  ],
};

export default icon;
