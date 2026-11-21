import type { PixelIcon } from "../types";

// Wardrobe: two doors with handles in the secondary tone, two feet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wardrobe-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#########",
    "..#...#...#",
    "..#...#...#",
    "..#...#...#",
    "..#.o.#.o.#",
    "..#.o.#.o.#",
    "..#...#...#",
    "..#...#...#",
    "..#...#...#",
    "..#########",
    "..#.......#",
  ],
};

export default icon;
