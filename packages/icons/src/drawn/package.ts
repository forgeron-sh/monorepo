import type { PixelIcon } from "../types";

// Parcel in oblique view: a front face, the top and side faces, the tape in the secondary tone
// across the top and down the front (an isometric box read as a face).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "package",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "..#..oo..##",
    ".########.#",
    ".#..oo..#.#",
    ".#..oo..#.#",
    ".#......#.#",
    ".#......#.#",
    ".#......#.#",
    ".#......##",
    ".########",
  ],
};

export default icon;
