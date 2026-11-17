import type { PixelIcon } from "../types";

// Church: a cross in the secondary tone on a pointed roof, and an arched door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "church",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "....oooo",
    ".....oo",
    "....#..#",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..###..###",
  ],
};

export default icon;
