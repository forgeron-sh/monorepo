import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`shield`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "shield-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.......o#",
    ".#......o.#",
    ".#.o...o..#",
    ".#..o.o...#",
    "..#..o...#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
