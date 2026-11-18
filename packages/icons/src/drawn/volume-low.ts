import type { PixelIcon } from "../types";

// Speaker with one small wave in the secondary tone, set one column right to stay centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "volume-low",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......#",
    ".....##",
    "..###.#.o",
    "..#...#..o",
    "..#...#..o",
    "..###.#.o",
    ".....##",
    "......#",
  ],
};

export default icon;
