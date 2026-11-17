import type { PixelIcon } from "../types";

// The die of `dice` showing four, one pip in each corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dice-faces-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#........#",
    ".#........#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
