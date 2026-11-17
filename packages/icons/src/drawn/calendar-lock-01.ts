import type { PixelIcon } from "../types";

// Calendar with a padlock badge: `calendar-add-01` with a small solid padlock.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-lock-01",
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
    "#",
    "#.......ooo",
    "#.......o.o",
    "#......ooooo",
    "######.oo.oo",
    ".......ooooo",
  ],
};

export default icon;
