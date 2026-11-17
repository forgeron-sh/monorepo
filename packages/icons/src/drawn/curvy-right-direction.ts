import type { PixelIcon } from "../types";

// An arrow that rises and curves to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "curvy-right-direction",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".........#",
    ".....######",
    "....#....#",
    "...#....#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
  ],
};

export default icon;
