import type { PixelIcon } from "../types";

// Directional pad: a cross-shaped outline with the centre in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gamepad-directional",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "....#..#",
    ".####..####",
    ".#...oo...#",
    ".#...oo...#",
    ".####..####",
    "....#..#",
    "....#..#",
    "....####",
  ],
};

export default icon;
