import type { PixelIcon } from "../types";

// Annoyed face: the ring of `smile`, half-closed eyes and a flat mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "annoyed",
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
