import type { PixelIcon } from "../types";

// No border: a square split in four, all lines dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-none-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.#.#.#.#",
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
