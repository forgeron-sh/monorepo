import type { PixelIcon } from "../types";

// Honey jar: a lidded jar filled with honey in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "honey-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...######",
    "..#......#",
    ".#........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
