import type { PixelIcon } from "../types";

// Wedge of cheese: a sloped top over a front face with two holes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cheese",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "........##",
    "......##..#",
    "....##....#",
    "..##......#",
    ".##########",
    ".#.oo.....#",
    ".#.....oo.#",
    ".##########",
  ],
};

export default icon;
