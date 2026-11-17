import type { PixelIcon } from "../types";

// Doughnut seen from above: the ring of `circle`, a round hole, two sprinkles in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "donut",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#..oo....#",
    ".#........#",
    "#....##....#",
    "#...#..#...#",
    "#...#..#...#",
    "#....##....#",
    ".#........#",
    ".#....oo..#",
    "..##....##",
    "....####",
  ],
};

export default icon;
