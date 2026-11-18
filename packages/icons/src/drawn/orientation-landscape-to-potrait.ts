import type { PixelIcon } from "../types";

// Landscape screen turning into a portrait one, the arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "orientation-landscape-to-potrait",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "#######",
    "#.....#",
    "#.....#",
    "#.....#",
    "#.....#",
    "#######.####",
    ".o......#..#",
    ".o..o...#..#",
    ".o...o..#..#",
    "..ooooo.#..#",
    ".....o..#..#",
    "....o...####",
  ],
};

export default icon;
