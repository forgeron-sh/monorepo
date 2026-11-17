import type { PixelIcon } from "../types";

// Banknote with an arrow flowing down and out to the right, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-send-flow-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#..##..#",
    ".#.#..#.#",
    ".#..##..#",
    ".########",
    "",
    "....o....o",
    "....o.....o",
    "....oooooooo",
    "..........o",
    ".........o",
  ],
};

export default icon;
