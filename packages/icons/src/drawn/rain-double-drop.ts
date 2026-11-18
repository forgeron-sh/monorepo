import type { PixelIcon } from "../types";

// Two raindrops, one high on the left and one low on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rain-double-drop",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..#.#",
    "..#.#",
    ".#...#",
    ".#...#..#",
    "..###..#.#",
    ".......#.#",
    "......#...#",
    "......#...#",
    ".......###",
  ],
};

export default icon;
