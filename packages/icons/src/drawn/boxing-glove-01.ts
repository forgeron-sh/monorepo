import type { PixelIcon } from "../types";

// Boxing glove, one-pixel outline: a rounded mitt, the thumb set apart, a cuff in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "boxing-glove-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....######",
    "...#......#",
    "..#.......#",
    ".##.......#",
    "#..#......#",
    "#..#......#",
    ".#.#......#",
    "..#......#",
    "...######",
    "...oooooo",
    "...######",
  ],
};

export default icon;
