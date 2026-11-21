import type { PixelIcon } from "../types";

// Nerd face: a round head with big square glasses in the secondary tone and a small grin.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "nerd",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#.ooo..ooo.#",
    "#.o.oooo.o.#",
    "#.ooo..ooo.#",
    "#..........#",
    ".#..####..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
