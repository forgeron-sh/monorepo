import type { PixelIcon } from "../types";

// Square sample with diagonal texture lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "material-and-texture",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#.....o..#",
    ".#....o..o#",
    ".#...o..o.#",
    ".#..o..o..#",
    ".#.o..o..o#",
    ".#o..o..o.#",
    ".#..o..o..#",
    ".#.o..o...#",
    "..########",
  ],
};

export default icon;
