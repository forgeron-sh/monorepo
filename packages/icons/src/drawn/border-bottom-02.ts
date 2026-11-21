import type { PixelIcon } from "../types";

// Bottom border: the bottom side solid in the secondary tone, the rest of the square dotted, without the inner lines of `border-bottom-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-bottom-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.#.#.#.#",
    "",
    ".#.......#",
    "",
    ".#.......#",
    "",
    ".#.......#",
    "",
    ".ooooooooo",
  ],
};

export default icon;
