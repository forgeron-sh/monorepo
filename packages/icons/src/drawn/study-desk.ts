import type { PixelIcon } from "../types";

// The desk of the set with a reading lamp on it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "study-desk",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...ooo",
    "..ooooo",
    "....o",
    "...ooo",
    "############",
    ".#.....#...#",
    ".#.....#.#.#",
    ".#.....#####",
    ".#.....#...#",
    ".#.....#.#.#",
    ".#.....#####",
  ],
};

export default icon;
