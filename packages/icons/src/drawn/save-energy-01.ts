import type { PixelIcon } from "../types";

// Save energy: the open hand of `hand-heart` under a lightning bolt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "save-energy-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......oo",
    ".....oo",
    "....ooooo",
    "......oo",
    ".....oo",
    "....oo",
    "",
    "#.....##",
    "#.###...#",
    "#....####",
    "#.....#",
    "#",
  ],
};

export default icon;
