import type { PixelIcon } from "../types";

// Quran: the closed book of `book-01` with a crescent in the secondary tone on its cover.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "quran-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..##.....#",
    "..##..oo.#",
    "..##.o...#",
    "..##.o...#",
    "..##.o...#",
    "..##..oo.#",
    "..##.....#",
    "..##.....#",
    "..########",
  ],
};

export default icon;
