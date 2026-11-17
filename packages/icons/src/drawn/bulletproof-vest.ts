import type { PixelIcon } from "../types";

// Bulletproof vest: shoulder straps, a neck opening, the armour plate in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bulletproof-vest",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".#..#..#..#",
    ".#...##...#",
    ".#........#",
    ".#.oooooo.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#.oooooo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
