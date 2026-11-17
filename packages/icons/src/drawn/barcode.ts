import type { PixelIcon } from "../types";

// Barcode: bars of one and two pixels, symmetric.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "barcode",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##.#..#.##",
    ".##.#..#.##",
    ".##.#..#.##",
    ".##.#..#.##",
    ".##.#..#.##",
    ".##.#..#.##",
    ".##.#..#.##",
    ".##.#..#.##",
  ],
};

export default icon;
