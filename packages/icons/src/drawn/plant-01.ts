import type { PixelIcon } from "../types";

// Potted plant: two leaves in the secondary tone on a stem over a tapered pot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "plant-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooo....ooo",
    ".oooo..oooo",
    "..ooo..ooo",
    "....o..o",
    ".....oo",
    "..########",
    "..#......#",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
