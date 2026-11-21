import type { PixelIcon } from "../types";

// Plus-minus in a circle: `circle` with `plus-minus` drawn small inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "plus-minus-circle-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#.oooooo.#",
    "#..oooooo..#",
    "#....oo....#",
    "#..........#",
    "#..oooooo..#",
    ".#.oooooo.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
