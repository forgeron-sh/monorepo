import type { PixelIcon } from "../types";

// Radical sign with a small index n, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "n-th-root",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......######",
    "......#",
    "oo...#",
    "o.o..#",
    "o.o.#",
    "....#",
    "#..#",
    ".#.#",
    "..#",
  ],
};

export default icon;
