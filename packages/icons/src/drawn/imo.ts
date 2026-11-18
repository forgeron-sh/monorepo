import type { PixelIcon } from "../types";

// The imo mark: a speech bubble with the word imo inside and a tail at the lower left.
// 16×16: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "imo",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "...##########",
    ".##..........##",
    "#..............#",
    "#..#...........#",
    "#..............#",
    "#..#.####..###.#",
    "#..#.#.#.#.#.#.#",
    "#..#.#.#.#.#.#.#",
    "#..#.#.#.#.###.#",
    "#..............#",
    ".##..........##",
    "..#.#########",
    "..##",
    "..#",
  ],
};

export default icon;
