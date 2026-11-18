import type { PixelIcon } from "../types";

// A ruler with ticks beside the pencil of `pencil`, its eraser in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pencil-ruler",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..oooo",
    ".#..#..oooo",
    ".##.#..####",
    ".#..#..#..#",
    ".##.#..#..#",
    ".#..#..#..#",
    ".##.#..#..#",
    ".#..#..#..#",
    ".##.#...##",
    ".####...##",
  ],
};

export default icon;
