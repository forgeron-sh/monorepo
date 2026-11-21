import type { PixelIcon } from "../types";

// Trailer with a window, a door, a tow bar and a wheel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "caravan",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".#........#",
    ".#.##.###.#",
    ".#.##.#.#.#",
    ".#....#.#.#",
    ".#....#.#.#",
    ".###########",
    "...##",
    "...##",
  ],
};

export default icon;
