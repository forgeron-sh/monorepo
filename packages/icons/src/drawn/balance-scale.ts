import type { PixelIcon } from "../types";

// Balance: a post, a beam, two pans in the secondary tone, a base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "balance-scale",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".##########",
    ".#...##...#",
    "#.#..##..#.#",
    "oooo.##.oooo",
    ".....##",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
