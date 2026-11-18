import type { PixelIcon } from "../types";

// Eid: a crescent moon with a small lantern hanging beside it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "eid-mubarak",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    "..###....o",
    ".#..##..ooo",
    "#...#...o.o",
    "#..#....o.o",
    "#..#....ooo",
    "#..#.....o",
    "#...#",
    ".#..##",
    "..###",
  ],
};

export default icon;
