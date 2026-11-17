import type { PixelIcon } from "../types";

// A document and three axes badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-axis-3d",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#",
    ".#......o",
    ".#......o",
    ".#......ooo",
    ".#.....o",
    ".####.o",
  ],
};

export default icon;
