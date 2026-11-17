import type { PixelIcon } from "../types";

// Tram seen from the front: the flat bar of its pantograph on a mast (a V read as a TV antenna), a windscreen in the secondary tone, its wheels on the rail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tram",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".....##",
    "..########",
    "..#oooooo#",
    "..#oooooo#",
    "..#......#",
    "..#......#",
    "..########",
    "...#....#",
    ".##########",
  ],
};

export default icon;
