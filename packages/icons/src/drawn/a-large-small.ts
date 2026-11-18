import type { PixelIcon } from "../types";

// Text size: a large capital A beside a small one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "a-large-small",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..#.#",
    "..#.#",
    ".#...#",
    ".#...#",
    "#.....#...#",
    "#######..#.#",
    "#.....#..###",
    "#.....#..#.#",
    "#.....#..#.#",
  ],
};

export default icon;
