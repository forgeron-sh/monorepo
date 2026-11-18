import type { PixelIcon } from "../types";

// Repeat: two arrows chasing each other round a rectangle, 45° heads, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "repeat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".........#",
    ".##########",
    ".#.......#",
    ".#......#",
    "...#......#",
    "..#.......#",
    ".##########",
    "..#",
    "...#",
  ],
};

export default icon;
