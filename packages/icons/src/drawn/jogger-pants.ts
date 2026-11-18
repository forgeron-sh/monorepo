import type { PixelIcon } from "../types";

// Jogger pants: a waistband, two legs tapering to cuffs in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "jogger-pants",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...##...#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..ooo..ooo",
    "..ooo..ooo",
  ],
};

export default icon;
