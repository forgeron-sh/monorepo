import type { PixelIcon } from "../types";

// Ferris wheel: a ring with crossed spokes, the hub in the secondary tone, the lower spokes running on as the legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ferris-wheel",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    "..##....##",
    ".#..#..#..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..#..#..#",
    "..##....##",
    "..##....##",
    ".#..####..#",
    "#..........#",
  ],
};

export default icon;
