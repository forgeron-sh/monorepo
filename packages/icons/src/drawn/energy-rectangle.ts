import type { PixelIcon } from "../types";

// A rounded rectangle with a lightning bolt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "energy-rectangle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#....oo..#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#..oo....#",
    "..########",
  ],
};

export default icon;
