import type { PixelIcon } from "../types";

// Calendar with a minus badge: `calendar-add-01` with a minus.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-remove-01",
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
    "#........#",
    "#........#",
    "#",
    "######.ooooo",
  ],
};

export default icon;
