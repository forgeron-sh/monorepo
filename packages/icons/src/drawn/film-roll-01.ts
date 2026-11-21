import type { PixelIcon } from "../types";

// Film roll: a reel with its hub in the secondary tone and the strip running off to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "film-roll-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "..#....#",
    ".#......#",
    ".#..oo..#",
    ".#..oo..#",
    ".#......#",
    "..#....#",
    "...#########",
    "...........#",
    "....########",
  ],
};

export default icon;
