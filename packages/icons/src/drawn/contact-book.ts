import type { PixelIcon } from "../types";

// Address book: a cover with a person and index tabs in the secondary tone on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "contact-book",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#......#",
    ".#..##..#o",
    ".#..##..#o",
    ".#......#",
    ".#.####.#",
    ".#.####.#o",
    ".#......#o",
    ".#......#",
    ".########",
  ],
};

export default icon;
