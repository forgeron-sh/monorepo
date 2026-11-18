import type { PixelIcon } from "../types";

// Shocked face: the face of `smile` with raised eyes and a round open mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shocked",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
