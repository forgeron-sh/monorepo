import type { PixelIcon } from "../types";

// A neutral face: the face of `smile` with a straight mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "neutral",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#........#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
