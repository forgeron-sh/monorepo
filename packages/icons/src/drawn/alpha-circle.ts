import type { PixelIcon } from "../types";

// Alpha in a circle: the ring of `circle` and the letter α in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alpha-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..oo..o.#",
    "#..o..o.o..#",
    "#..o...o...#",
    "#..o...o...#",
    "#..o..o.o..#",
    ".#..oo..o.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
