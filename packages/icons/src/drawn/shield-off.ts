import type { PixelIcon } from "../types";

// Shield crossed by a 1:1 slash in the secondary tone; shield-plus base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-off",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o#########",
    ".#o.......#",
    ".#.o......#",
    ".#..o.....#",
    ".#...o....#",
    ".#....o...#",
    "..#....o.#",
    "...#....o",
    "....#..#.o",
    ".....##...o",
    "...........o",
  ],
};

export default icon;
