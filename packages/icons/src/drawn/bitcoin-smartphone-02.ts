import type { PixelIcon } from "../types";

// A wider phone with a bitcoin sign on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-smartphone-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#######",
    "..#.......#",
    "..#.......#",
    "..#.oooo..#",
    "..#.o...o.#",
    "..#.oooo..#",
    "..#.o...o.#",
    "..#.oooo..#",
    "..#.......#",
    "..#..###..#",
    "..#.......#",
    "...#######",
  ],
};

export default icon;
