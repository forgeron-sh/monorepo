import type { PixelIcon } from "../types";

// Tennis ball: the ring of `basketball-01` and two curved seams in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tennis-ball",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..##....##",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#.o....o.#",
    "..##....##",
    "...######",
  ],
};

export default icon;
