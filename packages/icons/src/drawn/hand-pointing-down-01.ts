import type { PixelIcon } from "../types";

// Hand pointing down: the pointing hand of the set turned over, cuff at the top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-pointing-down-01",
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
  ],
};

export default icon;
