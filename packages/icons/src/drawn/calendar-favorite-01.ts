import type { PixelIcon } from "../types";

// Calendar with a star badge, the base of `calendar-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-favorite-01",
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
    "#........o",
    "#......ooooo",
    "######..ooo",
    "........ooo",
    ".......o...o",
  ],
};

export default icon;
