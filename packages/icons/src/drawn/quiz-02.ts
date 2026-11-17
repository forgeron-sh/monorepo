import type { PixelIcon } from "../types";

// Quiz: `clipboard` with a question mark in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "quiz-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##.#..#.##",
    ".#..####..#",
    ".#..oooo..#",
    ".#.o....o.#",
    ".#.....oo.#",
    ".#....o...#",
    ".#....o...#",
    ".#........#",
    ".#....o...#",
    ".##########",
  ],
};

export default icon;
