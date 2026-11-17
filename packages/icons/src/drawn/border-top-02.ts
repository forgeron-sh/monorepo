import type { PixelIcon } from "../types";

// Top border: the square of `border-bottom-01` split in four, the top side solid in the secondary tone, the rest dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-top-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooooooooo",
    "",
    ".#...#...#",
    "",
    ".#.#.#.#.#",
    "",
    ".#...#...#",
    "",
    ".#.#.#.#.#",
  ],
};

export default icon;
