import type { PixelIcon } from "../types";

// Parking not allowed: the P of `parking-area-square` struck through.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-parking-off",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o#########",
    ".#o.......#",
    ".#.o####..#",
    ".#..o#.##.#",
    ".#..#o.##.#",
    ".#..##o#..#",
    ".#..##.o..#",
    ".#..##..o.#",
    ".#.......o#",
    ".#########o",
    "...........o",
  ],
};

export default icon;
