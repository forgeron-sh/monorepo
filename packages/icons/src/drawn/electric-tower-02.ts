import type { PixelIcon } from "../types";

// A utility pole: a straight post with two cross-arms and insulators at their ends.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "electric-tower-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#...##...#",
    ".##########",
    ".....##",
    ".....##",
    "..#..##..#",
    "..########",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "....####",
  ],
};

export default icon;
