import type { PixelIcon } from "../types";

// Pine tree: a triangle with 2:1 sides, the trunk in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pine-tree",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    ".##########",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
