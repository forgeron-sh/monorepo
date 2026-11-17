import type { PixelIcon } from "../types";

// A little dress with a sash at the waist.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "baby-girl-dress",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "...##..##",
    "...#....#",
    "...#....#",
    "...oooooo",
    "..#......#",
    "..#......#",
    ".#........#",
    ".#........#",
    "############",
  ],
};

export default icon;
