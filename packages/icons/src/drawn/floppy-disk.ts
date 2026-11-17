import type { PixelIcon } from "../types";

// Floppy disk, to save: a body with a cut corner, a shutter with its slot at the top and a label
// at the bottom (a first version with shutter and label of the same width read as an H).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "floppy-disk",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#.#####.#",
    ".#.#..##..#",
    ".#.#####..#",
    ".#........#",
    ".#.######.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".##########",
  ],
};

export default icon;
