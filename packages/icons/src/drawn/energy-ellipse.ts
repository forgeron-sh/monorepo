import type { PixelIcon } from "../types";

// A circle with the lightning bolt of `energy-rectangle` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "energy-ellipse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#....oo..#",
    "#....oo....#",
    "#...oooo...#",
    "#...oooo...#",
    "#....oo....#",
    ".#..oo....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
