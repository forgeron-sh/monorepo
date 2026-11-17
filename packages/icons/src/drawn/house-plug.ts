import type { PixelIcon } from "../types";

// House with a plug inside: the outline of `home-01` without its door, a plug in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "house-plug",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#..o..o..#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#...oo...#",
    ".##########",
  ],
};

export default icon;
