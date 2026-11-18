import type { PixelIcon } from "../types";

// Shop sign: a board hanging from a nail by two strings, two lines of lettering in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shop-sign",
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
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooo...#",
    ".##########",
  ],
};

export default icon;
