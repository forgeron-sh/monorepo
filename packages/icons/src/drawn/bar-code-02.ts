import type { PixelIcon } from "../types";

// Barcode with taller guard bars at both ends, like a retail code.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bar-code-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#........#",
    ".#........#",
  ],
};

export default icon;
