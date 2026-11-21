import type { PixelIcon } from "../types";

// Seesaw: a tilted plank resting on a triangular pivot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "seesaw",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "##",
    "..##",
    "....##",
    "......##",
    ".....##.##",
    "....#..#..##",
    "....#..#",
    "...#....#",
    "...######",
  ],
};

export default icon;
