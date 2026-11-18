import type { PixelIcon } from "../types";

// Heading 1: a one-pixel H with a small 1 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heading1",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#...#",
    ".#...#....o",
    ".#...#...oo",
    ".#####....o",
    ".#...#....o",
    ".#...#....o",
    ".#...#...ooo",
  ],
};

export default icon;
