import type { PixelIcon } from "../types";

// Calendar of `calendar-add-01` with the sync loop of `file-sync` in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-sync",
  implemented: true,
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
    "#......o...o",
    "######.oo..o",
    ".......o..oo",
    "........ooo",
  ],
};

export default icon;
