import type { PixelIcon } from "../types";

// Television: an antenna, a screen, two feet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tv-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "....#..#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    "..#......#",
  ],
};

export default icon;
