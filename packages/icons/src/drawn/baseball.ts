import type { PixelIcon } from "../types";

// Baseball: the ring of `circle` with two curved seams in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "baseball",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#.o....o.#",
    ".#..o..o..#",
    "#...o..o...#",
    "#...o..o...#",
    "#...o..o...#",
    "#...o..o...#",
    ".#..o..o..#",
    ".#.o....o.#",
    "..##....##",
    "....####",
  ],
};

export default icon;
