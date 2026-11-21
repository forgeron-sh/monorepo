import type { PixelIcon } from "../types";

// Calendar with a heart badge, the frame and corner of `calendar-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-heart",
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
    "#......oo.oo",
    "#......ooooo",
    "######.ooooo",
    "........ooo",
    ".........o",
  ],
};

export default icon;
