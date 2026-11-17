import type { PixelIcon } from "../types";

// Hot price: the tag of `tag-01` with a flame in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hot-price",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#....#",
    ".#.##..#",
    ".#.##...#",
    ".#....o..#",
    "..#..ooo..#",
    "...#.ooo.#",
    "....#...#",
    ".....#.#",
    "......#",
  ],
};

export default icon;
