import type { PixelIcon } from "../types";

// A round face with raised eyes and an open mouth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "surprise",
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
    ".#...oo...#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
