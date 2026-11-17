import type { PixelIcon } from "../types";

// Calendar with a download arrow badge, the base of `calendar-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-download-01",
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
    "######.o.o.o",
    "........ooo",
    ".........o",
  ],
};

export default icon;
