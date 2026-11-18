import type { PixelIcon } from "../types";

// Stretch: a person reaching both arms overhead in a wide stance, the head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "workout-stretching",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "...#.oo.#",
    "...#.oo.#",
    "...#....#",
    "....####",
    ".....##",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    ".#........#",
  ],
};

export default icon;
