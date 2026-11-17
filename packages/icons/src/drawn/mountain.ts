import type { PixelIcon } from "../types";

// Mountains: a tall peak with a snow cap in the secondary tone and a smaller one beside it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mountain",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....o",
    "...o.o",
    "..#...#",
    "..#...#.#",
    ".#.....#.#",
    ".#........#",
    "#..........#",
    "############",
  ],
};

export default icon;
