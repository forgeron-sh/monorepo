import type { PixelIcon } from "../types";

// The shield of `shield-01` with a bitcoin sign inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-shield",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..o...o.#",
    ".#..oooo..#",
    ".#..o...o.#",
    ".#..oooo..#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
