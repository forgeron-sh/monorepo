import type { PixelIcon } from "../types";

// A shopping bag with its handle and a bitcoin sign on the bag.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-shopping",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "..########",
    "..#......#",
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
