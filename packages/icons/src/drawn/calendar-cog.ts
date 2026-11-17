import type { PixelIcon } from "../types";

// Calendar with a cog badge, the frame and corner of `calendar-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-cog",
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
    "#.......o.o",
    "#......ooooo",
    "######.oo.oo",
    ".......ooooo",
    "........o.o",
  ],
};

export default icon;
