import type { PixelIcon } from "../types";

// Pilcrow: a solid bowl with two stems.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "paragraph",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#####.#",
    "..#####.#",
    "..#####.#",
    "...####.#",
    "......#.#",
    "......#.#",
    "......#.#",
    "......#.#",
    "......#.#",
  ],
};

export default icon;
