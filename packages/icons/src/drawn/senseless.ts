import type { PixelIcon } from "../types";

// Blank face: the ring of `smile`, flat eyes and a flat mouth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "senseless",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".#........#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
