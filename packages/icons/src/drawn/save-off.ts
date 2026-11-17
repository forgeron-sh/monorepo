import type { PixelIcon } from "../types";

// Saving off: the floppy disk of `floppy-disk` crossed by a 1:1 slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "save-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o#######",
    ".#o#####.#",
    ".#.o..##..#",
    ".#.#o###..#",
    ".#...o....#",
    ".#.###o##.#",
    ".#.#...o#.#",
    ".#.#....o.#",
    ".#.#....#o#",
    ".#########o",
    "...........o",
  ],
};

export default icon;
