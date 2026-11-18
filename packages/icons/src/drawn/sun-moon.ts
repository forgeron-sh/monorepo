import type { PixelIcon } from "../types";

// A sun in the secondary tone and a crescent moon.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sun-moon",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..ooo",
    ".ooooo",
    ".ooooo",
    ".ooooo",
    "..ooo.....#",
    "..........##",
    ".........###",
    "........####",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
