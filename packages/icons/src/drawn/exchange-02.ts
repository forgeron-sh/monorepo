import type { PixelIcon } from "../types";

// Two vertical arrows side by side, one up and one down, in half-turn symmetry.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "exchange-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "..###...#",
    ".#.#.#..#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#..#.#.#",
    "...#...###",
    "...#....#",
  ],
};

export default icon;
