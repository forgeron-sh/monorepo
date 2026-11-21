import type { PixelIcon } from "../types";

// A bunch of grapes with a stem and a leaf.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "grapes",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#.ooo",
    "......#oo",
    "..#...#...#",
    ".###.###.###",
    "..#.#.#.#.#",
    "...###.###",
    "....#.#.#",
    ".....###",
    "......#",
  ],
};

export default icon;
