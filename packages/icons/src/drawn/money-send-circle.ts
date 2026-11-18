import type { PixelIcon } from "../types";

// Coin with a dollar sign and an arrow going out at the top right, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-send-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........ooo",
    "..........oo",
    "..####...o.o",
    ".#......o",
    "#...#",
    "#..###...#",
    "#..#.....#",
    "#..###...#",
    "#....#...#",
    "#..###...#",
    ".#......#",
    "..######",
  ],
};

export default icon;
