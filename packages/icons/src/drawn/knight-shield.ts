import type { PixelIcon } from "../types";

// Knight shield: the shield of `shield-01` crossed by a heraldic bend in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "knight-shield",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.......o#",
    ".#......o.#",
    ".#.....o..#",
    ".#....o...#",
    "..#..o...#",
    "...#o...#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
