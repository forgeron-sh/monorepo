import type { PixelIcon } from "../types";

// Radical sign in the secondary tone inside a circle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "n-th-root-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#....ooo.#",
    "#.....o....#",
    "#....o.....#",
    "#....o.....#",
    "#..oo......#",
    ".#..o.....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
