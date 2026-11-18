import type { PixelIcon } from "../types";

// Popcorn: a scalloped top of kernels over a tapered striped bucket, stripes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "popcorn",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#..##..#",
    ".#........#",
    ".##########",
    ".#..o..o..#",
    ".#..o..o..#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..########",
  ],
};

export default icon;
