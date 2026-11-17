import type { PixelIcon } from "../types";

// Ampersand: the & sign.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ampersand",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###",
    "..#...#",
    "..#...#",
    "...#.#",
    "....#",
    "...#.#...#",
    "..#...#.#",
    "..#....#",
    "..#...#.#",
    "...###...#",
  ],
};

export default icon;
