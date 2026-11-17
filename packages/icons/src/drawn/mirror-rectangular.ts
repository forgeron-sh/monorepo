import type { PixelIcon } from "../types";

// Tall rectangular wall mirror with a diagonal glint in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mirror-rectangular",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#....o.#",
    "..#...o..#",
    "..#..o...#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
