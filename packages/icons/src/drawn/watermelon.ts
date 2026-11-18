import type { PixelIcon } from "../types";

// A slice of watermelon: a half disc with its rind line and seeds in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "watermelon",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..o..o..o.#",
    "#..o..o..o.#",
    ".#........#",
    ".#oooooooo#",
    "..##....##",
    "....####",
  ],
};

export default icon;
