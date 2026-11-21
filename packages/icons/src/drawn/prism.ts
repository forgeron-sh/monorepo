import type { PixelIcon } from "../types";

// Triangular prism lying down: the front triangle on the left, the ridge and the back edge running right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "prism",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "..#.#....#",
    "..#.#....#",
    ".#...#....#",
    ".#...#....#",
    "#.....#....#",
    "#.....#....#",
    "############",
  ],
};

export default icon;
