import type { PixelIcon } from "../types";

// Do not touch: the pointing hand of the set crossed by a slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "do-not-touch-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...........o",
    "..........o",
    ".........o",
    "....#...o",
    "....#..o",
    ".#..#.o.#.#",
    "..#.#o#####",
    "...#o######",
    "...o#######",
    "..o..#####",
    ".o",
    "o....#####",
  ],
};

export default icon;
