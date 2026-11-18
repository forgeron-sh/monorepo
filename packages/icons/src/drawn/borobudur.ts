import type { PixelIcon } from "../types";

// Borobudur: a bell stupa on stepped terraces.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "borobudur",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..########",
    "..#......#",
    ".##########",
    ".#........#",
    "############",
    "#..........#",
    "#..........#",
    "############",
  ],
};

export default icon;
