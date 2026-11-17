import type { PixelIcon } from "../types";

// The tooth with a brace wire and two brackets across it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dental-braces",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".#..####..#",
    ".#........#",
    ".#oooooooo#",
    ".#.oo..oo.#",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "...#....#",
  ],
};

export default icon;
