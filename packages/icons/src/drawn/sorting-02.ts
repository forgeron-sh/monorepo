import type { PixelIcon } from "../types";

// Sort: an arrow up beside an arrow down, one-pixel lines, heads of `sorting-a-z-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sorting-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#....#",
    "...###...#",
    "..#.#.#..#",
    "....#....#",
    "....#....#",
    "....#....#",
    "....#....#",
    "....#..#.#.#",
    "....#...###",
    "....#....#",
  ],
};

export default icon;
