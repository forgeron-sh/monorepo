import type { PixelIcon } from "../types";

// Hand pointing down: `hand-pointing-right-01` turned a quarter turn clockwise.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-pointing-down-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#####",
    "...#####",
    "..#######",
    "..########",
    "..######.##",
    "..#######.#",
    "..#.#.#.#",
    "......#",
    "......#",
    "......#",
  ],
};

export default icon;
