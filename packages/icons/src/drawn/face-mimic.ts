import type { PixelIcon } from "../types";

// Facial expression: the round face of `smile`, one eye open, one winking, the mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "face-mimic",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#.....#",
    ".#..#..##.#",
    ".#........#",
    ".#.o....o.#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
