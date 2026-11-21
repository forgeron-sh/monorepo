import type { PixelIcon } from "../types";

// Gymnast in a star jump: arms and legs spread at 45°.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gymnastic",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#...##...#",
    "..#..##..#",
    "...#....#",
    "....####",
    ".....##",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    ".#........#",
  ],
};

export default icon;
