import type { PixelIcon } from "../types";

// Small pen tool nib with a plus.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pen-tool-add",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##",
    "..#..#",
    ".#....#",
    ".#....#",
    "#..##..#",
    "#..##..#",
    "#......#",
    ".#....#",
    ".######...o",
    ".#....#..ooo",
    ".######...o",
  ],
};

export default icon;
