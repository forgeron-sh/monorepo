import type { PixelIcon } from "../types";

// Birdhouse: a pitched roof over a box with a round entrance hole in the secondary tone, on a post.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "birdhouse",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".##########",
    "..#......#",
    "..#..oo..#",
    "..#..oo..#",
    "..#......#",
    "..########",
    ".....##",
    ".....##",
  ],
};

export default icon;
