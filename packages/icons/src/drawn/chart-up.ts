import type { PixelIcon } from "../types";

// Trend up: a zigzag line climbing to the upper right, its arrowhead in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "........ooo",
    ".........#o",
    "........#.o",
    ".......#",
    "....#.#",
    "...#.#",
    "..#",
    ".#",
  ],
};

export default icon;
