import type { PixelIcon } from "../types";

// Cable: a cable with a plug at each end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cable",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".#.#",
    "#####",
    "#...#",
    "#####",
    "..#",
    "..#",
    "..#######",
    "........#",
    ".......#####",
    ".......#...#",
    ".......#####",
    "........#.#",
  ],
};

export default icon;
