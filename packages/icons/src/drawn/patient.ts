import type { PixelIcon } from "../types";

// Patient: a person with a medical cross badge in the secondary tone, lower right. Built on `user-warning-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "patient",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..###...oo",
    ".#......oo",
    ".#....oooooo",
    ".#....oooooo",
    ".####...oo",
    "........oo",
  ],
};

export default icon;
