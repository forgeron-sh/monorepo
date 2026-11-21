import type { PixelIcon } from "../types";

// Person standing: the head of `walking` over a straight body, arms out, legs apart.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "person-standing",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    "",
    "....####",
    "...#.##.#",
    "..#..##..#",
    ".....##",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
  ],
};

export default icon;
