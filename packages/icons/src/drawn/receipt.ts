import type { PixelIcon } from "../types";

// Receipt torn top and bottom, two lines of text in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##.##.##",
    "..#.#..#.#",
    "..#......#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..#.oooo.#",
    "..#......#",
    "..#.#..#.#",
    "..##.##.##",
  ],
};

export default icon;
