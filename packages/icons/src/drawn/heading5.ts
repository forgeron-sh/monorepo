import type { PixelIcon } from "../types";

// A heading of level 5: an H and the digit 5 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heading5",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#...#",
    ".#...#...ooo",
    ".#...#...o",
    ".#####...ooo",
    ".#...#.....o",
    ".#...#.....o",
    ".#...#...ooo",
  ],
};

export default icon;
