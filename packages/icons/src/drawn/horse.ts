import type { PixelIcon } from "../types";

// Horse: a solid side silhouette walking right, head raised.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "horse",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........####",
    ".......##..#",
    ".......##",
    ".########",
    "#########",
    "#.#######",
    "..##..##",
    "..#....#",
    "..#....#",
  ],
};

export default icon;
