import type { PixelIcon } from "../types";

// Hand pointing down at a spot: `hand-pointing-down-01` over a short line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hand-pointing-down-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#####",
    "",
    ".....#####",
    "....#######",
    "...########",
    "..#.#######",
    ".#..#.#.#.#",
    "....#",
    "....#",
    "",
    "..ooooo",
  ],
};

export default icon;
