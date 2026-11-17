import type { PixelIcon } from "../types";

// Basketball: a ring, two curved side seams and a two-row band in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "basketball-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..##....##",
    ".#..#..#..#",
    ".#..#..#..#",
    ".oooooooooo",
    ".oooooooooo",
    ".#..#..#..#",
    ".#..#..#..#",
    "..##....##",
    "...######",
  ],
};

export default icon;
