import type { PixelIcon } from "../types";

// Calendar of `calendar-add-01` with a small person badge in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-user",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#....#",
    "##########",
    "##########",
    "#........#",
    "#........#",
    "#........#",
    "#",
    "#.......ooo",
    "#.......ooo",
    "######",
    "........ooo",
    ".......ooooo",
  ],
};

export default icon;
