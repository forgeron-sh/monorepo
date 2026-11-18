import type { PixelIcon } from "../types";

// Playground slide: a ladder on the left and the slide running down to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "slide",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".#.##",
    ".###.#",
    ".#.#..#",
    ".###...#",
    ".#.#....#",
    ".###.....#",
    ".#.#......##",
    ".#.#",
    ".#.#",
  ],
};

export default icon;
