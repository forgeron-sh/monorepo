import type { PixelIcon } from "../types";

// Gibbous moon: a circle mostly lit in the secondary tone, a thin dark crescent on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gibbous-moon",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oooo.#",
    ".#..ooooo.#",
    "#..ooooooo.#",
    "#..ooooooo.#",
    "#..ooooooo.#",
    "#..ooooooo.#",
    ".#..ooooo.#",
    ".#...oooo.#",
    "..##....##",
    "....####",
  ],
};

export default icon;
