import type { PixelIcon } from "../types";

// Woman: a pictogram with a head in the secondary tone and a widening dress (no face).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "woman",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    "",
    "....####",
    "...######",
    "...######",
    "..########",
    "..########",
    "....#..#",
    "....#..#",
  ],
};

export default icon;
