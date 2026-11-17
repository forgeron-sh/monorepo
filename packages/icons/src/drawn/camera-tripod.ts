import type { PixelIcon } from "../types";

// Camera tripod: a small camera on a three-legged stand, the lens in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-tripod",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    ".##########",
    ".#...oo...#",
    ".#..o..o..#",
    ".#...oo...#",
    ".##########",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
  ],
};

export default icon;
