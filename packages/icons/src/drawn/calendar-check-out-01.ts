import type { PixelIcon } from "../types";

// Calendar with an arrow leaving it, in the badge corner of the calendar-* family.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-check-out-01",
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
    "#.........o",
    "######.ooooo",
    "..........o",
    ".........o",
  ],
};

export default icon;
