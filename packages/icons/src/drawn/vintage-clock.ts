import type { PixelIcon } from "../types";

// Mantel clock: an arched case with a round face, the hands in the secondary tone, on two feet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "vintage-clock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#..####..#",
    ".#.#.o..#.#",
    ".#.#.oo.#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#..####..#",
    ".##########",
    ".##......##",
  ],
};

export default icon;
