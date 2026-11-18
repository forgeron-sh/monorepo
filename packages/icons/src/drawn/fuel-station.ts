import type { PixelIcon } from "../types";

// Fuel pump: a body with its display in the secondary tone and a hose on the side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fuel-station",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#....#.#",
    ".#.oo.#..#",
    ".#.oo.#..#",
    ".#....##.#",
    ".#....#..#",
    ".#....#..#",
    ".#....#.#",
    ".#....#",
    "########",
  ],
};

export default icon;
