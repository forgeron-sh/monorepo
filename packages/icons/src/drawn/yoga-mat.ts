import type { PixelIcon } from "../types";

// Yoga mat half rolled: a roll on the left, the flat end to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "yoga-mat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    ".####",
    "#....#",
    "#.oo.#",
    "#.oo.#",
    "#....#.....#",
    ".###########",
  ],
};

export default icon;
