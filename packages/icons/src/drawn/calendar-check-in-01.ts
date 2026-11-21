import type { PixelIcon } from "../types";

// Calendar with a check badge: `calendar-add-01` with a check mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-check-in-01",
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
    "#..........o",
    "#.........o",
    "#........o",
    "#####.o.o",
    ".......o",
  ],
};

export default icon;
