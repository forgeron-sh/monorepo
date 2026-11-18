import type { PixelIcon } from "../types";

// Magnifier in a box, the magnifier in the secondary tone, centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oo....#",
    ".#.o..o...#",
    ".#.o..o...#",
    ".#..oo....#",
    ".#.....o..#",
    ".#......o.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
