import type { PixelIcon } from "../types";

// A padlock with a bitcoin sign on its body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-lock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "...#....#",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..o...o.#",
    ".#..oooo..#",
    ".#..o...o.#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
