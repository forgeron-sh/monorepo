import type { PixelIcon } from "../types";

// Adhesive bandage on a diagonal with its pad in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bandage",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......#",
    ".....#.#",
    "....#...#",
    "...#.o...#",
    "..#.ooo.#",
    ".#...o.#",
    "..#...#",
    "...#.#",
    "....#",
  ],
};

export default icon;
