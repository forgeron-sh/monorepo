import type { PixelIcon } from "../types";

// Hourglass: two glass bulbs between plates, the sand fallen to the bottom in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hourglass",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    ".....##",
    "....#..#",
    "...#.oo.#",
    "..#oooooo#",
    ".##########",
  ],
};

export default icon;
