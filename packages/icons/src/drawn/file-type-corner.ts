import type { PixelIcon } from "../types";

// File with a capital T badge at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-type-corner",
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
    ".#....ooooo",
    ".#......o",
    ".#......o",
    ".#......o",
    ".####...o",
  ],
};

export default icon;
