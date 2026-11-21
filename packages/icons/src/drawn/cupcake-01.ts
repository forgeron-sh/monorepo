import type { PixelIcon } from "../types";

// A cupcake: a cherry on a frosting dome over a ribbed paper case.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cupcake-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "...######",
    "..#......#",
    ".#........#",
    "#..........#",
    "############",
    ".#..#..#..#",
    ".#..#..#..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..########",
  ],
};

export default icon;
