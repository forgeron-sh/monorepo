import type { PixelIcon } from "../types";

// Shaka sign, back of the hand: `shaka-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shaka-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#.........#",
    ".#.#.#.#..#",
    ".#######.#",
    ".########",
    ".#######",
    "..#####",
    "",
    "..#####",
  ],
};

export default icon;
