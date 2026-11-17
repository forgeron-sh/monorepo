import type { PixelIcon } from "../types";

// No border: a dotted square without the inner lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-none-02",
  implemented: true,
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
    ".#.#.#.#.#",
  ],
};

export default icon;
