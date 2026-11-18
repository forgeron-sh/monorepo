import type { PixelIcon } from "../types";

// Circle with three dots in a column in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "more-vertical-circle-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#...oo...#",
    "#..........#",
    "#....oo....#",
    "#....oo....#",
    "#..........#",
    ".#...oo...#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
