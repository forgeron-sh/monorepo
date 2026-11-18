import type { PixelIcon } from "../types";

// Small pen tool nib with a minus.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pen-tool-minus",
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
    ".######",
    ".#....#..ooo",
    ".######",
  ],
};

export default icon;
