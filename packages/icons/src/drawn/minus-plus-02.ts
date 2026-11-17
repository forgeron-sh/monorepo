import type { PixelIcon } from "../types";

// Plus and minus split by a slash, a +/- key.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "minus-plus-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...#",
    "...#",
    ".#####..#",
    "...#...#",
    "...#..#",
    ".....#",
    "....#",
    "...#..#####",
  ],
};

export default icon;
