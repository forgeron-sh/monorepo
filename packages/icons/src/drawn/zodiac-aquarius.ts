import type { PixelIcon } from "../types";

// Aquarius: two parallel zigzag lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-aquarius",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#...#...#",
    ".#.#.#.#.#.#",
    "#...#...#",
    "",
    "",
    "..#...#...#",
    ".#.#.#.#.#.#",
    "#...#...#",
  ],
};

export default icon;
