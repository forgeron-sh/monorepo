import type { PixelIcon } from "../types";

// Archer's bow: a curved bow and its string, an arrow drawn across it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "archer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##",
    "...#.#",
    "...#..#",
    "...#...#",
    "o..#...#.o",
    ".oooooooooo",
    "o..#...#.o",
    "...#...#",
    "...#..#",
    "...#.#",
    "...##",
  ],
};

export default icon;
