import type { PixelIcon } from "../types";

// A stack of two sheets, the front one with a bookmark ribbon.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "collections-bookmark",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    ".########.#",
    ".#.oooo.#.#",
    ".#.oooo.#.#",
    ".#.oooo.#.#",
    ".#.o..o.#.#",
    ".#......#.#",
    ".#......###",
    ".#......#",
    ".########",
  ],
};

export default icon;
