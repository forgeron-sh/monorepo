import type { PixelIcon } from "../types";

// Radar scope: the copyright ring, a centre dot and the sweep in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "radar-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#.......o#",
    ".#......o..#",
    "#......o...#",
    "#....##....#",
    "#....##....#",
    "#..........#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
