import type { PixelIcon } from "../types";

// Right triangle: a one-pixel triangle with its right angle bottom left, marked in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "right-triangle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".##",
    ".#.#",
    ".#..#",
    ".#...#",
    ".#....#",
    ".#.....#",
    ".#oo....#",
    ".#.o.....#",
    ".##########",
  ],
};

export default icon;
