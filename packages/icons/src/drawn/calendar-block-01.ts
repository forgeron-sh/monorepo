import type { PixelIcon } from "../types";

// Calendar with a no-entry badge, in the badge corner of the calendar-* family.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-block-01",
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
    "#......o..oo",
    "######.o.o.o",
    ".......oo..o",
    "........ooo",
  ],
};

export default icon;
