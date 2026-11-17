import type { PixelIcon } from "../types";

// Calendar with a plus badge: the calendar of `calendar-03` without its days, one column left, and a plus in the secondary tone in the lower right corner, cut out of the calendar with a one-pixel clearance (days made a face next to the badge).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-add-01",
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
    "#........o",
    "######.ooooo",
    ".........o",
    ".........o",
  ],
};

export default icon;
