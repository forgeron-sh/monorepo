import type { PixelIcon } from "../types";

// Tags: a price tag with its hole, the edge of a second tag behind it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tags",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#####.#",
    "#....#.#",
    "#.oo..#.#",
    "#.oo...#.#",
    ".#......#.#",
    "..#....#.#",
    "...#..#.#",
    "....##.#",
    "......#",
  ],
};

export default icon;
