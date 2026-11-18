import type { PixelIcon } from "../types";

// A hand truck carrying a box, with its wheel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "trolley-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##",
    "..#.######",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..#########",
    "..##",
    ".#..#",
    ".#..#",
    "..##",
  ],
};

export default icon;
