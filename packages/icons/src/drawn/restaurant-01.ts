import type { PixelIcon } from "../types";

// Restaurant: a fork and a knife side by side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "restaurant-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#.#.#..#",
    "..#.#.#.##",
    "..#.#.#.##",
    "..#####.##",
    "...###..##",
    "....#....#",
    "....#....#",
    "....#....#",
    "....#....#",
    "....#....#",
  ],
};

export default icon;
