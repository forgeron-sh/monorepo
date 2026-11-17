import type { PixelIcon } from "../types";

// Right border: the right side solid in the secondary tone, the rest of the square dotted, without the inner lines of `border-right-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-right-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.#.#.#.o",
    ".........o",
    ".#.......o",
    ".........o",
    ".#.......o",
    ".........o",
    ".#.......o",
    ".........o",
    ".#.#.#.#.o",
  ],
};

export default icon;
