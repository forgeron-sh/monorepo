import type { PixelIcon } from "../types";

// Discount tag: an upright price tag with its hole, a percent sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "discount-tag-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#..##..#",
    ".#........#",
    ".#........#",
    ".#.o...o..#",
    ".#....o...#",
    ".#...o....#",
    ".#..o...o.#",
    ".##########",
  ],
};

export default icon;
