import type { PixelIcon } from "../types";

// Central Shaheed Minar: a tall frame with a bowed head between two lower frames.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "central-shaheed-minar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "....#..#",
    "....#..#",
    "....#..#",
    "###.#..#.###",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "############",
  ],
};

export default icon;
