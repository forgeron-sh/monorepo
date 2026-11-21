import type { PixelIcon } from "../types";

// Half coconut filled with milk in the secondary tone, with a straw.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "milk-coconut",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........#",
    ".........#",
    "........#",
    ".......#",
    "############",
    "#.oooooooo.#",
    "#..oooooo..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
