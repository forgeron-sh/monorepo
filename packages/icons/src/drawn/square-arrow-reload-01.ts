import type { PixelIcon } from "../types";

// A circular reload arrow in the secondary tone in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-reload-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..ooo.o.#",
    ".#.o...oo.#",
    ".#.o..ooo.#",
    ".#.o......#",
    ".#.o....o.#",
    ".#..oooo..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
