import type { PixelIcon } from "../types";

// Flower pot: a round flower in the secondary tone on a stem over the pot of `plant-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flower-pot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "....oooo",
    "....oooo",
    ".....oo",
    ".....##",
    ".....##",
    "..########",
    "..#......#",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
