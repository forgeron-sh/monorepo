import type { PixelIcon } from "../types";

// Sad face: `smile` with the mouth turned down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sad-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
