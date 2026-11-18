import type { PixelIcon } from "../types";

// An arrow that rises and curves to the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "curvy-left-direction",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..#",
    ".######",
    "..#....#",
    "...#....#",
    ".........#",
    ".........#",
    ".........#",
    ".........#",
    ".........#",
  ],
};

export default icon;
