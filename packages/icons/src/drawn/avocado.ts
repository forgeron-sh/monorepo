import type { PixelIcon } from "../types";

// Avocado: a pear-shaped half with its round stone in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "avocado",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
