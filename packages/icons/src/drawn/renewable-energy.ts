import type { PixelIcon } from "../types";

// Renewable energy: a wind turbine, three blades around a hub in the secondary tone, on a mast.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "renewable-energy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".....o",
    "....#.#",
    "...#.#.#",
    "..#..#..#",
    ".....#",
    "...#####",
  ],
};

export default icon;
