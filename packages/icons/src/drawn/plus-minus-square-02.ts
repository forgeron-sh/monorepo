import type { PixelIcon } from "../types";

// Plus and minus split: `square` cut by a diagonal, a plus above it and a minus below in the
// secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "plus-minus-square-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#.......##",
    ".#..o...#.#",
    ".#.ooo.#..#",
    ".#..o.#...#",
    ".#...#....#",
    ".#..#.ooo.#",
    ".#.#......#",
    ".##.......#",
    "..########",
  ],
};

export default icon;
