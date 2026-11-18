import type { PixelIcon } from "../types";

// Tent: a triangle with 2:1 sides, the door flap in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tent",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#.oo.#",
    "..#.o..o.#",
    "..#.o..o.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".##########",
  ],
};

export default icon;
