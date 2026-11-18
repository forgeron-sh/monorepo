import type { PixelIcon } from "../types";

// Repository: a book-shaped page with two lines of text and a bookmark ribbon hanging below in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "repository",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#.###..#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..##ooo###",
    "....ooo",
    "....o.o",
  ],
};

export default icon;
