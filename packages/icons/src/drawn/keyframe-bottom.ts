import type { PixelIcon } from "../types";

// Keyframe aligned to the bottom: a diamond over a guide line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "keyframe-bottom",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    "",
    ".oooooooooo",
  ],
};

export default icon;
