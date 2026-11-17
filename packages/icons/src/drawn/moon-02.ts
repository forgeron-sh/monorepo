import type { PixelIcon } from "../types";

// Crescent moon opening to the upper right, inside the circle of the `clock-01` ring.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###",
    "..#.#",
    ".#..#",
    ".#..#",
    ".#..#",
    ".#...#",
    ".#....#####",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
