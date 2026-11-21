import type { PixelIcon } from "../types";

// Hot-air balloon: a round envelope with ropes down to a basket in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hot-air-balloon",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...#....#",
    "....####",
    "....#..#",
    "....#..#",
    "....oooo",
    "....oooo",
  ],
};

export default icon;
