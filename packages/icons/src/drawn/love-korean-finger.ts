import type { PixelIcon } from "../types";

// Finger heart: the fist of `hand-fist` with the thumb and index crossed above it, a small heart in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "love-korean-finger",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......oo.oo",
    "......ooooo",
    ".......ooo",
    "..#.#...o",
    "...#",
    "..#.#.#.#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
