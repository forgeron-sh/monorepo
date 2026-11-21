import type { PixelIcon } from "../types";

// Tropical storm: the weather symbol, a ring with two curved arms in half-turn symmetry.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tropical-storm",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......####",
    ".....#",
    "....#",
    "....###",
    "....#..#",
    "....#..#",
    ".....###",
    ".......#",
    "......#",
    "..####",
  ],
};

export default icon;
