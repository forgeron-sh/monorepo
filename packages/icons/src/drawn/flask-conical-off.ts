import type { PixelIcon } from "../types";

// Empty conical flask of `flask-conical` crossed by a slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flask-conical-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o.######",
    "..o.#..#",
    "...oo..#",
    "...#o...#",
    "..#..o...#",
    ".#....o...#",
    ".#.....o..#",
    ".#......o.#",
    ".#.......o#",
    ".#########o",
    "...........o",
  ],
};

export default icon;
