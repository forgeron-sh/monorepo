import type { PixelIcon } from "../types";

// Tired face: the round face with closed, flat eyes and a flat mouth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tired-01",
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
    ".#.oo..oo.#",
    ".#........#",
    ".#........#",
    ".#..####..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
