import type { PixelIcon } from "../types";

// Calendar of `calendar-add-01` with a mortarboard badge in the lower-right corner: an academic calendar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-mortarboard",
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
  ],
};

export default icon;
