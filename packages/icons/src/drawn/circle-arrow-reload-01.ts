import type { PixelIcon } from "../types";

// Reload: the loop of `square-arrow-reload-01` inside a ring.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-reload-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..ooo.o.#",
    ".#.o...oo.#",
    ".#.o..ooo.#",
    ".#.o......#",
    ".#.o....o.#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
