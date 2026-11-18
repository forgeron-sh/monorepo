import type { PixelIcon } from "../types";

// Calendar with a clock badge, the frame and corner of `calendar-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-clock",
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
    "#......o.o.o",
    "######.o.ooo",
    ".......o...o",
    "........ooo",
  ],
};

export default icon;
