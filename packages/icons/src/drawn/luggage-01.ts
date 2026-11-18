import type { PixelIcon } from "../types";

// Suitcase standing up: a handle, a body with two straps, two small wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "luggage-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "..########",
    "..#......#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#......#",
    "..########",
    "...#....#",
  ],
};

export default icon;
