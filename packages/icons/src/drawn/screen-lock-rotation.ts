import type { PixelIcon } from "../types";

// Lock the screen rotation: the phone and arc of `screen-rotation`, a padlock badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "screen-lock-rotation",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "........#",
    "..####...#",
    ".#....#...#",
    ".#....#...#",
    ".#....#",
    ".#....#..oo",
    ".#....#.o..o",
    ".#....#.oooo",
    "..####..oooo",
  ],
};

export default icon;
