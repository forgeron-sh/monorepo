import type { PixelIcon } from "../types";

// Drone from above: a square body, four arms and four propellers in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drone",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooo....ooo",
    "..#......#",
    "...#....#",
    "....####",
    "....#..#",
    "....#..#",
    "....####",
    "...#....#",
    "..#......#",
    ".ooo....ooo",
  ],
};

export default icon;
