import type { PixelIcon } from "../types";

// Passport with a cross badge: `passport` one column left, the globe in the primary tone, the cross in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "passport-expired",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#..##..#",
    ".#.#..#.#",
    ".#.#..#.#",
    ".#..##..#",
    ".#",
    ".#....o...o",
    ".#.##..o.o",
    ".#......o",
    ".####..o.o",
    "......o...o",
  ],
};

export default icon;
