import type { PixelIcon } from "../types";

// Refrigerator: a tall box, freezer door on top, two handles, small feet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "refrigerator",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    "..#......#",
    "..#.#....#",
    "..#.#....#",
    "..########",
    "..#......#",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..#......#",
    "..########",
    "...#....#",
  ],
};

export default icon;
