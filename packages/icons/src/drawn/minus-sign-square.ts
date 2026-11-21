import type { PixelIcon } from "../types";

// Minus in a box: the box of `checkmark-square-01`, a two-pixel minus in the secondary tone.
// Same drawing as `remove-square`: the two names mean the same thing. A four-pixel
// minus was tried and read as a dot at 16 px.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "minus-sign-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
