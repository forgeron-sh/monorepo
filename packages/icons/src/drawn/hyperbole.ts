import type { PixelIcon } from "../types";

// Hyperbola: two curves turned back to back, each bending at its vertex.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hyperbole",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#..........#",
    ".#........#",
    "..#......#",
    "..#......#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    ".#........#",
    "#..........#",
  ],
};

export default icon;
