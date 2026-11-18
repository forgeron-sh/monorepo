import type { PixelIcon } from "../types";

// A fork and a knife crossed in an X.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "utensils-crossed",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "##.......#.#",
    "###......#.#",
    ".###.....###",
    "..###.....#",
    "...#.....#",
    "....#...#",
    ".....#.#",
    "......#",
    ".....#.#",
    "....#...#",
    "...#.....#",
    "..#.......#",
  ],
};

export default icon;
