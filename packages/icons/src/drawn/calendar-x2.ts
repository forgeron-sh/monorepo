import type { PixelIcon } from "../types";

// Calendar: the calendar of calendar-add-01, a cross in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-x2",
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
    "#......o...o",
    "#.......o.o",
    "######...o",
    "........o.o",
    ".......o...o",
  ],
};

export default icon;
