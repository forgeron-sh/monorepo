import type { PixelIcon } from "../types";

// Copy with a cross: the copy drawing, an x on the front sheet in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "copy-x",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    ".########.#",
    ".#......#.#",
    ".#.o..o.#.#",
    ".#..oo..#.#",
    ".#..oo..###",
    ".#.o..o.#",
    ".#......#",
    ".########",
  ],
};

export default icon;
