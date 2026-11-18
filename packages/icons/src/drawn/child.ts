import type { PixelIcon } from "../types";

// Child: a small person, a round head over short shoulders, in the user style.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "child",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "....#..#",
    "....#..#",
    ".....##",
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
