import type { PixelIcon } from "../types";

// Clear formatting: the T of `text` and a cross badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-clear",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#..##..#",
    "....##",
    "....##",
    "....##",
    "....##",
    "....##.o...o",
    "....##..o.o",
    "....##...o",
    "....##..o.o",
    ".......o...o",
  ],
};

export default icon;
