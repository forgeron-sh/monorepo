import type { PixelIcon } from "../types";

// Burning a disc: the compact disc of `cd` with a small flame in the secondary tone in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "burning-cd",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#....##....#",
    "#...#..#...#",
    "#...#..#...#",
    "#....##",
    ".#.........o",
    ".#........oo",
    "..##.....ooo",
    "....##....o",
  ],
};

export default icon;
