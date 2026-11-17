import type { PixelIcon } from "../types";

// Hand pointing left: the solid hand of `hand` turned a quarter turn, the index finger extended.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-pointing-left-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "......##",
    "....##.##",
    ".....######",
    ".##########",
    ".....######",
    "....#######",
    ".....######",
    "....#####",
  ],
};

export default icon;
