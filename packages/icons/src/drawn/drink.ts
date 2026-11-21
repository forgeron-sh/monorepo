import type { PixelIcon } from "../types";

// Cocktail glass: a cone bowl on a stem and foot, the drink in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drink",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "..#oooooo#",
    "...#oooo#",
    "....#oo#",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
