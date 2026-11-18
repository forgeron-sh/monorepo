import type { PixelIcon } from "../types";

// Paper clip: an outer U, an inner U and a free inner leg, eight columns wide and rows 1-10
// (redrawn on 2026-11-17: the first version used ten columns and the full height and looked larger
// than its neighbours).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "attachment-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "..#....#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#..##..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
