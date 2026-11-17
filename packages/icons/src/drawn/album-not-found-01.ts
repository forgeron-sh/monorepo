import type { PixelIcon } from "../types";

// Album not found: the stacked frames of `album-02`, a cross in the front one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "album-not-found-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    ".########.#",
    ".#......#.#",
    ".#.o..o.#.#",
    ".#..oo..#.#",
    ".#..oo..#.#",
    ".#.o..o.###",
    ".#......#",
    ".########",
  ],
};

export default icon;
