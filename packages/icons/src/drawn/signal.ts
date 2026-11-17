import type { PixelIcon } from "../types";

// Signal strength: four one-pixel bars rising, two-pixel gaps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..........#",
    "..........#",
    ".......#..#",
    ".......#..#",
    "....#..#..#",
    "....#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
  ],
};

export default icon;
