import type { PixelIcon } from "../types";

// Code: two angle brackets and a steep slash in the secondary tone, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "code",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......o",
    "...#..o.#",
    "..#...o..#",
    ".#....o...#",
    ".#...o....#",
    "..#..o...#",
    "...#.o..#",
    ".....o",
  ],
};

export default icon;
