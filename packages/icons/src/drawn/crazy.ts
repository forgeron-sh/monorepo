import type { PixelIcon } from "../types";

// Crazy face: mismatched eyes and a wavy mouth in the secondary tone (the smile base).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "crazy",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.##..#..#",
    ".#.##..#..#",
    ".#........#",
    ".#..oo..o.#",
    ".#.o..oo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
