import type { PixelIcon } from "../types";

// Keyframe aligned to the right: a diamond beside a guide line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "keyframe-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........o",
    "....##....o",
    "...#..#...o",
    "..#....#..o",
    ".#......#.o",
    ".#......#.o",
    "..#....#..o",
    "...#..#...o",
    "....##....o",
    "..........o",
  ],
};

export default icon;
