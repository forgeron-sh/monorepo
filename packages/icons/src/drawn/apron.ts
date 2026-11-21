import type { PixelIcon } from "../types";

// Apron: a neck loop, a bib, two waist ties and a pocket in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "apron",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...######",
    "...#....#",
    "##.#....#.##",
    "..#......#",
    "..#.oooo.#",
    "..#.o..o.#",
    "..#.oooo.#",
    "..########",
  ],
};

export default icon;
