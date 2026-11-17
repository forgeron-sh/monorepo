import type { PixelIcon } from "../types";

// Heading 3: a one-pixel H with a small 3 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heading3",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#...#",
    ".#...#...ooo",
    ".#...#.....o",
    ".#####....oo",
    ".#...#.....o",
    ".#...#.....o",
    ".#...#...ooo",
  ],
};

export default icon;
