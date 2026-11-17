import type { PixelIcon } from "../types";

// Confused face: two eyes and a wavy mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "confused",
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
    ".#..oo..o.#",
    ".#.o..oo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
