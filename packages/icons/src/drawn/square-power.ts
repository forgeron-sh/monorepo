import type { PixelIcon } from "../types";

// A power symbol in the secondary tone in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-power",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#.o.oo.o.#",
    ".#.o.oo.o.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#..oooo..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
