import type { PixelIcon } from "../types";

// Bottom border: the bottom side solid in the secondary tone, the rest dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-bottom-01",
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
    ".ooooooooo",
  ],
};

export default icon;
