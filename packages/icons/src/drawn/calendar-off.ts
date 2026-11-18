import type { PixelIcon } from "../types";

// Calendar of `calendar-01` crossed by a slash in the secondary tone: no calendar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o.#....#",
    ".#o#######",
    ".#.o.....#",
    ".###o#####",
    ".#...o...#",
    ".#....o..#",
    ".#.....o.#",
    ".#......o#",
    ".#.......o",
    ".########.o",
    "...........o",
  ],
};

export default icon;
