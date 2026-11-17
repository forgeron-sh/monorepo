import type { PixelIcon } from "../types";

// Activity in a circle: a pulse line inside a ring.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "activity-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#...#....#",
    "#...#.#....#",
    "#...#.#....#",
    "#.##..#.##.#",
    "#......#...#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
