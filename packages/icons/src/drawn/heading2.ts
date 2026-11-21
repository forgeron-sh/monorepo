import type { PixelIcon } from "../types";

// Heading 2: a one-pixel H with a small 2 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heading2",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#...#",
    ".#...#...ooo",
    ".#...#.....o",
    ".#####...ooo",
    ".#...#...o",
    ".#...#...o",
    ".#...#...ooo",
  ],
};

export default icon;
