import type { PixelIcon } from "../types";

// Passport with a check badge: `passport` one column left, the globe in the primary tone, the check in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "passport-valid",
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
    ".#........o",
    ".#.##....o",
    ".#....o.o",
    ".####..o",
  ],
};

export default icon;
