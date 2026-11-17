import type { PixelIcon } from "../types";

// A pilcrow in the secondary tone in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-pilcrow",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..ooooo.#",
    ".#.oooo.o.#",
    ".#.oooo.o.#",
    ".#..ooo.o.#",
    ".#....o.o.#",
    ".#....o.o.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
